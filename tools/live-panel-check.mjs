// Live check against the running dsh web UI: open the WorkBuddy tab in a real
// authenticated browser profile and read the pool readout back from the page.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

/** The supervisor appends the startup URL to dsh-web.log; that token is what
 *  sets the auth cookie for a fresh headless profile. */
function startupUrl() {
  const log = path.join(process.env.LOCALAPPDATA ?? '', 'DSH', 'dsh-web.log');
  const lines = fs.readFileSync(log, 'utf8').split(/\r?\n/);
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const at = lines[i].indexOf('dsh web: http');
    if (at !== -1) return lines[i].slice(at + 'dsh web: '.length).trim();
  }
  throw new Error('no startup URL in ' + log);
}

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9357;
const PROFILE = new URL('./.chrome-live-profile', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const OUT = new URL('./shots', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const WIDTH = Number(process.argv[2] ?? 1296);
const HEIGHT = Number(process.argv[3] ?? 1198);
const TAG = process.argv[4] ?? 'round21';
const CLICK_FIRST = process.argv[5] !== 'no-click';

fs.mkdirSync(OUT, { recursive: true });
const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`,
  '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--hide-scrollbars',
  `--window-size=${WIDTH},${HEIGHT}`, 'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function target() {
  for (let i = 0; i < 40; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = list.find((t) => t.type === 'page' && t.webSocketDebuggerUrl);
      if (page) return page;
    } catch {}
    await sleep(500);
  }
  throw new Error('CDP not reachable');
}

const page = await target();
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let id = 0;
const pending = new Map();
const logs = [];
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); return; }
  if (m.method === 'Runtime.exceptionThrown') logs.push('exception: ' + (m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text));
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') logs.push('console.error: ' + (m.params.args ?? []).map((a) => a.value ?? a.description).join(' '));
};
function send(method, params = {}) {
  const myId = ++id;
  return new Promise((res, rej) => {
    pending.set(myId, (m) => (m.error ? rej(new Error(method + ': ' + JSON.stringify(m.error))) : res(m.result)));
    ws.send(JSON.stringify({ id: myId, method, params }));
  });
}
const evaluate = async (js) => {
  const r = await send('Runtime.evaluate', { expression: js, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 400));
  return r.result?.value;
};

await send('Runtime.enable');
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: false });
const url = startupUrl();
await send('Page.navigate', { url });
await sleep(7000);

const out = { url: await evaluate('location.href'), title: await evaluate('document.title') };
out.tabs = await evaluate(`Array.from(document.querySelectorAll('button,[role="tab"]')).map((b) => (b.textContent || '').trim()).filter((t) => t.length > 0 && t.length < 20).slice(0, 12)`);
out.diag = await evaluate(`(() => {
  const exact = Array.from(document.querySelectorAll('*')).filter((el) => (el.textContent || '').trim() === 'WorkBuddy');
  const sessions = Array.from(document.querySelectorAll('[class*="session"],[class*="Session"]'))
    .map((el) => ({ tag: el.tagName, cls: String(el.className).slice(0, 60), text: (el.textContent || '').trim().slice(0, 40), role: el.getAttribute('role') }))
    .filter((e) => e.text.length > 0 && e.text.length < 40).slice(0, 14);
  return {
    exactCount: exact.length,
    exact: exact.slice(0, 5).map((el) => ({ tag: el.tagName, cls: String(el.className).slice(0, 70), role: el.getAttribute('role'), parent: el.parentElement ? el.parentElement.tagName + '.' + String(el.parentElement.className).slice(0, 40) : null })),
    sessions,
  };
})()`);
if (CLICK_FIRST) {
  /* the tab bar only exists once a session is open */
  out.openedSession = await evaluate(`(() => {
    const rows = Array.from(document.querySelectorAll('[role="treeitem"]'));
    const hit = rows.find((r) => (r.textContent || '').includes('只回复')) ?? rows[0];
    if (!hit) return null;
    hit.click();
    return (hit.textContent || '').trim().slice(0, 20);
  })()`);
  await sleep(3500);
  out.clicked = await evaluate(`(() => {
    const hit = Array.from(document.querySelectorAll('button,[role="tab"]')).find((b) => (b.textContent || '').trim() === 'WorkBuddy');
    if (!hit) return false;
    hit.click();
    return true;
  })()`);
  await sleep(3500);
}
out.panel = await evaluate(`(() => {
  const root = document.querySelector('.dsm-wb-view-root');
  const strip = document.querySelector('.dsm-wb-side-pool-metrics');
  const summary = document.querySelector('.dsm-wb-side-pool-summary');
  const accounts = document.querySelector('.dsm-wb-side-accounts');
  return {
    hasView: root !== null,
    items: strip ? Array.from(strip.querySelectorAll('.dsm-wb-side-pool-metric')).map((s) => s.textContent) : null,
    strip: strip ? {
      box: [Math.round(strip.getBoundingClientRect().width), Math.round(strip.getBoundingClientRect().height)],
      overflow: [strip.clientWidth, strip.scrollWidth],
      belowSummary: summary ? summary.getBoundingClientRect().bottom <= strip.getBoundingClientRect().top + 1 : null,
      aboveAccounts: accounts ? strip.getBoundingClientRect().bottom <= accounts.getBoundingClientRect().top + 1 : null,
    } : null,
    accountStats: Array.from(document.querySelectorAll('.dsm-wb-side-acct-metrics')).map((el) => el.textContent),
    accountCredits: Array.from(document.querySelectorAll('.dsm-wb-side-acct-credits')).map((el) => ({ text: el.textContent, box: [Math.round(el.getBoundingClientRect().width), Math.round(el.getBoundingClientRect().height)], overflow: [el.clientWidth, el.scrollWidth] })),
    accountRowOverflow: Array.from(document.querySelectorAll('.dsm-wb-side-acct')).map((el) => [el.clientWidth, el.scrollWidth]),
    summary: summary ? summary.textContent : null,
  };
})()`);
out.errors = logs.slice(0, 12);
await send('Page.captureScreenshot', { format: 'png' }).then((r) => fs.writeFileSync(`${OUT}/live-${TAG}-${WIDTH}.png`, Buffer.from(r.data, 'base64')));
console.log(JSON.stringify(out, null, 2));
ws.close();
chrome.kill();
process.exit(0);
