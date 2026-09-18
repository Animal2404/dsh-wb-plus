// A client that walks away mid-answer must NOT be recorded as an account failure.
//
// Repro of what actually happened in the live plugin: the driver aborted several
// streams, and the healthy account read 5/17成功 with 12 "failures" that were all
// just abandoned reads. This asserts the fix.
import assert from 'node:assert/strict';
import { createWorkBuddyShim, workbuddyAccountId } from '../lib/index.js';

const credential = { uin: 'abandon-user', uid: 'abandon-uid', nickname: 'A', domain: 'www.workbuddy.cn', accessToken: 't' };
const accountId = workbuddyAccountId(credential);

/** A stream that never finishes on its own - the test closes the client first. */
let upstreamCancelled = false;
const client = {
  async chatStream(_credential, _body, signal) {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: {"choices":[{"delta":{"content":"hi"}}]}\n\n'));
        signal?.addEventListener('abort', () => {
          upstreamCancelled = true;
          try { controller.error(new Error('aborted')); } catch {}
        });
      },
    });
    return { ok: true, response: new Response(stream, { headers: { 'content-type': 'text/event-stream' } }) };
  },
};

const recorded = [];
const usage = {
  record(region, id, model, ok, measured) { recorded.push({ region, id, model, ok, measured }); },
  lifetimeByAccount() { return new Map(); },
};

const shim = createWorkBuddyShim({ store: { resolve: async () => credential }, client, catalog: { current: () => [] }, region: 'cn', usage });
await shim.ready;

const url = `${shim.baseUrl()}/v1/chat/completions`;
const abort = new AbortController();
const pending = fetch(url, {
  method: 'POST',
  headers: { Authorization: `Bearer ${shim.token()}`, Origin: 'http://127.0.0.1', 'Content-Type': 'application/json' },
  body: JSON.stringify({ model: 'synthetic', messages: [] }),
  signal: abort.signal,
}).catch(() => 'aborted');

/* let the request reach the shim and become in-flight */
for (let i = 0; i < 40 && (shim.stats()[accountId]?.inFlight ?? 0) === 0; i += 1) {
  await new Promise((r) => setTimeout(r, 25));
}
assert.equal(shim.stats()[accountId].inFlight, 1, 'the call is in flight before we abandon it');

abort.abort();
await pending;
/* give the server a beat to observe the disconnect */
for (let i = 0; i < 60 && (shim.stats()[accountId]?.inFlight ?? 0) !== 0; i += 1) {
  await new Promise((r) => setTimeout(r, 25));
}

const stat = shim.stats()[accountId];
assert.equal(stat.inFlight, 0, 'the in-flight marker is cleared');
assert.equal(stat.failures, 0, 'an abandoned call is NOT a failure');
assert.equal(stat.total, 0, 'an abandoned call is not counted at all');
assert.equal(stat.successes, 0);
assert.equal(recorded.length, 0, 'nothing is written to the usage ledger');
assert.equal(upstreamCancelled, true, 'the upstream read is aborted rather than left running');

await shim.close();
console.log(JSON.stringify({ ok: true, stat, recorded: recorded.length, upstreamCancelled }, null, 2));
