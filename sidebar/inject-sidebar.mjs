// Deterministic injector for the WorkBuddy main-area panel.
//
// Applies three additive edits to the plugin's compiled client bundle:
//   1. append the panel CSS to the existing card stylesheet,
//   2. insert the WorkBuddySidebar region ahead of the client index region,
//   3. register locale + the panel as a main-area view (the WorkBuddy tab).
//
// The sidebar `sidebar.footer.action` entry is deliberately NOT registered any
// more: the tab is the single surface. The component and its CSS stay, because
// the view is the same component with `mode: "view"`; the locale namespace and
// `sidebarT` stay too, because the view binds them.
//
// Idempotent by construction: each edit is keyed on a marker and skipped when
// the marker is already present, so re-running never double-applies.
//
// Usage: node inject-sidebar.mjs <path-to-client.js>
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const target = process.argv[2];
if (target === undefined) {
  console.error('usage: node inject-sidebar.mjs <path-to-client.js>');
  process.exit(2);
}

const MARK_PANEL = 'src/client/WorkBuddySidebar.tsx';
const MARK_CSS = '.dsm-wb-side-layer{';
const MARK_VIEW = 'conversation.view';

let source = fs.readFileSync(target, 'utf8');
const before = source.length;
const applied = [];

/** Edit 1 — extend the card stylesheet with the panel CSS. */
if (!source.includes(MARK_CSS)) {
  const cssTail = '`;\n\t\t//#endregion';
  const at = source.indexOf(cssTail);
  if (at === -1) throw new Error('stylesheet tail anchor not found');
  const css = fs.readFileSync(path.join(here, 'panel.css'), 'utf8').trimEnd();
  source = `${source.slice(0, at)}${css}\n${source.slice(at)}`;
  applied.push('css');
}

/** Edit 2 — insert the panel region ahead of the client index region. */
if (!source.includes(MARK_PANEL)) {
  const indexAnchor = '\t\t//#region src/client/index.tsx';
  const at = source.indexOf(indexAnchor);
  if (at === -1) throw new Error('client index region anchor not found');
  const region = fs.readFileSync(path.join(here, 'panel-region.js'), 'utf8');
  source = `${source.slice(0, at)}${region}${source.slice(at)}`;
  applied.push('region');
}

/** Edit 3 — register the locale and the panel as a main-area view. */
if (!source.includes(`"${MARK_VIEW}"`)) {
  const cardAnchor = '\t\t\t\t}, WorkBuddyCard));';
  const at = source.indexOf(cardAnchor);
  if (at === -1) throw new Error('card registration anchor not found');
  const insertAt = at + cardAnchor.length;
  const viewSlot = `
				ctx.effect(() => ctx.locale.register("sidebar.workbuddy", {
					zh: WORKBUDDY_SIDEBAR_ZH,
					en: WORKBUDDY_SIDEBAR_EN
				}), "dsh-connect-workbuddy: sidebar copy");
				const sidebarT = ctx.locale.bind("sidebar.workbuddy");
				ctx.slots.inject("${MARK_VIEW}", () => ctx.slots.register({
					name: "${MARK_VIEW}",
					id: "sb-workbuddy-view",
					label: "WorkBuddy",
					locale: "sidebar.workbuddy",
					order: 30,
					inject: () => ({
						t: sidebarT,
						modelDirectories: ctx.get("modelDirectories"),
						settingsScope: ctx.settingsScope?.bind?.({ namespace: "workbuddy" })
					})
				}, WorkBuddyView));`;
  source = `${source.slice(0, insertAt)}${viewSlot}${source.slice(insertAt)}`;
  applied.push('view');
}

fs.writeFileSync(target, source);
console.log(`inject-sidebar: ${applied.length ? applied.join(', ') : 'already applied'} (${before} -> ${source.length} bytes)`);
