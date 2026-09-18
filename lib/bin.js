#!/usr/bin/env node
import { T as WorkBuddyUpstreamClient, a as readHostHeartbeat, c as WORKBUDDY_CONNECT_VERSION, g as WorkBuddyCredentialStore, h as WORKBUDDY_AUTH_FILE_ENV, l as FALLBACK_WORKBUDDY_MODELS, o as workbuddyHostHeartbeatPath, r as isHeartbeatProcessAlive, u as FALLBACK_WORKBUDDY_MODELS_GLOBAL, v as defaultDesktopAuthCandidates, w as workbuddyOwnAuthPath, x as legacyWorkbuddyOwnAuthPath, y as defaultDesktopAuthDirs } from "./host-heartbeat-CaS5Koaw.js";
import { realpathSync } from "node:fs";
import { fileURLToPath } from "node:url";
//#region src/bin.ts
/**
* Standalone status/diagnostics CLI for the dsh-connect-workbuddy bundle.
*
* 参考：corrinehu/dsh-workbuddy-connect（MIT，Copyright (c) 2026 Corrine Hu）
*   — 三个子命令（`doctor` / `status` / `logout`）、`--json` 输出、
*     `safeMessage` 脱敏、schemaVersion 字段、以及
*     「宿主心跳 + 桌面端凭据文件 + 登录态」三项联合诊断的结构，
*     均由该项目设计。
* 改动：凭据诊断由单文件扩展为「目录扫描 + 按账号分组」，
*     doctor 会列出发现的每个账号及其文件来源，便于确认多账号是否可用；
*     另补 desktopAuthDir 字段。双 provider 化后，doctor/status 按
*     区域（cn | global）分别报告各自的账号与登录态，logout 清除
*     所有插件自有凭据副本（两个区域文件 + 旧单文件）。
*
* @module dsh-connect-workbuddy/bin
*/
const JSON_SCHEMA_VERSION = 2;
/** Both regions, in reporting order. */
const REGIONS = ["cn", "global"];
/** Region labels for human output. */
const REGION_LABELS = {
	cn: "CN (domestic)",
	global: "Global"
};
/** Remove token-like strings from an unexpected diagnostic message. */
function safeMessage(error) {
	return (error instanceof Error ? error.message : String(error)).replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/gu, "[redacted token]").replace(/(\b(?:code|token|refresh_token|access_token)=)[^&\s]+/giu, "$1[redacted]");
}
function printHelp() {
	process.stdout.write([
		"Usage: dsh-connect-workbuddy <doctor|status|logout> [--json]",
		"",
		"  doctor   secret-free sign-in and environment diagnostics",
		"  status   per-region sign-in state, remaining credit, and host-bundle health",
		"  logout   remove every plugin-owned credential copy (the desktop app keeps its sign-in)",
		"  --json   emit one secret-free JSON document (doctor/status only)",
		""
	].join("\n"));
}
function printJson(value) {
	process.stdout.write(`${JSON.stringify(value)}\n`);
}
/** One region-scoped credential store (its own plugin-owned copy file). */
function makeStore(region) {
	const client = new WorkBuddyUpstreamClient();
	return new WorkBuddyCredentialStore({
		region,
		refresh: (credential) => client.refreshToken(credential)
	});
}
/** The region-unscoped store (reads every plugin-owned copy). */
function makeAnyStore() {
	const client = new WorkBuddyUpstreamClient();
	return new WorkBuddyCredentialStore({ refresh: (credential) => client.refreshToken(credential) });
}
async function doctor(jsonOutput) {
	const anyStore = makeAnyStore();
	const desktopPresent = await anyStore.desktopFilePresent();
	const heartbeat = await readHostHeartbeat();
	const hostAlive = heartbeat !== void 0 && isHeartbeatProcessAlive(heartbeat);
	const regionLists = await Promise.all(REGIONS.map(async (region) => ({
		region,
		accounts: await makeStore(region).accounts()
	})));
	const anySignedIn = regionLists.some(({ accounts }) => accounts.length > 0);
	const report = {
		schemaVersion: JSON_SCHEMA_VERSION,
		package: "dsh-connect-workbuddy",
		version: WORKBUDDY_CONNECT_VERSION,
		node: process.version,
		desktopAuthFile: {
			path: anyStore.desktopAuthPath() ?? "(no platform default; set WORKBUDDY_AUTH_FILE)",
			dir: defaultDesktopAuthDirs()[0] ?? "(no platform default)",
			candidates: defaultDesktopAuthCandidates(),
			present: desktopPresent
		},
		ownAuthFiles: {
			cn: workbuddyOwnAuthPath("cn"),
			global: workbuddyOwnAuthPath("global"),
			legacy: legacyWorkbuddyOwnAuthPath()
		},
		hostHeartbeat: {
			path: workbuddyHostHeartbeatPath(),
			present: heartbeat !== void 0,
			...heartbeat === void 0 ? {} : {
				registeredAt: heartbeat.registeredAt,
				pid: heartbeat.pid
			},
			processAlive: hostAlive
		},
		regions: Object.fromEntries(regionLists.map(({ region, accounts }) => [region, accounts.map((account) => ({
			id: account.id,
			accountName: account.accountName,
			domain: account.domain === "" ? void 0 : account.domain,
			source: account.source,
			selected: account.selected,
			tokenExpiresAt: new Date(account.tokenExpiresAtMs).toISOString()
		}))])),
		fallbackModels: {
			cn: FALLBACK_WORKBUDDY_MODELS.length,
			global: FALLBACK_WORKBUDDY_MODELS_GLOBAL.length
		},
		hints: [
			...anySignedIn ? [] : ["Sign in once in the WorkBuddy desktop app (either region), then run status again."],
			...desktopPresent ? [] : [`No WorkBuddy desktop auth file at the expected path; set ${WORKBUDDY_AUTH_FILE_ENV} if it lives elsewhere.`],
			...hostAlive ? [] : ["Host bundle not running in this DSH profile (or the process exited). The browser card and providers are unavailable until DSH starts the plugin."]
		]
	};
	if (jsonOutput) printJson(report);
	else process.stdout.write([
		`WorkBuddy Connect ${WORKBUDDY_CONNECT_VERSION} on ${process.version}`,
		`Desktop auth file: ${report.desktopAuthFile.present ? "present" : "missing"} (${report.desktopAuthFile.path})`,
		`Host bundle: ${hostAlive ? `running (pid ${heartbeat.pid})` : heartbeat !== void 0 ? "stale heartbeat (process exited)" : "not started"}`,
		...regionLists.flatMap(({ region, accounts }) => [`${REGION_LABELS[region]} accounts: ${accounts.length} (own copy ${workbuddyOwnAuthPath(region)})`, ...accounts.map((account) => `  - ${account.accountName} (${account.id})${account.selected ? " [selected]" : ""} expires ${new Date(account.tokenExpiresAtMs).toISOString()}`)]),
		`Static fallback models: CN ${report.fallbackModels.cn}, Global ${report.fallbackModels.global}`,
		...report.hints.map((hint) => `Hint: ${hint}`),
		""
	].join("\n"));
	return anySignedIn && desktopPresent ? 0 : 1;
}
/** One region's sign-in and credit summary. */
async function regionStatus(region) {
	const store = makeStore(region);
	const client = new WorkBuddyUpstreamClient();
	const authStatus = await store.status();
	const accounts = await store.accounts();
	const selected = accounts.find((account) => account.selected);
	const base = {
		region,
		status: authStatus.state,
		...authStatus.expiresAtMs === void 0 ? {} : { accessTokenExpires: new Date(authStatus.expiresAtMs).toISOString() },
		...authStatus.nickname === void 0 ? {} : { nickname: authStatus.nickname },
		...authStatus.domain === void 0 || authStatus.domain === "" ? {} : { domain: authStatus.domain },
		...selected === void 0 ? {} : {
			accountId: selected.id,
			accountName: selected.accountName
		},
		accountCount: accounts.length
	};
	if (authStatus.state !== "signed-in") return base;
	try {
		const credential = await store.resolve();
		return {
			...base,
			credits: (await client.fetchCredits(credential)).total
		};
	} catch (error) {
		return {
			...base,
			credits: 0,
			creditsError: safeMessage(error)
		};
	}
}
async function status(jsonOutput) {
	const heartbeat = await readHostHeartbeat();
	const hostAlive = heartbeat !== void 0 && isHeartbeatProcessAlive(heartbeat);
	const hostState = hostAlive ? "running" : heartbeat !== void 0 ? "stale" : "not-started";
	const fragments = await Promise.all(REGIONS.map((region) => regionStatus(region)));
	const cn = fragments.find((fragment) => fragment.region === "cn");
	if (jsonOutput) {
		printJson({
			schemaVersion: JSON_SCHEMA_VERSION,
			package: "dsh-connect-workbuddy",
			version: WORKBUDDY_CONNECT_VERSION,
			status: cn?.status === "signed-in" ? "signed-in" : "signed-out",
			...cn?.status === "signed-in" ? {
				...cn.accessTokenExpires === void 0 ? {} : { accessTokenExpires: cn.accessTokenExpires },
				...cn.nickname === void 0 ? {} : { nickname: cn.nickname },
				...cn.domain === void 0 ? {} : { domain: cn.domain },
				...cn.accountId === void 0 ? {} : {
					accountId: cn.accountId,
					accountName: cn.accountName
				}
			} : {},
			regions: Object.fromEntries(fragments.map((fragment) => [fragment.region, fragment])),
			hostBundle: hostState
		});
		return fragments.some((fragment) => fragment.status === "signed-in") ? 0 : 1;
	}
	process.stdout.write([
		...fragments.flatMap((fragment) => [
			`${REGION_LABELS[fragment.region]}: ${fragment.status === "signed-in" ? `signed in${fragment.accountName === void 0 ? "" : ` as ${fragment.accountName}`}` : "signed out"}`,
			...fragment.status === "signed-in" && fragment.accessTokenExpires !== void 0 ? [`  Access token expires ${fragment.accessTokenExpires} (refresh is automatic)`] : [],
			`  Local accounts: ${fragment.accountCount}`,
			...fragment.creditsError !== void 0 ? [`  Remaining credit: unavailable (${fragment.creditsError})`] : fragment.credits !== void 0 ? [`  Remaining credit: ${fragment.credits}`] : []
		]),
		`Host bundle: ${hostAlive ? `running (pid ${heartbeat.pid})` : hostState === "stale" ? "stale heartbeat (DSH process exited)" : "not started in this profile"}`,
		"Client card: load failures are logged to the browser console only; the host providers are unaffected.",
		""
	].join("\n"));
	return fragments.some((fragment) => fragment.status === "signed-in") ? 0 : 1;
}
/** Execute one boot-free command. */
async function run(argv) {
	if (argv.length === 0 || argv[0] === "--help" || argv[0] === "-h") {
		printHelp();
		return 0;
	}
	const [rawAction, ...flags] = argv;
	if (![
		"doctor",
		"logout",
		"status"
	].includes(rawAction)) {
		process.stderr.write(`dsh-connect-workbuddy: expected doctor, logout, or status; got ${JSON.stringify(rawAction)}\n`);
		return 1;
	}
	const action = rawAction;
	const jsonOutput = flags.includes("--json");
	if (flags.filter((flag) => flag !== "--json").length > 0 || jsonOutput && action === "logout") {
		process.stderr.write(`dsh-connect-workbuddy: invalid options for ${action}: ${flags.join(" ")}\n`);
		return 1;
	}
	try {
		switch (action) {
			case "doctor": return await doctor(jsonOutput);
			case "status": return await status(jsonOutput);
			case "logout":
				await makeAnyStore().logout();
				process.stdout.write(`WorkBuddy Connect: removed the plugin-owned credential copies (${workbuddyOwnAuthPath("cn")}, ${workbuddyOwnAuthPath("global")}, ${legacyWorkbuddyOwnAuthPath()}); the desktop app's sign-in is untouched\n`);
				return 0;
		}
	} catch (error) {
		process.stderr.write(`dsh-connect-workbuddy: ${action} failed: ${safeMessage(error)}\n`);
		return 1;
	}
}
if (process.argv[1] !== void 0 && fileURLToPath(import.meta.url) === realpathSync(process.argv[1])) process.exitCode = await run(process.argv.slice(2));
//#endregion
export { run };
