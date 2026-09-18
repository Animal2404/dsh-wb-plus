// Round-trip proof for "permanent": write real calls into a sandboxed ledger,
// build a NEW ledger from the same file (what a restart does), and check the
// lifetime rollup reproduces the per-account figures exactly - including the
// derived rate, which must be token-weighted, not an average of averages.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'wb-keep-'));
process.env.USERPROFILE = sandbox;
process.env.HOME = sandbox;
fs.mkdirSync(path.join(sandbox, '.dsh'), { recursive: true });

const { createWorkBuddyUsageLedger } = await import('../lib/index.js');

const call = (promptTokens, completionTokens, totalTokens, firstTokenMs, generationMs, credit, hit, miss) => ({
  promptTokens, completionTokens, totalTokens, firstTokenMs, generationMs, credit,
  cacheHitTokens: hit, cacheMissTokens: miss,
  ...(generationMs >= 50 && completionTokens >= 2 ? { tokensPerSecond: completionTokens / (generationMs / 1000) } : {}),
});

/* two calls on one account: 100 tok in 200ms, then 300 tok in 400ms */
const first = createWorkBuddyUsageLedger();
first.record('cn', 'acct-a', 'm1', true, call(1000, 100, 1100, 800, 200, 0.02, 0, 1000));
first.record('cn', 'acct-a', 'm1', true, call(2000, 300, 2300, 1200, 400, 0.05, 500, 1500));
first.record('cn', 'acct-a', 'm1', false);
first.record('cn', 'acct-b', 'm2', true, call(50, 10, 60, 300, 100, 0.001, 0, 50));
first.flush();

const before = first.lifetimeByAccount('cn').get('acct-a');
assert.equal(before.total, 3, '3 calls (2 ok, 1 failed)');
assert.equal(before.successes, 2);
assert.equal(before.failures, 1);
assert.equal(before.totalTokens, 3400);
assert.equal(before.firstTokenSamples, 2);
assert.equal(before.generationTokens, 400);
assert.equal(before.generationMsSum, 600);
assert.equal(Number(before.credit.toFixed(4)), 0.07);
assert.equal(before.cacheHitTokens, 500);
assert.equal(before.cacheMissTokens, 2500);

/* a NEW ledger over the same file = a restart */
const after = createWorkBuddyUsageLedger().lifetimeByAccount('cn').get('acct-a');
assert.deepEqual(after, before, 'the restart reproduces the SAME totals');

/* the rate must be token-weighted: 400 tok / 600ms = 666.7 tok/s, NOT the mean
   of the two per-call rates (500 and 750 => 625) */
const restoredRate = after.generationTokens / (after.generationMsSum / 1000);
assert.equal(Math.round(restoredRate * 10) / 10, 666.7);
assert.notEqual(Math.round(restoredRate * 10) / 10, 625, 'not an average of averages');

/* region isolation: acct-b lives on the same ledger but a different account */
assert.equal(first.lifetimeByAccount('cn').has('acct-b'), true);
assert.equal(first.lifetimeByAccount('other').size, 0, 'another region sees none of cn');

/* the ledger file itself is a permanent record: nothing has been pruned */
const raw = JSON.parse(fs.readFileSync(path.join(sandbox, '.dsh', '.workbuddy-usage.json'), 'utf8'));
assert.equal(raw.rows.length >= 2, true, 'rows persist on disk');
assert.equal(raw.rows.every((r) => typeof r.sl === 'number'), true, 'last-success is stored per row');

/* Upgrade path: a row written BEFORE gm/gt/ls existed must still produce a speed
   and a first-token figure, rebuilt from the fields it does have. */
const legacyFile = path.join(sandbox, '.dsh', '.workbuddy-usage.json');
const legacy = JSON.parse(fs.readFileSync(legacyFile, 'utf8'));
legacy.rows.push({
  /* the older shape: no gm/gt/ls, but a rate sum (v/vn) and a latency sample (ln) */
  h: Math.floor(Date.now() / 36e5) * 36e5, r: 'cn', u: 'acct-legacy', m: 'm1',
  q: 2, e: 0, p: 500, c: 400, t: 900, l: 2000, ln: 2, v: 1000, vn: 2, cr: 0.01, ch: 0, cm: 500,
});
fs.writeFileSync(legacyFile, JSON.stringify(legacy));
const upgraded = createWorkBuddyUsageLedger().lifetimeByAccount('cn').get('acct-legacy');
assert.equal(upgraded.total, 2);
assert.equal(upgraded.firstTokenSamples, 2, 'legacy `ln` backfills first-token samples');
/* average rate was 500 tok/s over 400 completion tokens => 800ms of generation */
assert.equal(upgraded.generationMsSum, 800, 'generation window rebuilt from the legacy rate');
assert.equal(upgraded.generationTokens, 400);
assert.equal(Math.round(upgraded.generationTokens / (upgraded.generationMsSum / 1000) * 10) / 10, 500);

console.log(JSON.stringify({
  ok: true,
  rows: raw.rows.length,
  acctA: { calls: after.total, tokens: after.totalTokens, tokensPerSecond: Math.round(restoredRate * 10) / 10 },
}, null, 2));
fs.rmSync(sandbox, { recursive: true, force: true });
