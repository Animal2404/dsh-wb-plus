// Minimal runner so the repository can exercise its regression suite without
// pulling the upstream package's full build toolchain.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const cases = [
  'abandoned-call-test.mjs',
  'chat-refusal-health-test.mjs',
  'cooldown-survives-credits-test.mjs',
  'host-routes-test.mjs',
  'shim-stats-test.mjs',
  'usage-ledger-test.mjs',
  'usage-persistence-test.mjs'
];

let failed = 0;
for (const name of cases) {
  const result = spawnSync(process.execPath, [path.join(here, name)], { stdio: 'inherit' });
  if (result.status !== 0) {
    failed += 1;
    console.error(`FAIL ${name} (exit ${result.status ?? 'signal'})`);
  } else {
    console.log(`PASS ${name}`);
  }
}
if (failed > 0) {
  console.error(`${failed} test file(s) failed`);
  process.exit(1);
}
console.log(`${cases.length} test files passed`);
