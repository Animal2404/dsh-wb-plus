// Round 35: the pool aggregates both providers while only the model list obeys
// the region switch.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const PORT = 9369;
const PAGE = process.argv[2];
const OUT = process.argv[3] ?? 'C:/Users/axia/.dsh/config-backups/wb-probe/sidebar/render';
const userDir = `${OUT}/chrome-prof-round35`;

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
    return;
  }
  if (message.method === 'Runtime.exceptionThrown') {
    console.error('PAGE EXCEPTION:', message.params.exceptionDetails.exception?.description ?? message.params.exceptionDetails.text);
  }
  if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
    console.error('PAGE CONSOLE ERROR:', (message.params.args ?? []).map((arg) => arg.value ?? arg.description).join(' '));
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
await sleep(3000);

const read = await evaluate(`(() => {
  const root = document.querySelector('.dsm-wb-view-panel');
  return {
    title: document.title,
    poolLabel: document.querySelector('.dsm-wb-view-panel .dsm-wb-side-group-pool .dsm-wb-side-label')?.textContent ?? null,
    poolRegionBadges: Array.from(document.querySelectorAll('.dsm-wb-side-pool-region')).map((el) => el.textContent),
    accountRegions: Array.from(document.querySelectorAll('.dsm-wb-side-acct-region')).map((el) => el.textContent),
    accountNames: Array.from(document.querySelectorAll('.dsm-wb-side-acct-name')).map((el) => el.textContent),
    poolSummary: document.querySelector('.dsm-wb-side-pool-summary')?.textContent ?? null,
    poolMetrics: document.querySelector('.dsm-wb-side-pool-metrics')?.textContent ?? null,
    providerInModelCard: document.querySelector('.dsm-wb-side-group-models .dsm-wb-side-model-region') !== null,
    panelOverflow: root ? [root.clientWidth, root.scrollWidth] : null,
  };
})()`);

assert.equal(read.title, 'HARNESS PASS');
assert.equal(read.poolRegionBadges.length, 0, 'the pool title no longer carries a single-region badge');
assert.ok(read.accountRegions.includes('CN') && read.accountRegions.includes('AI'), 'account rows are labelled per provider');
assert.ok(read.accountNames.length >= 3, 'the pool aggregates accounts from both providers');
assert.ok(read.poolSummary.includes('3'), 'the pool summary counts both providers');
assert.equal(read.providerInModelCard, true, 'the region switch stays on the model card');
assert.ok(read.panelOverflow[0] <= read.panelOverflow[1]);

/* Clicking a pooled account must visibly select it. The host now supplies the
   selected flag; this exercises the client's merge + row rendering end to end. */
const selectedAfterClick = await evaluate(`(async () => {
  const rows = Array.from(document.querySelectorAll('.dsm-wb-side-acct'));
  const target = rows.find((row) => row.querySelector('.dsm-wb-side-acct-region')?.textContent === 'CN' && row.getAttribute('data-current') !== 'true')
    ?? rows.find((row) => row.getAttribute('data-current') !== 'true');
  if (!target) return { error: 'no unselected account row' };
  const name = target.querySelector('.dsm-wb-side-acct-name')?.textContent ?? null;
  target.querySelector('.dsm-wb-side-acct-pick')?.click();
  await new Promise((resolve) => setTimeout(resolve, 700));
  return {
    name,
    currentNames: Array.from(document.querySelectorAll('.dsm-wb-side-acct[data-current="true"] .dsm-wb-side-acct-name')).map((el) => el.textContent),
    currentCount: document.querySelectorAll('.dsm-wb-side-acct[data-current="true"]').length,
    ariaPressed: target.querySelector('.dsm-wb-side-acct-pick')?.getAttribute('aria-pressed'),
  };
})()`);
assert.equal(selectedAfterClick.error, undefined, 'there is a clickable pooled account row');
assert.equal(selectedAfterClick.currentCount, 1, 'exactly one pooled account is selected after the click');
assert.equal(selectedAfterClick.currentNames[0], selectedAfterClick.name, 'the clicked account is the selected one');
assert.equal(selectedAfterClick.ariaPressed, 'true', 'the clicked row reports aria-pressed=true');

/* The model-region switch changes only the model list. The left credits card
   follows the selected pool account and must keep its numbers. */
const creditsBefore = await evaluate(`(() => ({
  account: document.querySelector('.dsm-wb-side-group-credits .dsm-wb-side-account-name')?.textContent ?? null,
  values: Array.from(document.querySelectorAll('.dsm-wb-side-group-credits .dsm-wb-side-credit-value')).map((el) => el.textContent),
}))()`);
const switched = await evaluate(`(async () => {
  const buttons = Array.from(document.querySelectorAll('.dsm-wb-side-group-models .dsm-workbuddy-tab'));
  const target = buttons.find((button) => button.textContent.trim() === '国际版');
  if (!target) return false;
  target.click();
  await new Promise((resolve) => setTimeout(resolve, 900));
  return true;
})()`);
assert.equal(switched, true, 'the model-region switch is present');
const creditsAfter = await evaluate(`(() => ({
  account: document.querySelector('.dsm-wb-side-group-credits .dsm-wb-side-account-name')?.textContent ?? null,
  values: Array.from(document.querySelectorAll('.dsm-wb-side-group-credits .dsm-wb-side-credit-value')).map((el) => el.textContent),
}))()`);
assert.deepEqual(creditsAfter, creditsBefore, 'switching the model region does not change the left credits card');

await evaluate(`document.getElementById('probe').style.display = 'none'; 'hidden'`);
await send('Page.captureScreenshot', { format: 'png' }).then((result) => fs.writeFileSync(`${OUT}/shot-round35.png`, Buffer.from(result.data, 'base64')));
console.log(JSON.stringify(read, null, 2));
ws.close();
chrome.kill();
process.exit(0);
