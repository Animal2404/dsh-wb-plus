// Live regression for the shared pool: clicking a row must move the single
// selection highlight and the left credits card together, while switching the
// model region must leave that card untouched.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

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
const PORT = 9358;
const PROFILE = new URL('./.chrome-live-account-focus', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const WIDTH = Number(process.argv[2] ?? 1296);
const HEIGHT = Number(process.argv[3] ?? 1198);

const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`,
  '--no-first-run', '--no-default-browser-check', '--disable-gpu', '--hide-scrollbars',
  `--window-size=${WIDTH},${HEIGHT}`, 'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function target() {
  for (let i = 0; i < 40; i += 1) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const page = list.find((entry) => entry.type === 'page' && entry.webSocketDebuggerUrl);
      if (page) return page;
    } catch {}
    await sleep(500);
  }
  throw new Error('CDP not reachable');
}

const page = await target();
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
let id = 0;
const pending = new Map();
const errors = [];
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    pending.get(message.id)(message);
    pending.delete(message.id);
    return;
  }
  if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text);
  if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') errors.push((message.params.args ?? []).map((arg) => arg.value ?? arg.description).join(' '));
};
function send(method, params = {}) {
  const requestId = ++id;
  return new Promise((resolve, reject) => {
    pending.set(requestId, (message) => (message.error ? reject(new Error(JSON.stringify(message.error))) : resolve(message.result)));
    ws.send(JSON.stringify({ id: requestId, method, params }));
  });
}
const evaluate = async (expression) => {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails).slice(0, 500));
  return result.result?.value;
};

await send('Runtime.enable');
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: startupUrl() });
await sleep(7000);

await evaluate(`(() => {
  const rows = Array.from(document.querySelectorAll('[role="treeitem"]'));
  (rows.find((row) => (row.textContent || '').includes('只回复')) ?? rows[0])?.click();
})()`);
await sleep(3500);
await evaluate(`(() => {
  Array.from(document.querySelectorAll('button,[role="tab"]')).find((button) => (button.textContent || '').trim() === 'WorkBuddy')?.click();
})()`);
await sleep(3500);

const before = await evaluate(`(() => {
  const selected = Array.from(document.querySelectorAll('.dsm-wb-side-acct')).find((row) => row.getAttribute('data-current') === 'true');
  return {
    selectedName: selected?.querySelector('.dsm-wb-side-acct-name')?.textContent ?? null,
    selectedRegion: selected?.querySelector('.dsm-wb-side-acct-region')?.textContent ?? null,
    creditsAccount: document.querySelector('.dsm-wb-side-group-credits .dsm-wb-side-account-name')?.textContent ?? null,
    creditsValues: Array.from(document.querySelectorAll('.dsm-wb-side-group-credits .dsm-wb-side-credit-value')).map((el) => el.textContent),
    currentCount: document.querySelectorAll('.dsm-wb-side-acct[data-current="true"]').length,
  };
})()`);

const clicked = await evaluate(`(async () => {
  const rows = Array.from(document.querySelectorAll('.dsm-wb-side-acct'));
  const target = rows.find((row) => row.getAttribute('data-current') !== 'true');
  if (!target) return null;
  const name = target.querySelector('.dsm-wb-side-acct-name')?.textContent ?? null;
  target.querySelector('.dsm-wb-side-acct-pick')?.click();
  await new Promise((resolve) => setTimeout(resolve, 1600));
  const selected = Array.from(document.querySelectorAll('.dsm-wb-side-acct')).find((row) => row.getAttribute('data-current') === 'true');
  return {
    name,
    selectedName: selected?.querySelector('.dsm-wb-side-acct-name')?.textContent ?? null,
    currentCount: document.querySelectorAll('.dsm-wb-side-acct[data-current="true"]').length,
    creditsAccount: document.querySelector('.dsm-wb-side-group-credits .dsm-wb-side-account-name')?.textContent ?? null,
    creditsValues: Array.from(document.querySelectorAll('.dsm-wb-side-group-credits .dsm-wb-side-credit-value')).map((el) => el.textContent),
  };
})()`);

const afterRegionSwitch = await evaluate(`(async () => {
  const current = Array.from(document.querySelectorAll('.dsm-wb-side-group-models .dsm-workbuddy-tab')).find((button) => button.getAttribute('aria-pressed') === 'true');
  const target = Array.from(document.querySelectorAll('.dsm-wb-side-group-models .dsm-workbuddy-tab')).find((button) => button !== current);
  target?.click();
  await new Promise((resolve) => setTimeout(resolve, 1600));
  return {
    activeRegion: Array.from(document.querySelectorAll('.dsm-wb-side-group-models .dsm-workbuddy-tab')).find((button) => button.getAttribute('aria-pressed') === 'true')?.textContent ?? null,
    creditsAccount: document.querySelector('.dsm-wb-side-group-credits .dsm-wb-side-account-name')?.textContent ?? null,
    creditsValues: Array.from(document.querySelectorAll('.dsm-wb-side-group-credits .dsm-wb-side-credit-value')).map((el) => el.textContent),
  };
})()`);

console.log(JSON.stringify({ before, clicked, afterRegionSwitch, errors }, null, 2));
ws.close();
chrome.kill();
process.exit(0);
