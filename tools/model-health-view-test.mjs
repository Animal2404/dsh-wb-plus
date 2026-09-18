// Verify the two cooldown scopes in the real rendered panel: an account-wide
// cooldown keeps the account badge, while a model-scoped limit lands on the
// selected model row with a reset time.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9363;
const PAGE = process.argv[2];
const OUT = process.argv[3] ?? new URL('.', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
const userDir = `${OUT}/chrome-prof-model-health`;

fs.mkdirSync(userDir, { recursive: true });
const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${userDir}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-gpu',
  '--hide-scrollbars',
  '--window-size=1296,1198',
  'about:blank',
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
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    pending.get(message.id)(message);
    pending.delete(message.id);
  }
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
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails).slice(0, 400));
  return result.result?.value;
};

await send('Runtime.enable');
await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1296, height: 1198, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: pathToFileURL(path.resolve(PAGE)).href });
await sleep(2800);

const read = await evaluate(`(() => ({
  title: document.title,
  accountStatuses: Array.from(document.querySelectorAll('.dsm-wb-view-panel .dsm-wb-side-acct-side .dsm-wb-side-status')).map((el) => el.textContent),
  modelLimits: Array.from(document.querySelectorAll('.dsm-wb-view-panel .dsm-wb-side-model-limit')).map((el) => el.textContent),
  modelLimitTimes: Array.from(document.querySelectorAll('.dsm-wb-view-panel .dsm-wb-side-model-limit-time')).map((el) => el.textContent),
  panelOverflow: (() => { const panel = document.querySelector('.dsm-wb-view-panel'); return panel ? [panel.clientWidth, panel.scrollWidth] : null; })(),
}))()`);

assert.equal(read.title, 'HARNESS PASS');
assert.ok(read.accountStatuses.includes('冷却中'), 'an account-wide limit keeps the cooling badge');
assert.ok(read.accountStatuses.includes('模型限流'), 'a model-only limit gets its own account badge');
assert.ok(read.modelLimits.includes('模型限流'), 'the selected model row carries the model-limit badge');
assert.ok(read.modelLimitTimes.some((text) => text.startsWith('限流恢复时间 ')), 'the selected model row shows the reset time');
assert.ok(read.panelOverflow[0] <= read.panelOverflow[1], 'the panel does not overflow horizontally');

await evaluate(`document.getElementById('probe').style.display = 'none'; 'hidden'`);
await send('Page.captureScreenshot', { format: 'png' }).then((result) => fs.writeFileSync(`${OUT}/shot-model-health.png`, Buffer.from(result.data, 'base64')));
console.log(JSON.stringify(read, null, 2));
ws.close();
chrome.kill();
process.exit(0);
