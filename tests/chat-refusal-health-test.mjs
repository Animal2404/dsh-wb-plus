// A 429 during a real CHAT call must cool the account row.
//
// Repro of the report: a pooled account hit `code:6004` 使用量已超出频率限制
// on a conversation turn. That limit is model-scoped, so the model row must
// carry it while the account itself remains usable for other models.
import assert from 'node:assert/strict';
import { createWorkBuddyShim, workbuddyAccountId, workBuddyHealthOf } from '../lib/index.js';

const credential = { uin: 'cool-user', uid: 'cool-uid', nickname: 'Cool', domain: 'www.workbuddy.cn', accessToken: 't' };
const accountId = workbuddyAccountId(credential);

/* the exact body the screenshot showed */
const refusal = {
  ok: false,
  status: 429,
  kind: 'soft_rate',
  message: JSON.stringify({
    code: 6004,
    msg: '您的使用量已超出频率限制，将在 2026-09-19 16:37:54 UTC+8 重置，您也可以切换其他模型继续使用。',
    requestId: 'c9082827-4689-4769-a1cb-1c8a1e42b9bf',
  }),
};

const reported = [];
const shim = createWorkBuddyShim({
  store: { resolve: async () => credential },
  client: { chatStream: async () => refusal },
  catalog: { current: () => [] },
  region: 'cn',
  usage: { record() {}, lifetimeByAccount: () => new Map() },
  onUpstreamRefusal: (id, error, model) => reported.push({ id, kind: error.kind, status: error.status, message: error.message, model }),
});
await shim.ready;

const res = await fetch(`${shim.baseUrl()}/v1/chat/completions`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${shim.token()}`, Origin: 'http://127.0.0.1', 'Content-Type': 'application/json' },
  body: JSON.stringify({ model: 'deepseek-v4.1-flash', messages: [{ role: 'user', content: 'hi' }] }),
});
await res.text().catch(() => '');
assert.equal(res.status, 429, 'the shim surfaces the upstream 429');

/* the shim must have told the pool about it */
assert.equal(reported.length, 1, 'a refused chat call is reported to the pool exactly once');
assert.equal(reported[0].id, accountId, 'it names the account that was refused');
assert.equal(reported[0].kind, 'soft_rate');
assert.equal(reported[0].model, 'deepseek-v4.1-flash', 'the refused model travels with the report');

/* The host records a verdict only when the real classifier returns one, so assert
   that directly: the screenshot's 429 yields health, a plain 5xx does not. */
/* the host passes `result.message`, so the classifier must be exercised that way -
   handing it the whole envelope stringifies to "[object Object]" and matches nothing */
assert.equal(workBuddyHealthOf(refusal.message, Date.now())?.kind, 'rate', 'the screenshot 429 classifies as a rate cooldown');
assert.equal(workBuddyHealthOf(refusal.message, Date.now())?.scope, 'model', 'the "switch other models" hint keeps the account usable');
assert.equal(workBuddyHealthOf('429 too many requests', Date.now())?.scope, 'account', 'a plain account-wide rate limit still cools the account');
assert.equal(workBuddyHealthOf(refusal, Date.now()), undefined, 'the raw envelope alone does NOT classify (String(obj) is useless)');
assert.equal(workBuddyHealthOf({ status: 502, kind: 'server', message: 'upstream 502 bad gateway' }, Date.now()), undefined, 'a plain 502 has no cooldown meaning');
assert.equal(workBuddyHealthOf({ status: 0, kind: 'server', message: 'transport error: socket hang up' }, Date.now()), undefined, 'a transport error has no cooldown meaning');

/* A plain 5xx must NOT be reported as a health verdict - otherwise a flaky
   network would park a healthy account. */
const blipShim = createWorkBuddyShim({
  store: { resolve: async () => credential },
  client: { chatStream: async () => ({ ok: false, status: 502, kind: 'server', message: 'upstream 502 bad gateway' }) },
  catalog: { current: () => [] },
  region: 'cn',
  usage: { record() {}, lifetimeByAccount: () => new Map() },
  /* mirror what the host does: only a classifier verdict gets recorded */
  onUpstreamRefusal: (id, error) => {
    const health = workBuddyHealthOf(error, Date.now());
    if (health !== undefined) reported.push({ id, kind: error.kind, health });
  },
});
await blipShim.ready;
const blip = await fetch(`${blipShim.baseUrl()}/v1/chat/completions`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${blipShim.token()}`, Origin: 'http://127.0.0.1', 'Content-Type': 'application/json' },
  body: JSON.stringify({ model: 'x', messages: [] }),
});
await blip.text().catch(() => '');
assert.equal(blip.status, 502);
assert.equal(reported.length, 1, 'a 502 is NOT reported as a cooldown');
await blipShim.close();

/* and the counters still record the failed call */
const stat = shim.stats()[accountId];
assert.equal(stat.failures, 1, 'the call is still counted as a failure');
assert.equal(stat.inFlight, 0);

await shim.close();
console.log(JSON.stringify({ ok: true, surfaced: res.status, reported: reported.length, stat }, null, 2));
