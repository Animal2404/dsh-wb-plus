// Evaluate the injected client bundle (a bare script, not an ES module) under a
// stub __ModuleLoader__ to catch load-time errors before the host serves it.
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';

const target = process.argv[2];
const source = fs.readFileSync(target, 'utf8');
const require_ = createRequire(import.meta.url);
const registered = [];

const ctx = new Proxy({}, {
  get(_t, prop) {
    if (prop === 'effect') return (fn) => { try { fn(); } catch {} return () => {}; };
    if (prop === 'locale') return { register: () => {}, bind: () => (k) => k };
    if (prop === 'slots') return {
      inject: () => {},
      register: (entry, Comp) => { registered.push({ entry, Comp }); return () => {}; },
    };
    if (prop === 'settingsScope') return { bind: () => ({}) };
    if (prop === 'get') return () => undefined;
    return undefined;
  },
});

const sandboxRequire = (name) => {
  if (name === 'react') return require_('react');
  if (name === 'react/jsx-runtime') return require_('react/jsx-runtime');
  return new Proxy({}, { get: () => () => null });
};

const sandbox = {
  window: {
    __ModuleLoader__: {
      load: (mod) => {
        const exports = mod.factory(sandboxRequire);
        console.log('module loaded:', mod.id);
        console.log('exports:', Object.keys(exports).join(', '));
        if (typeof exports.apply === 'function') {
          exports.apply(ctx);
          console.log('apply(ctx) ran without throwing');
        }
        console.log('slot registrations:', registered.length);
        for (const r of registered) {
          console.log('  slot:', r.entry.name, '| key:', r.entry.key, '| locale:', r.entry.locale);
        }
      },
    },
  },
  console,
  fetch: () => Promise.reject(new Error('no network in preflight')),
  AbortController,
  setTimeout,
  clearTimeout,
  document: undefined,
};
sandbox.globalThis = sandbox;
vm.createContext(sandbox);
try {
  vm.runInContext(source, sandbox, { filename: target });
} catch (error) {
  console.error('LOAD/RUN FAILED:', error && error.message);
  process.exit(1);
}
