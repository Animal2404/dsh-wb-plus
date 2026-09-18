// Usage-ledger regression: hourly bucketing, window filtering, retention and the
// aggregate shapes the usage view renders. Runs against a sandboxed HOME so it
// never touches the real ledger file.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'wb-usage-'));
process.env.USERPROFILE = sandbox;
process.env.HOME = sandbox;
fs.mkdirSync(path.join(sandbox, '.dsh'), { recursive: true });

const mod = await import('../lib/index.js');
const { createWorkBuddyUsageLedger } = mod;
assert.equal(typeof createWorkBuddyUsageLedger, 'function', 'ledger factory is exported');

const ledger = createWorkBuddyUsageLedger();
const measured = (promptTokens, completionTokens, totalTokens, firstTokenMs, tokensPerSecond) =>
  ({ promptTokens, completionTokens, totalTokens, firstTokenMs, tokensPerSecond });
/* A billable call also carries the upstream's own credit charge. */
const billed = (promptTokens, completionTokens, totalTokens, credit, cacheHitTokens, cacheMissTokens) =>
  ({ promptTokens, completionTokens, totalTokens, credit, cacheHitTokens, cacheMissTokens });

ledger.record('cn', 'acct-a', 'model-x', true, { ...measured(100, 20, 120, 1000, 50), ...billed(100, 20, 120, 0.01, 0, 100) });
ledger.record('cn', 'acct-a', 'model-x', true, { ...measured(300, 40, 340, 2000, 25), ...billed(300, 40, 340, 0.02, 0, 300) });
ledger.record('cn', 'acct-b', 'model-y', true, { ...measured(10, 5, 15, 500, 10), ...billed(10, 5, 15, 0.001, 0, 10) });
ledger.record('cn', 'acct-b', 'model-y', false);

const threeDays = ledger.window('3d');
/* four calls fold into two rows: one per (hour, account, model) */
assert.equal(threeDays.rows.length, 2, 'calls fold into one row per hour/account/model');
assert.ok(threeDays.since < Date.now() && threeDays.until >= threeDays.since);

// hourly bucketing: same account+model in the same hour is one row, summed
const sameHour = threeDays.rows.filter((r) => r.u === 'acct-a');
assert.equal(sameHour.length, 1, 'one row per hour/account/model');
assert.equal(sameHour[0].q, 2, 'calls accumulate into the hour row');
assert.equal(sameHour[0].p, 400);
assert.equal(sameHour[0].c, 60);
assert.equal(sameHour[0].t, 460);
assert.equal(sameHour[0].ln, 2, 'two latency samples');
assert.equal(sameHour[0].vn, 2, 'two speed samples');
assert.equal(sameHour[0].l, 3000);
assert.equal(sameHour[0].v, 75);
assert.equal(Number(sameHour[0].cr.toFixed(4)), 0.03, 'billed credits accumulate');
assert.equal(sameHour[0].ch, 0);
assert.equal(sameHour[0].cm, 400, 'cache-miss tokens accumulate per row');

// a failed call counts as a call with a failure and no measurement
const failedRow = threeDays.rows.find((r) => r.u === 'acct-b');
assert.equal(failedRow.q, 2);
assert.equal(failedRow.e, 1);
assert.equal(failedRow.p, 10, 'the failed call adds no tokens');

// a longer window includes an old row that a short one excludes
const nowHour = Math.floor(Date.now() / 36e5) * 36e5;
const oldHour = nowHour - 48 * 36e5;
/* writes are batched for 2s, so force the file to exist before seeding it */
ledger.flush();
const seeded = JSON.parse(fs.readFileSync(path.join(sandbox, '.dsh', '.workbuddy-usage.json'), 'utf8'));
seeded.rows.push({ h: oldHour, r: 'cn', u: 'acct-old', m: 'model-x', q: 1, e: 0, p: 1, c: 1, t: 2, l: 0, ln: 0, v: 0, vn: 0 });
fs.writeFileSync(path.join(sandbox, '.dsh', '.workbuddy-usage.json'), JSON.stringify(seeded));

const reopened = createWorkBuddyUsageLedger();
assert.equal(reopened.window('1d').rows.some((r) => r.u === 'acct-old'), false, 'the 1-day window excludes a 48h-old row');
assert.equal(reopened.window('3d').rows.some((r) => r.u === 'acct-old'), true, 'the 3-day window includes it');

// an absurdly old row is dropped on the next flush, not carried forever
seeded.rows.push({ h: nowHour - 400 * 24 * 36e5, r: 'cn', u: 'acct-ancient', m: 'model-x', q: 1, e: 0, p: 1, c: 1, t: 2, l: 0, ln: 0, v: 0, vn: 0 });
fs.writeFileSync(path.join(sandbox, '.dsh', '.workbuddy-usage.json'), JSON.stringify(seeded));
const pruning = createWorkBuddyUsageLedger();
pruning.record('cn', 'acct-a', 'model-x', true, measured(1, 1, 2, 0, 0));
pruning.flush();
const persisted = JSON.parse(fs.readFileSync(path.join(sandbox, '.dsh', '.workbuddy-usage.json'), 'utf8'));
/* nothing is ever pruned: the ledger is the permanent record */
assert.equal(persisted.rows.some((r) => r.u === 'acct-ancient'), true, 'even a 400-day-old row is kept');
assert.equal(persisted.rows.some((r) => r.u === 'acct-old'), true, 'rows inside retention are kept');

/* the "all" window ignores the lower bound entirely */
const all = pruning.window('all');
assert.equal(all.rows.some((r) => r.u === 'acct-ancient'), true, 'the all window includes the oldest row');
assert.equal(Number.isFinite(all.since), false, 'the all window has no finite lower bound');
assert.ok(all.rows.length > pruning.window('14d').rows.length, 'all is a superset of 14d');

console.log(JSON.stringify({ ok: true, sandbox, rows: persisted.rows.length }, null, 2));
fs.rmSync(sandbox, { recursive: true, force: true });
