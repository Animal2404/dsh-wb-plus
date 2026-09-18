const mod = await import('../lib/index.js');
const assert = await import('node:assert/strict');
const handlers = new Map();
const ctx = {
  effect: (fn) => { const d = fn(); return typeof d === 'function' ? d : () => {}; },
  webServer: { register: (spec) => { handlers.set(spec.path, spec.handler); return () => {}; } },
  on: () => () => {},
};
const credentials = [
  { uin: 'u1', uid: 'uid-1', nickname: 'Demo Account', domain: 'www.workbuddy.cn', accessToken: 'x', refreshToken: 'y', expiresAt: 9e15 },
  { uin: 'u2', uid: 'uid-2', nickname: 'Second', domain: 'www.workbuddy.cn', accessToken: 'x', refreshToken: 'y', expiresAt: 9e15 },
];
let creditsCalls = 0;
/** A fixed usage window so the route's aggregation can be asserted exactly. */
const usageRows = [
  /* three 1000ms / 150 tok/s samples, so the averages must come back as 1000 and 150 */
  { h: 1_800_000_000_000, r: 'cn', u: 'u1', m: 'model-a', q: 3, e: 0, p: 300, c: 60, t: 360, l: 3000, ln: 3, v: 450, vn: 3, cr: 0.1, ch: 40, cm: 260 },
  { h: 1_800_000_000_000 + 36e5, r: 'cn', u: 'u2', m: 'model-b', q: 1, e: 1, p: 0, c: 0, t: 0, l: 0, ln: 0, v: 0, vn: 0 },
];
const deps = {
  poolModelHealth: new Map([
    ['u1\u0000model-a', { kind: 'rate', scope: 'model', until: Date.now() + 36e5, reason: 'model-a is rate limited', at: Date.now() }],
  ]),
  store: () => ({
    readAll: async () => credentials,
    /* the fast path reads these two directly, so the stub must provide them */
    accounts: async () => credentials.map((c, i) => ({ id: `acct-${i}`, selected: i === 0, accountName: c.nickname, domain: c.domain })),
    status: async () => ({ state: 'signed-in' }),
    current: async () => credentials[0],
    resolve: async () => credentials[0],
  }),
  stats: () => ({
    a1: {
      total: 8, successes: 7, failures: 1, inFlight: 0, lastSuccessAt: 1_800_000_000_000,
      firstTokenMsSum: 2400, firstTokenSamples: 3,
      generationMsSum: 4000, generationTokens: 200,
      promptTokens: 3000, completionTokens: 200, totalTokens: 3200,
    },
    a2: { total: 2, successes: 1, failures: 1, inFlight: 0 },
  }),
  usage: {
    window: (range) => ({ since: 1_800_000_000_000, until: 1_800_000_000_000 + 72e5, range, rows: usageRows }),
  },
  /* the /usage route shapes the model roster through these */
  displayModels: () => [],
  enabledModelIds: () => [],
  imageModelIds: () => [],
  contextBudgets: () => ({}),
  client: {
    fetchCredits: async () => {
      creditsCalls += 1;
      if (creditsCalls === 2) throw new Error('频率限制，请在 2026-09-17 21:30:00 后重试');
      return { total: 2098, packages: [], expiringSoon: 0 };
    },
    fetchCheckinStatus: async () => ({ active: true, todayCheckedIn: false, todayCredit: 100, dailyCredit: 100, streakDays: 1 }),
    claimDailyCheckin: async () => ({ ok: true }),
  },
};
mod.registerWorkBuddyStatusRoute(ctx, deps);
console.log('registered paths:', [...handlers.keys()].map(p => p.replace('/plugins/dsh-connect-workbuddy', '')).join(' , '));

const call = async (pathFragment, method, body, url) => {
  /* exact match on the trailing path: a substring test made '/usage' resolve to
     '/usage-stats', which silently exercised the wrong route */
  const key = [...handlers.keys()].find(k => k.endsWith(pathFragment));
  if (!key) return { error: 'no handler for ' + pathFragment };
  const res = { status: 0, body: '' };
  res.writeHead = (s) => { res.status = s; };
  res.end = (b) => { res.body = typeof b === 'string' ? b : String(b); };
  const chunks = body === undefined ? [] : [Buffer.from(body)];
  const req = {
    method,
    url: url ?? ('/plugins/dsh-connect-workbuddy' + pathFragment + '?region=cn'),
    headers: {},
    on: (ev, cb) => { if (ev === 'data' && chunks.length) cb(chunks[0]); if (ev === 'end') cb(); return req; },
    destroy: () => {},
  };
  await handlers.get(key)(req, res);
  let parsed; try { parsed = JSON.parse(res.body); } catch { parsed = res.body.slice(0, 120); }
  return { status: res.status, parsed };
};

const credits = await call('/pool/credits', 'GET');
console.log('\nGET /pool/credits ->', credits.status);
console.log('  accounts:', JSON.stringify(credits.parsed?.accounts));
console.log('  health:', JSON.stringify(credits.parsed?.health), 'cooling:', credits.parsed?.cooling);
console.log('  modelHealth:', JSON.stringify(credits.parsed?.modelHealth));
console.log('  stats:', JSON.stringify(credits.parsed?.stats));

const stats = await call('/pool/stats', 'GET');
console.log('\nGET /pool/stats ->', stats.status, JSON.stringify(stats.parsed));
assert.default.equal(stats.status, 200);
assert.default.equal(stats.parsed.totals.calls, 10);
assert.default.equal(stats.parsed.totals.successes, 8);
assert.default.equal(stats.parsed.totals.failures, 2);
assert.default.equal(stats.parsed.totals.inFlight, 0);
assert.default.equal(stats.parsed.totals.totalTokens, 3200);
assert.default.equal(stats.parsed.totals.firstTokenMs, 800);
assert.default.equal(stats.parsed.totals.tokensPerSecond, 50);
assert.default.equal(stats.parsed.modelHealth.u1['model-a'].kind, 'rate', 'the fast stats route carries model-scoped limits');
assert.default.equal(stats.parsed.stats.a1.firstTokenMs, 800);
assert.default.equal(stats.parsed.stats.a1.tokensPerSecond, 50);
assert.default.equal(stats.parsed.stats.a1.totalTokens, 3200);
assert.default.equal('firstTokenMs' in stats.parsed.stats.a2, false, 'an account with no measured stream reports none');
assert.default.equal('totalTokens' in stats.parsed.stats.a2, false);
const statsPost = await call('/pool/stats', 'POST');
console.log('POST /pool/stats ->', statsPost.status, JSON.stringify(statsPost.parsed));

const checkAll = await call('/pool/checkin', 'POST', '{}');
console.log('\nPOST /pool/checkin {} ->', checkAll.status, JSON.stringify(checkAll.parsed));
const checkOne = await call('/pool/checkin', 'POST', JSON.stringify({ accountId: Object.keys(credits.parsed.health ?? {})[0] ?? 'none' }));
console.log('POST /pool/checkin {accountId:cooling} ->', checkOne.status, JSON.stringify(checkOne.parsed).slice(0, 200));
const bad = await call('/pool/checkin', 'POST', JSON.stringify({ accountId: 'nope' }));
console.log('POST /pool/checkin {accountId:unknown} ->', bad.status, JSON.stringify(bad.parsed));
const getPost = await call('/pool/checkin', 'GET');
console.log('GET /pool/checkin ->', getPost.status, JSON.stringify(getPost.parsed));
const noRegion = await call('/pool/credits', 'GET', undefined, '/plugins/dsh-connect-workbuddy/pool/credits?region=mars');
console.log('GET /pool/credits?region=mars ->', noRegion.status, JSON.stringify(noRegion.parsed));

/* The provider switch uses ?fast=1: it must return the account/model half WITHOUT
   touching the two upstream-backed reads, which is what makes the switch instant. */
const beforeFast = creditsCalls;
const fastUsage = await call('/usage', 'GET', undefined, '/plugins/dsh-connect-workbuddy/usage?region=cn&fast=1');
const afterFast = creditsCalls;
console.log('\nGET /usage?fast=1 ->', fastUsage.status);
console.log('  status:', fastUsage.parsed?.status, '| models:', fastUsage.parsed?.models?.length, '| accounts:', fastUsage.parsed?.accounts?.length);
console.log('  carries credits?', fastUsage.parsed?.credits !== undefined, '| upstream credit reads during fast:', afterFast - beforeFast);
assert.default.equal(fastUsage.status, 200);
assert.default.equal(fastUsage.parsed.status, 'signed-in');
assert.default.ok(Array.isArray(fastUsage.parsed.accounts), 'fast still returns the account list');
assert.default.ok(Array.isArray(fastUsage.parsed.models), 'fast still returns the model roster');
assert.default.equal(fastUsage.parsed.credits, undefined, 'fast does not wait for credits');
assert.default.equal(afterFast - beforeFast, 0, 'fast performs NO upstream credit read');

/* and the full document still carries them */
const fullUsage = await call('/usage', 'GET', undefined, '/plugins/dsh-connect-workbuddy/usage?region=cn');
console.log('GET /usage (full) ->', fullUsage.status, '| carries credits?', fullUsage.parsed?.credits !== undefined, '| credits:', fullUsage.parsed?.credits?.total);
assert.default.equal(fullUsage.status, 200);
assert.default.equal(typeof fullUsage.parsed.credits?.total, 'number', 'the full document still has credits');

const usageStats = await call('/usage-stats', 'GET', undefined, '/plugins/dsh-connect-workbuddy/usage-stats?range=3d');
console.log('\nGET /usage-stats?range=3d ->', usageStats.status);
console.log('  totals:', JSON.stringify(usageStats.parsed?.totals));
console.log('  series:', JSON.stringify(usageStats.parsed?.series));
console.log('  accounts:', JSON.stringify(usageStats.parsed?.accounts));
console.log('  models:', JSON.stringify(usageStats.parsed?.models));
console.log('  regions:', JSON.stringify(usageStats.parsed?.regions));
assert.default.equal(usageStats.status, 200);
assert.default.equal(usageStats.parsed.range, '3d');
assert.default.equal(usageStats.parsed.totals.calls, 4);
assert.default.equal(usageStats.parsed.totals.failures, 1);
assert.default.equal(usageStats.parsed.totals.promptTokens, 300);
assert.default.equal(usageStats.parsed.totals.completionTokens, 60);
assert.default.equal(usageStats.parsed.totals.totalTokens, 360);
assert.default.equal(usageStats.parsed.totals.avgLatencyMs, 1000, '3 samples of 1000ms each');
assert.default.equal(usageStats.parsed.totals.avgTokensPerSecond, 150);
/* 360 tokens billed at 0.10 credits => 3600 tokens per credit */
assert.default.equal(usageStats.parsed.totals.credits, 0.1);
assert.default.equal(usageStats.parsed.totals.tokensPerCredit, 3600);
assert.default.equal(usageStats.parsed.totals.cacheHitTokens, 40);
assert.default.equal(usageStats.parsed.totals.cacheMissTokens, 260);
assert.default.equal(usageStats.parsed.accounts[0].tokensPerCredit, 3600);
assert.default.equal(usageStats.parsed.accounts[0].credits, 0.1);
/* an account that was never billed reports no rate rather than zero or Infinity */
const unbilled = usageStats.parsed.accounts.find((a) => a.accountId === 'u2');
assert.default.equal(unbilled.credits, 0);
assert.default.equal(unbilled.tokensPerCredit, null);
assert.default.equal(usageStats.parsed.series.length, 2, 'two hourly buckets');
assert.default.equal(usageStats.parsed.series[0].hour < usageStats.parsed.series[1].hour, true, 'series is chronological');
assert.default.equal(usageStats.parsed.accounts.length, 2);
assert.default.equal(usageStats.parsed.accounts[0].accountId, 'u1', 'accounts sort by tokens');
assert.default.equal(usageStats.parsed.models.length, 2);
assert.default.equal(usageStats.parsed.models[0].model, 'model-a');
assert.default.equal(usageStats.parsed.regions.length, 1);
assert.default.equal(usageStats.parsed.regions[0].region, 'cn');
/* an account whose only call failed reports no average rather than a zero */
const failedAccount = usageStats.parsed.accounts.find((a) => a.accountId === 'u2');
assert.default.equal('avgLatencyMs' in failedAccount, false);
assert.default.equal('avgTokensPerSecond' in failedAccount, false);

const defaultRange = await call('/usage-stats', 'GET', undefined, '/plugins/dsh-connect-workbuddy/usage-stats');
assert.default.equal(defaultRange.status, 200);
assert.default.equal(defaultRange.parsed.range, '3d', 'range defaults to three days');
const badRange = await call('/usage-stats', 'GET', undefined, '/plugins/dsh-connect-workbuddy/usage-stats?range=forever');
console.log('GET /usage-stats?range=forever ->', badRange.status, JSON.stringify(badRange.parsed));
assert.default.equal(badRange.status, 400);
const allRange = await call('/usage-stats', 'GET', undefined, '/plugins/dsh-connect-workbuddy/usage-stats?range=all');
console.log('GET /usage-stats?range=all ->', allRange.status, JSON.stringify(allRange.parsed?.range));
assert.default.equal(allRange.status, 200, 'the lifetime window is a valid range');
assert.default.equal(allRange.parsed.range, 'all');
const usagePost = await call('/usage-stats', 'POST');
assert.default.equal(usagePost.status, 405);
