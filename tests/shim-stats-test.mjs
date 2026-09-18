import assert from 'node:assert/strict';
import { createWorkBuddyShim, workbuddyAccountId } from '../lib/index.js';

const credential = {
  uin: 'stats-user-1',
  uid: 'stats-uid-1',
  nickname: 'Stats User',
  domain: 'www.workbuddy.cn',
  accessToken: 'test-token',
};
const accountId = workbuddyAccountId(credential);
let mode = 'success';
let finishStream;

const sse = (payload) => `data: ${JSON.stringify(payload)}\n\n`;
/** One synthetic upstream answer, one frame per step, spaced out so the
 *  first-token and generation windows are measurable rather than zero. */
const frames = (list, gapMs = 0) => new ReadableStream({
  async start(controller) {
    const encoder = new TextEncoder();
    for (const frame of list) {
      if (gapMs > 0) await new Promise((resolve) => setTimeout(resolve, gapMs));
      controller.enqueue(encoder.encode(frame));
    }
    controller.close();
  },
});
const meteredFrames = (usage) => frames([
  sse({ choices: [{ delta: { role: 'assistant' } }] }),
  sse({ choices: [{ delta: { content: '你' } }] }),
  sse({ choices: [{ delta: { reasoning_content: '想' } }] }),
  sse({ choices: [{ delta: { content: '好' } }] }),
  sse({ choices: [], usage }),
  'data: [DONE]\n\n',
], 100);
/** One token, delivered and closed in the same tick: no measurable window. */
const burstFrames = () => frames([
  sse({ choices: [{ delta: { content: 'ok' } }] }),
  sse({ choices: [], usage: { prompt_tokens: 5, completion_tokens: 1, total_tokens: 6 } }),
  'data: [DONE]\n\n',
], 0);

const client = {
  async chatStream() {
    if (mode === 'failure') return { ok: false, status: 500, kind: 'server', message: 'synthetic failure' };
    if (mode === 'metered' || mode === 'fallback') {
      const usage = mode === 'metered'
        ? {
            prompt_tokens: 100, completion_tokens: 20, total_tokens: 120,
            credit: 0.05, prompt_cache_hit_tokens: 0, prompt_cache_miss_tokens: 100,
          }
        : { prompt_tokens: 7, completion_tokens: 3 };
      return { ok: true, response: new Response(meteredFrames(usage), { headers: { 'content-type': 'text/event-stream' } }) };
    }
    if (mode === 'burst') return { ok: true, response: new Response(burstFrames(), { headers: { 'content-type': 'text/event-stream' } }) };
    if (mode === 'inflight') {
      const stream = new ReadableStream({
        start(controller) {
          finishStream = () => {
            controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
            controller.close();
          };
        },
      });
      return { ok: true, response: new Response(stream, { headers: { 'content-type': 'text/event-stream' } }) };
    }
    return { ok: true, response: new Response('data: [DONE]\n\n', { headers: { 'content-type': 'text/event-stream' } }) };
  },
};

/** Records what the shim hands the usage ledger, without touching the real file. */
const usageRows = [];
let restoredRows = null;
const usage = {
  record(region, accountId, model, ok, measured) {
    usageRows.push({ region, accountId, model, ok, measured });
  },
  /* the shim seeds itself from this on startup; the test hands it a seeded
     account so the restore path is exercised, not just the live path */
  lifetimeByAccount() { return restoredRows === null ? new Map() : new Map(Object.entries(restoredRows)); },
};
/* Seed a lifetime row BEFORE constructing the shim: this is the restart path -
   a fresh process must come up already knowing the account's history. */
restoredRows = {
  [accountId]: {
    total: 40, successes: 38, failures: 2, lastSuccessAt: 1_700_000_000_000,
    firstTokenMsSum: 30000, firstTokenSamples: 30,
    generationMsSum: 60000, generationTokens: 1500,
    promptTokens: 90000, completionTokens: 3000, totalTokens: 93000,
    credit: 2.5, cacheHitTokens: 10000, cacheMissTokens: 20000,
  },
};
const shim = createWorkBuddyShim({
  store: { resolve: async () => credential },
  client,
  catalog: { current: () => [] },
  region: 'cn',
  usage,
});
await shim.ready;

/** Resolve once the forwarded stream has finished, so every assertion below
 *  reads a settled account rather than a half-delivered answer. */
const call = async () => {
  const response = await fetch(`${shim.baseUrl()}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${shim.token()}`,
      Origin: 'http://127.0.0.1',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: 'synthetic', messages: [] }),
  });
  await response.text().catch(() => '');
  return response;
};

mode = 'success';
assert.equal((await call()).status, 200);
let stat = shim.stats()[accountId];
/* The restored baseline must be visible BEFORE anything happens, and the live
   call must add to it rather than replace it - this is the whole point of
   persisting: a restart must not reset the readout. */
assert.deepEqual({ total: stat.total, successes: stat.successes, failures: stat.failures, inFlight: stat.inFlight }, { total: 41, successes: 39, failures: 2, inFlight: 0 });
assert.ok(stat.lastSuccessAt > 1_700_000_000_000, 'last success kept its history');
/* the restored rate/sample accumulators survive too */
assert.equal(stat.firstTokenSamples, 30);
assert.equal(stat.generationTokens, 1500);
assert.equal(stat.totalTokens, 93000);
assert.equal(stat.completionTokens, 3000);
assert.equal(stat.credit, 2.5);

mode = 'inflight';
const pending = call();
for (let i = 0; i < 40 && (shim.stats()[accountId]?.inFlight ?? 0) !== 1; i += 1) {
  await new Promise((resolve) => setTimeout(resolve, 25));
}
stat = shim.stats()[accountId];
assert.equal(stat.inFlight, 1, 'request is visible while the stream is open');
finishStream();
assert.equal((await pending).status, 200);
stat = shim.stats()[accountId];
/* baseline 40/38/2 is added to by every call below, so each expectation carries
   the +40/+38/+2 offset. inFlight is never restored - it starts at 0. */
assert.deepEqual({ total: stat.total, successes: stat.successes, failures: stat.failures, inFlight: stat.inFlight }, { total: 42, successes: 40, failures: 2, inFlight: 0 });

mode = 'failure';
const failed = await call();
assert.equal(failed.status, 502);
stat = shim.stats()[accountId];
assert.deepEqual({ total: stat.total, successes: stat.successes, failures: stat.failures, inFlight: stat.inFlight }, { total: 43, successes: 40, failures: 3, inFlight: 0 });
assert.equal(stat.totalTokens, 93000, 'a failed call adds no token totals');

mode = 'metered';
assert.equal((await call()).status, 200);
stat = shim.stats()[accountId];
/* this call contributes 1 first-token sample on top of the restored 30 */
assert.equal(stat.firstTokenSamples, 31, 'the content deltas produced one first-token sample');
assert.ok(stat.firstTokenMsSum >= 30030, `first token waited past the role-only frame (${stat.firstTokenMsSum}ms)`);
assert.ok(stat.generationMsSum >= 60200, `generation window runs to the end of the answer (${stat.generationMsSum}ms)`);
assert.equal(stat.generationTokens, 1520);
assert.equal(stat.promptTokens, 90100);
assert.equal(stat.completionTokens, 3020);
assert.equal(stat.totalTokens, 93120);
assert.equal(Number(stat.credit.toFixed(2)), 2.55, 'the upstream credit charge is carried into the live totals');
assert.equal(stat.cacheMissTokens, 20100);
/* the restored 10000 cache-hit tokens stay; this call added none */
assert.equal(stat.cacheHitTokens, 10000);
const meteredView = { total: stat.total, successes: stat.successes, failures: stat.failures, inFlight: stat.inFlight };
assert.deepEqual(meteredView, { total: 44, successes: 41, failures: 3, inFlight: 0 });

/* an upstream that states no total must still add up to its own parts */
mode = 'fallback';
assert.equal((await call()).status, 200);
stat = shim.stats()[accountId];
assert.equal(stat.totalTokens, 93130);
assert.equal(stat.promptTokens, 90107);
assert.equal(stat.completionTokens, 3023);
assert.equal(stat.firstTokenSamples, 32);

/* a one-token burst has no rate to report, but its tokens are still billed */
const generationBefore = stat.generationMsSum;
mode = 'burst';
assert.equal((await call()).status, 200);
stat = shim.stats()[accountId];
assert.equal(stat.generationMsSum, generationBefore, 'a single-tick burst contributes no speed sample');
assert.equal(stat.totalTokens, 93136);
assert.equal(stat.promptTokens, 90112);
assert.equal(stat.completionTokens, 3024);
assert.equal(stat.firstTokenSamples, 33);

await shim.close();
/* Every settled call must reach the ledger exactly once, failures included, and
   each row must carry the region, account, requested model and measurement. */
assert.equal(usageRows.length, 6, 'one ledger row per settled call');
assert.equal(usageRows.filter((r) => r.ok === false).length, 1, 'the failed call is recorded as a failure');
assert.ok(usageRows.every((r) => r.region === 'cn' && r.accountId === accountId));
assert.ok(usageRows.every((r) => r.model === 'synthetic'));
const metered = usageRows.find((r) => r.measured?.completionTokens === 20);
assert.ok(metered, 'a metered call hands its measurement to the ledger');
assert.equal(metered.measured.promptTokens, 100);
assert.equal(metered.measured.totalTokens, 120);
assert.ok(metered.measured.tokensPerSecond > 0, 'the ledger receives a derived rate, not raw milliseconds');
const failedRow = usageRows.find((r) => r.ok === false);
assert.equal(failedRow.measured, undefined, 'a failed call carries no measurement');

console.log(JSON.stringify({ ok: true, accountId, stat, usageRows: usageRows.length }, null, 2));
