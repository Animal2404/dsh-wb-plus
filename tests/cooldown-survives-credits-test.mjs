// The reported bug, end to end at the host level:
//   1) a real chat call is refused with code 6004 (model-level rate limit)
//   2) the pool should mark that model as limited, not the whole account
//   3) reading its credits must NOT clear that model limit
//      (the billing endpoint keeps answering normally)
import assert from 'node:assert/strict';
import { createWorkBuddyShim, workbuddyAccountId, workBuddyHealthOf, registerWorkBuddyStatusRoute } from '../lib/index.js';

const credential = { uin: 'cool-user', uid: 'cool-uid', nickname: 'Cool', domain: 'www.workbuddy.cn', accessToken: 't', refreshToken: 'r', expiresAt: 9e15 };
const accountId = workbuddyAccountId(credential);
const refusalMessage = JSON.stringify({
  code: 6004,
  msg: '您的使用量已超出频率限制，将在 2026-09-19 16:37:54 UTC+8 重置，您也可以切换其他模型继续使用。',
});

/* two shared maps, exactly like apply() builds */
const poolHealth = new Map();
const poolModelHealth = new Map();

const shim = createWorkBuddyShim({
  store: { resolve: async () => credential },
  client: { chatStream: async () => ({ ok: false, status: 429, kind: 'soft_rate', message: refusalMessage }) },
  catalog: { current: () => [] },
  region: 'cn',
  usage: { record() {}, lifetimeByAccount: () => new Map() },
  onUpstreamRefusal: (id, error, model) => {
    const health = workBuddyHealthOf(error?.message ?? String(error), Date.now());
    if (health === undefined || id === '' || id === 'unknown') return;
    if (health.scope === 'model' && typeof model === 'string' && model !== '') poolModelHealth.set(`${id}\u0000${model}`, health);
    else poolHealth.set(id, health);
  },
});
await shim.ready;

/* 1+2: the refused chat call marks that model */
const res = await fetch(`${shim.baseUrl()}/v1/chat/completions`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${shim.token()}`, Origin: 'http://127.0.0.1', 'Content-Type': 'application/json' },
  body: JSON.stringify({ model: 'deepseek-v4.1-flash', messages: [{ role: 'user', content: 'hi' }] }),
});
await res.text().catch(() => '');
assert.equal(res.status, 429);
const modelKey = `${accountId}\u0000deepseek-v4.1-flash`;
assert.equal(poolHealth.has(accountId), false, 'a model-scoped limit does not cool the account');
assert.equal(poolModelHealth.get(modelKey)?.kind, 'rate', 'the chat 429 marks the model as limited');
assert.ok(poolModelHealth.get(modelKey).until > Date.now(), 'the model limit is in the future');

/* 3: now read credits through the real route - it must NOT wipe the cooldown */
const handlers = new Map();
const ctx = {
  effect: (fn) => { const d = fn(); return typeof d === 'function' ? d : () => {}; },
  webServer: { register: (spec) => { handlers.set(spec.path, spec.handler); return () => {}; } },
  on: () => () => {},
};
const credentials = [credential];
registerWorkBuddyStatusRoute(ctx, {
  poolHealth,
  poolModelHealth,
  store: () => ({
    readAll: async () => credentials,
    accounts: async () => credentials.map((c, i) => ({ id: accountId, selected: i === 0, accountName: c.nickname, domain: c.domain })),
    status: async () => ({ state: 'signed-in' }),
    resolve: async () => credential,
  }),
  stats: () => ({}),
  usage: { window: () => ({ since: 0, until: 0, rows: [] }) },
  /* the billing read SUCCEEDS - that is the point */
  client: { fetchCredits: async () => ({ total: 350, packages: [], expiringSoon: 0 }), fetchCheckinStatus: async () => ({ active: true, todayCheckedIn: true }) },
  displayModels: () => [],
  enabledModelIds: () => [],
  imageModelIds: () => [],
  contextBudgets: () => ({}),
});

const handler = [...handlers.entries()].find(([k]) => k.endsWith('/pool/credits'))[1];
const out = { status: 0, body: '' };
out.writeHead = (s) => { out.status = s; };
out.end = (b) => { out.body = String(b); };
const req = { method: 'GET', url: '/plugins/dsh-connect-workbuddy/pool/credits?region=cn', headers: {}, on: (e, cb) => { if (e === 'end') cb(); return req; }, destroy() {} };
await handler(req, out);

const parsed = JSON.parse(out.body);
assert.equal(out.status, 200);
assert.equal(parsed.accounts[0].credits, 350, 'the credits still read fine');
assert.equal(parsed.cooling, 0, 'the account is not cooled by a model-scoped limit');
assert.equal(parsed.health[accountId], undefined, 'the account health stays empty');
assert.equal(parsed.modelHealth[accountId]?.['deepseek-v4.1-flash']?.kind, 'rate', 'the model limit survived the credits refresh');
assert.ok(poolModelHealth.has(modelKey), 'the shared model map still holds it');

await shim.close();
console.log(JSON.stringify({ ok: true, surfaced: res.status, cooling: parsed.cooling, modelHealth: parsed.modelHealth[accountId] }, null, 2));
