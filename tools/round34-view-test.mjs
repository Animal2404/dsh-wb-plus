// Round 34 assertions: max default effort, token expiry, pool region badge,
// expiring-in-3-days credits, and the provider switch living on the model card.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9367;
const PAGE = process.argv[2];
const OUT = process.argv[3] ?? 'C:/Users/axia/.dsh/config-backups/wb-probe/sidebar/render';
const userDir = `${OUT}/chrome-prof-round34`;

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
  'about:blank'
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

const read = await evaluate(`(() => {
  const root = document.querySelector('.dsm-wb-view-panel');
  const modelCard = document.querySelector('.dsm-wb-view-panel .dsm-wb-side-group-models');
  const providerCard = document.querySelector('.dsm-wb-view-panel .dsm-wb-side-group-provider');
  const poolLabel = document.querySelector('.dsm-wb-view-panel .dsm-wb-side-group-pool .dsm-wb-side-label');
  return {
    title: document.title,
    modelDefaults: Array.from(document.querySelectorAll('.dsm-wb-view-panel .dsm-wb-side-model-meta')).map((el) => el.textContent).filter((text) => text.includes('默认')),
    poolLabel: poolLabel?.textContent ?? null,
    expiring: document.querySelector('.dsm-wb-side-pool-stat-expiring')?.textContent ?? null,
    tokenExpiry: Array.from(document.querySelectorAll('.dsm-wb-side-acct-token')).map((el) => el.textContent),
    providerInModelCard: modelCard?.querySelector('.dsm-wb-side-model-region') !== null,
    providerCardGone: providerCard === null,
    panelOverflow: root ? [root.clientWidth, root.scrollWidth] : null,
  };
})()`);

assert.equal(read.title, 'HARNESS PASS');
assert.ok(read.modelDefaults.some((text) => text.includes('max')), 'a max-capable model shows max as its default effort');
assert.ok(read.poolLabel.includes('账号'), 'the shared pool counts accounts from both providers');
assert.ok(read.expiring !== null && read.expiring.includes('近 3 天到期'), 'the pool shows credits expiring within three days');
assert.ok(read.tokenExpiry.length > 0 && read.tokenExpiry[0].includes('令牌到期'), 'account rows show token expiry');
assert.equal(read.providerInModelCard, true, 'the provider switch moved onto the model card');
assert.equal(read.providerCardGone, true, 'the old provider card is gone');
assert.ok(read.panelOverflow[0] <= read.panelOverflow[1]);

await evaluate(`document.getElementById('probe').style.display = 'none'; 'hidden'`);
await send('Page.captureScreenshot', { format: 'png' }).then((result) => fs.writeFileSync(`${OUT}/shot-round34.png`, Buffer.from(result.data, 'base64')));
console.log(JSON.stringify(read, null, 2));
ws.close();
chrome.kill();
process.exit(0);
