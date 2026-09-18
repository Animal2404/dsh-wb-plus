// Live harness for the WorkBuddy main-area view (the `conversation.view` tab).
//
// Renders the real component from the real injected bundle in a real browser,
// with a mock host composer dock at the bottom, so both the card chrome and the
// composer clearance can be measured instead of eyeballed.
//
// Usage: node view-harness.mjs <injected-client.js> <panel.css> <out.html>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const [target, cssPath, outPath] = process.argv.slice(2);
const css = fs.readFileSync(cssPath, 'utf8');
/** Resolve runtime deps from the repository root (npm/pnpm install) first,
 *  then from a sibling tooling checkout for ad-hoc local runs. */
const nm = [path.join(here, '..', 'node_modules'), path.join(here, 'node_modules')]
  .find((candidate) => fs.existsSync(path.join(candidate, 'react')));
if (nm === undefined) throw new Error('react/react-dom are not installed; run npm install first');

for (const [from, to] of [
  [path.join(nm, 'react/umd/react.development.js'), 'react.js'],
  [path.join(nm, 'react-dom/umd/react-dom.development.js'), 'react-dom.js'],
  [target, 'wb-client.js'],
]) fs.copyFileSync(from, path.join(here, to));

const MODELS = [
  ['deepseek-v4.1-flash', 'Deepseek-V4.1-Flash', 0.03, 1_000_000],
  ['auto', 'Auto', undefined, 200_000],
  ['hy4-preview', 'Hy4 preview', 0.29, 200_000],
  ['hy3-a', 'Hy3', 0, 196_000],
  ['hy3-b', 'Hy3', 0.05, 196_000],
  ['glm-5.3', 'GLM-5.3', 0.79, 200_000],
  ['glm-5.3-flash', 'GLM-5.3-Flash', 0.06, 200_000],
  ['kimi-k2.6', 'Kimi-K2.6', 0.14, 256_000],
  ['minimax-m2', 'MiniMax-M2', 0.11, 200_000],
  ['qwen3-max', 'Qwen3-Max', 0.22, 200_000],
  ['deepseek-v4.1-pro', 'Deepseek-V4.1-Pro', 0.09, 1_000_000],
  ['hy3-turbo', 'Hy3-Turbo', 0.04, 200_000],
  ['glm-4.9', 'GLM-4.9', 0.12, 200_000],
  ['step-4', 'Step-4', 0.08, 200_000],
].map(([id, name, creditMultiplier, nativeContextWindow]) => ({
  id, name, creditMultiplier, nativeContextWindow,
  reasoning: { efforts: [{ id: 'off' }, { id: 'low' }, { id: 'medium' }, { id: 'high' }, { id: 'max' }] },
}));
const PACKAGES = [
  { name: '签到积分', value: 100 }, { name: '日均额度', value: 100 },
];

const html = `<!doctype html><html lang="zh"><head><meta charset="utf-8"><title>harness</title>
<style>
  :root{
    --dsw-alias-bg-base:#1b1c20; --dsw-alias-label-primary:#e9eaec; --dsw-alias-label-secondary:#b8bcc4;
    --dsw-alias-label-tertiary:#8b9099; --dsw-alias-label-dimmed:#777;
    --dsw-alias-state-success-primary:#22c55e; --dsw-alias-state-error-primary:#f87171;
    --dsw-alias-scrollbar-bg-l2:rgba(255,255,255,.16); --dsw-alias-scrollbar-hover-l2:rgba(255,255,255,.28);
    --dsw-alias-brand-primary:#5686fe;
  }
  html,body{margin:0;height:100%;background:#16171a;color:#e9eaec;
    font:14px -apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif}
  #host{position:relative;height:100%;box-sizing:border-box}
  #composer{position:fixed;left:0;right:0;bottom:0;height:250px;z-index:5;
    background:linear-gradient(180deg,rgba(27,28,32,.55),rgba(22,23,26,.96));
    border-top:1px solid rgba(255,255,255,.06);
    display:flex;flex-direction:column;justify-content:center;gap:8px;padding:0 26px;box-sizing:border-box}
  .sendbtn{margin-left:auto;width:32px;height:32px;border-radius:50%;border:1px solid rgba(255,255,255,.14);
    background:rgba(255,255,255,.06);color:#e9eaec;font-size:14px;cursor:pointer}
  .mock{color:#8b9099;font-size:12px}
  .mockbox{height:46px;border:1px solid rgba(255,255,255,.09);border-radius:12px;background:rgba(255,255,255,.03);
    display:flex;align-items:center;padding:0 14px;color:#8b9099;font-size:13px}
  .mockrow{display:flex;gap:10px;align-items:center}
  .chip{padding:2px 8px;border:1px solid rgba(255,255,255,.12);border-radius:999px;font-size:11px;color:#b8bcc4}
  #probe{position:fixed;left:8px;bottom:8px;z-index:9;background:rgba(0,0,0,.85);color:#9ef;
    font:11px/1.5 ui-monospace,Consolas,monospace;padding:6px 8px;border-radius:8px;white-space:pre;max-width:640px}
</style>
<style>${css}</style></head>
<body><div id="host"></div>
<div id="composer">
  <div class="mockrow"><span class="chip">关闭</span><span class="chip">普通</span><span class="chip">高级</span><span class="chip">极端</span><span class="mock">审查 自动</span></div>
  <div class="mockbox">发消息或创建任务，/ 调用指令，@ 文件或对话</div>
  <div class="mockrow"><span class="chip">+</span><span class="mock">完全权限</span><span class="mock">Deepseek V4.1 Flash Max</span><button type="button" class="sendbtn" aria-label="发送消息">↑</button></div>
</div>
<div id="probe">booting…</div>
<script src="react.js"></script>
<script src="react-dom.js"></script>
<script>
  const MODELS = ${JSON.stringify(MODELS)};
  const PACKAGES = ${JSON.stringify(PACKAGES)};
  const COOL_UNTIL = Date.now() + 2 * 60 * 60 * 1000;
  const MODEL_LIMIT_UNTIL = Date.now() + 2 * 60 * 60 * 1000;
  // fixtures for every route the panel calls
  const json = (obj) => Promise.resolve({ ok: true, status: 200, json: async () => obj });
  // Add-account OAuth: one pending poll, then the account the host collected.
  let loginPolls = 0;
  window.fetch = (url, init) => {
    const u = String(url);
    if (u.includes('/login/start')) return json({ state: 'st-fixture', url: 'https://www.codebuddy.cn/login?platform=CLI&state=st-fixture', region: 'cn' });
    if (u.includes('/login/poll')) return json(loginPolls++ === 0
      ? { done: false, pending: true, message: '11217:login ing...' }
      : { done: true, account: { id: 'a3', accountName: '新账号', domain: 'www.codebuddy.cn' } });
    if (u.includes('/pool/checkin')) return json({ results: [{ id: 'a1', ok: true }], checkedIn: 1, failed: 0 });
    if (u.includes('/pool/stats')) return json({ stats: {
      a1: { total: 12, successes: 11, failures: 1, inFlight: 1, lastSuccessAt: Date.now() - 90000 },
      a2: { total: 6, successes: 6, failures: 0, inFlight: 0, lastSuccessAt: Date.now() - 7200000 },
    }, totals: {
      calls: 18, successes: 17, failures: 1, inFlight: 1,
      firstTokenMs: 3120, tokensPerSecond: 117.6, totalTokens: 49230,
    }, modelHealth: { a2: { 'deepseek-v4.1-flash': { kind: 'rate', until: MODEL_LIMIT_UNTIL, reason: '模型限流，稍后恢复' } } } });
    if (u.includes('/pool/credits')) return json({
      accounts: [
        { id: 'a1', credits: 2098, creditsTotal: 2400, packages: [
          { packageName: '新人体验包', remain: 1200, size: 1200, monthly: false, expiresAtMs: Date.now() + 86400000 * 7 },
          { packageName: '日常赠送包', remain: 898, size: 1200, monthly: true, cycleRefreshMs: Date.now() + 86400000 * 14 },
        ], checkin: { active: true, todayCheckedIn: false, todayCredit: 100, dailyCredit: 100, streakDays: 3 },
          health: { kind: 'rate', until: COOL_UNTIL, reason: '频率限制，请在 2026-09-17 21:30:00 后重试' } },
        { id: 'a2', credits: 1197, creditsTotal: 1500, packages: [
          { packageName: '续费礼包', remain: 1197, size: 1500, monthly: true, cycleRefreshMs: Date.now() + 86400000 * 20 },
        ], checkin: { active: true, todayCheckedIn: true, todayCredit: 100, dailyCredit: 100, streakDays: 1 },
        },
      ],
      health: { a1: { kind: 'rate', until: COOL_UNTIL, reason: '频率限制' } },
      modelHealth: { a2: { 'deepseek-v4.1-flash': { kind: 'rate', until: MODEL_LIMIT_UNTIL, reason: '模型限流，稍后恢复' } } },
      cooling: 1,
      stats: {
        a1: { total: 12, successes: 11, failures: 1, inFlight: 1, lastSuccessAt: Date.now() - 90000 },
        a2: { total: 6, successes: 6, failures: 0, inFlight: 0, lastSuccessAt: Date.now() - 7200000 },
      },
      totals: {
        calls: 18, successes: 17, failures: 1, inFlight: 1,
        firstTokenMs: 3120, tokensPerSecond: 117.6, totalTokens: 49230,
      },
    });
    if (u.includes('/tokens')) return json({ scope: ['workbuddy','workbuddy-global'], ignoredProviders: ['opencode-go','anthropic'],
      providers: {
        workbuddy: { inputTokens: 41230, outputTokens: 173, cacheReadTokens: 33980, totalTokens: 58520, messages: 41 },
        'workbuddy-global': { inputTokens: 26004, outputTokens: 91, cacheReadTokens: 20446, totalTokens: 58522, messages: 12 },
      },
      total: { inputTokens: 67234, outputTokens: 264, cacheReadTokens: 54426, totalTokens: 117042, messages: 53 } });
    /* must precede the /usage check: '/usage-stats' contains '/usage' */
    /* an override lets the chart be driven with adversarial series (hundreds of
       buckets, zero-token hours) without touching these defaults */
    if (u.includes('/usage-stats')) return json(window.__USAGE_OVERRIDE__ ?? {
      range: '3d', since: Date.now() - 3 * 864e5, until: Date.now(),
      totals: { calls: 81, failures: 0, promptTokens: 16920000, completionTokens: 35300, totalTokens: 16950000, avgLatencyMs: 5110, avgTokensPerSecond: 68.7, credits: 484.3, cacheHitTokens: 12000000, cacheMissTokens: 4920000, tokensPerCredit: 35000 },
      series: [
        { hour: Date.now() - 26 * 36e5, calls: 2, failures: 0, promptTokens: 41000, completionTokens: 200, totalTokens: 41200 },
        { hour: Date.now() - 22 * 36e5, calls: 5, failures: 0, promptTokens: 120000, completionTokens: 800, totalTokens: 120800 },
        { hour: Date.now() - 12 * 36e5, calls: 9, failures: 0, promptTokens: 420000, completionTokens: 2600, totalTokens: 422600 },
        { hour: Date.now() - 2 * 36e5, calls: 65, failures: 0, promptTokens: 16400000, completionTokens: 31700, totalTokens: 16431700 },
      ],
      accounts: [
        { accountId: 'd8596988-jf9f', region: 'cn', calls: 77, failures: 0, promptTokens: 16870000, completionTokens: 34700, totalTokens: 16910000, avgLatencyMs: 5270, avgTokensPerSecond: 68.7, credits: 480, cacheHitTokens: 11900000, cacheMissTokens: 4880000, tokensPerCredit: 35229 },
        { accountId: '659c93fc-2b0d', region: 'cn', calls: 4, failures: 0, promptTokens: 48600, completionTokens: 609, totalTokens: 49200, avgLatencyMs: 2010, avgTokensPerSecond: 63.5, credits: 4.3, cacheHitTokens: 100000, cacheMissTokens: 40000, tokensPerCredit: 11441 },
      ],
      models: [
        { model: 'cn:deepseek-v4.1-flash', calls: 77, failures: 0, promptTokens: 16870000, completionTokens: 34700, totalTokens: 16910000, avgLatencyMs: 5270, avgTokensPerSecond: 68.7, credits: 480, cacheHitTokens: 11900000, cacheMissTokens: 4880000, tokensPerCredit: 35229 },
        { model: 'deepseek-v4.1-flash', calls: 4, failures: 0, promptTokens: 48600, completionTokens: 585, totalTokens: 49200, avgLatencyMs: 2010, avgTokensPerSecond: 63.5, credits: 4.3, cacheHitTokens: 100000, cacheMissTokens: 40000, tokensPerCredit: 11441 },
      ],
      regions: [
        { region: 'cn', calls: 81, failures: 0, promptTokens: 16920000, completionTokens: 35300, totalTokens: 16950000, avgLatencyMs: 5110, avgTokensPerSecond: 68.7, credits: 484.3, cacheHitTokens: 12000000, cacheMissTokens: 4920000, tokensPerCredit: 35000 },
      ],
    });
    if (u.includes('/usage')) return json({ status: 'signed-in', accountName: 'Demo Account', nickname: 'Demo Account',
      credits: { total: 1197, packages: PACKAGES, expiringSoon: 0 },
      checkin: { todayCheckedIn: true, todayCredit: 100, dailyCredit: 100, streakDays: 3 },
      models: MODELS,
      accounts: [ { id: 'a1', selected: false, accountName: 'Demo Account A', domain: 'www.workbuddy.cn' },
                  { id: 'a2', selected: true, accountName: 'Demo Account B', domain: 'www.workbuddy.cn' } ] });
    if (u.includes('/accounts/refresh')) return json({ accounts: [{ id: 'a2', selected: true, accountName: 'Demo Account B' }] });
    if (u.includes('/checkin')) return json({ ok: true });
    if (u.includes('/models/refresh')) return json({ models: MODELS });
    return Promise.resolve({ ok: false, status: 404, json: async () => ({ error: 'nf' }) });
  };

  const registered = [];
  const ctx = new Proxy({}, { get(_t, p) {
    if (p === 'effect') return (fn) => { try { fn(); } catch (e) { console.error('effect threw', e); } return () => {}; };
    if (p === 'locale') return { register: () => {}, bind: () => (k) => k };
    if (p === 'slots') return {
      inject: (key, register) => { try { register(); } catch (e) { console.error('inject threw', e); } },
      register: (entry, Comp) => { registered.push({ entry, Comp }); return () => {}; },
    };
    if (p === 'settingsScope') return { bind: () => ({ get: () => undefined, set: async () => {} }) };
    if (p === 'get') return () => undefined;
    return undefined;
  }});
  const requireShim = (name) => {
    if (name === 'react') return React;
    if (name === 'react/jsx-runtime') return {
      Fragment: React.Fragment,
      jsx: (t, p, k) => { const { children, ...rest } = p || {}; return React.createElement(t, { ...rest, key: k }, children); },
      jsxs: (t, p, k) => { const { children, ...rest } = p || {}; return React.createElement(t, { ...rest, key: k }, children); },
    };
    return new Proxy({}, { get: () => () => null });
  };
  let captured = null;
  window.__ModuleLoader__ = { load: (m) => { captured = m; } };
  const probe = document.getElementById('probe');
  function boot() {
    try {
      const ex = captured.factory(requireShim);
      ex.apply(ctx);
    } catch (e) { probe.textContent = 'BUNDLE FAILED: ' + e.message; return; }
    const entry = registered.find((r) => r.entry.name === 'conversation.view');
    if (!entry) { probe.textContent = 'FAIL: no conversation.view registration. got: ' + registered.map(r => r.entry.name).join(','); return; }
    const groups = [{ id: 'workbuddy', name: 'WorkBuddy', models: MODELS }];
    const modelDirectories = { directoryFor: () => ({ load: async () => {}, select: async () => {},
      store: { getSnapshot: () => ({ groups, current: { provider: 'workbuddy', model: 'deepseek-v4.1-flash' } }) } }) };
    const props = { t: void 0, modelDirectories,
      useSessions: (selector) => selector({ current: 'sess-1' }),
      settingsScope: { get: () => undefined, set: async () => {} }, region: 'cn' };
    ReactDOM.createRoot(document.getElementById('host')).render(React.createElement(entry.Comp, props));
    setTimeout(measure, 1500);
  }
  function measure() {
    const m = {};
    const root = document.querySelector('.dsm-wb-view-root');
    if (!root) { probe.textContent = 'FAIL: view root not mounted; html=' + document.getElementById('host').innerHTML.slice(0, 300); return; }
    const g = (el, p) => el ? getComputedStyle(el)[p] : null;
    const models = document.querySelector('.dsm-wb-view-panel .dsm-wb-side-models');
    const accountList = document.querySelector('.dsm-wb-view-panel .dsm-wb-side-accounts');
    const modelCard = document.querySelector('.dsm-wb-view-panel .dsm-wb-side-group-models');
    const poolCard = document.querySelector('.dsm-wb-view-panel .dsm-wb-side-group-pool');
    const providerCard = document.querySelector('.dsm-wb-view-panel .dsm-wb-side-group-provider');
    const creditsCard = document.querySelector('.dsm-wb-view-panel .dsm-wb-side-group-credits');
    const body = document.querySelector('.dsm-wb-view-panel .dsm-wb-side-body');
    const group = document.querySelector('.dsm-wb-view-panel .dsm-wb-side-group');
    const credit = document.querySelector('.dsm-wb-side-credit');
    const checkbox = document.querySelector('.dsm-wb-side-model-enabled input');
    const tiers = document.querySelector('.dsm-wb-side-context span');
    m['rows'] = document.querySelectorAll('.dsm-wb-side-model').length;
    m['--wb-hairline on view root'] = getComputedStyle(root).getPropertyValue('--wb-hairline').trim() || '(undefined)';
    m['group card'] = group ? g(group,'borderTopWidth') + ' ' + g(group,'borderTopColor') + ' bg ' + g(group,'backgroundColor') : null;
    m['credit tile'] = credit ? g(credit,'borderTopWidth') + ' ' + g(credit,'borderTopColor') : null;
    m['model checkbox'] = checkbox ? g(checkbox,'borderTopWidth') + ' ' + g(checkbox,'borderTopColor') + ' bg ' + g(checkbox,'backgroundColor') : null;
    m['context pill'] = tiers ? g(tiers,'borderTopWidth') + ' ' + g(tiers,'borderTopColor') : null;
    m['models max-height'] = models ? g(models,'maxHeight') : null;
    m['models client/scroll h'] = models ? models.clientHeight + ' / ' + models.scrollHeight : null;
    m['accounts client/scroll w'] = accountList ? accountList.clientWidth + ' / ' + accountList.scrollWidth : null;
    m['account stats'] = Array.from(document.querySelectorAll('.dsm-wb-side-acct-metrics')).map((el) => el.textContent).join(' | ');
    m['account in-flight'] = Array.from(document.querySelectorAll('.dsm-wb-side-status-live')).map((el) => el.textContent).join(' | ');
    m['account statuses'] = Array.from(document.querySelectorAll('.dsm-wb-view-panel .dsm-wb-side-acct-side .dsm-wb-side-status')).map((el) => el.textContent).join(' | ');
    m['model limit'] = Array.from(document.querySelectorAll('.dsm-wb-view-panel .dsm-wb-side-model-limit')).map((el) => el.textContent).join(' | ');
    m['model limit time'] = Array.from(document.querySelectorAll('.dsm-wb-view-panel .dsm-wb-side-model-limit-time')).map((el) => el.textContent).join(' | ');
    const poolMetrics = document.querySelector('.dsm-wb-view-panel .dsm-wb-side-pool-metrics');
    m['pool metrics'] = poolMetrics ? poolMetrics.textContent : null;
    m['pool metrics client/scroll w'] = poolMetrics ? poolMetrics.clientWidth + ' / ' + poolMetrics.scrollWidth : null;
    m['view body w'] = body ? Math.round(body.getBoundingClientRect().width) : null;
    m['model card w/h'] = modelCard ? Math.round(modelCard.getBoundingClientRect().width) + ' / ' + Math.round(modelCard.getBoundingClientRect().height) : null;
    m['pool card w/h'] = poolCard ? Math.round(poolCard.getBoundingClientRect().width) + ' / ' + Math.round(poolCard.getBoundingClientRect().height) : null;
    m['overview left h'] = providerCard && creditsCard
      ? Math.round(providerCard.getBoundingClientRect().height + creditsCard.getBoundingClientRect().height) : null;
    m['root padding-bottom'] = g(root,'paddingBottom');
    m['measured clearance var'] = getComputedStyle(root).getPropertyValue('--wb-view-clearance').trim() || '(unset)';
    root.scrollTop = root.scrollHeight;
    requestAnimationFrame(() => {
      // Measure the boxes that are actually clipped by the viewport, not a row
      // that sits outside its own scroll box (that rect lies about visibility).
      const dock = document.getElementById('composer').getBoundingClientRect();
      const panel = document.querySelector('.dsm-wb-view-panel');
      const accounts = document.querySelector('.dsm-wb-view-panel .dsm-wb-side-accounts');
      const vis = (el) => el ? Math.round(Math.min(el.getBoundingClientRect().bottom, window.innerHeight)) : null;
      const verdict = (n) => n === null ? null : (n <= dock.top + 1 ? n + ' vs ' + Math.round(dock.top) + '  CLEARS' : n + ' vs ' + Math.round(dock.top) + '  UNDER DOCK');
      m['scrolled to end: panel bottom'] = verdict(vis(panel));
      m['scrolled to end: models box bottom'] = verdict(vis(models));
      m['scrolled to end: accounts box bottom'] = verdict(vis(accounts));
      m['root client/scroll h'] = root.clientHeight + ' / ' + root.scrollHeight;
      const ok = [vis(panel), vis(models), vis(accounts)].filter((v) => v !== null).every((v) => v <= dock.top + 1)
        && m['--wb-hairline on view root'] !== '(undefined)';
      probe.textContent = Object.entries(m).map(([k,v]) => k + ': ' + v).join('\\n');
      document.title = 'HARNESS ' + (ok ? 'PASS' : 'CHECK');
      // leave the page at the top so the screenshot shows the whole panel
      root.scrollTop = 0;
    });
  }
  let tries = 0;
  const wait = setInterval(() => {
    if (captured) { clearInterval(wait); boot(); }
    else if (++tries > 100) { clearInterval(wait); probe.textContent = 'bundle did not load'; }
  }, 50);
</script>
<script src="wb-client.js"></script>
</body></html>`;

fs.writeFileSync(outPath, html);
console.log('wrote', outPath, fs.statSync(outPath).size, 'bytes');
