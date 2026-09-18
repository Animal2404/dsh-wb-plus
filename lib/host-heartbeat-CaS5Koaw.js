import { readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { withFileLock, writeFileAtomic } from "@deepseek-ai/dsh-atomic-write";
import { resolveDshHome } from "@deepseek-ai/dsh-home-paths";
import { execFileSync } from "node:child_process";
//#region src/upstream.ts
const CN_CHAT_BASE = "https://copilot.tencent.com";
const CN_BILLING_BASE = "https://www.codebuddy.cn";
const GLOBAL_BASE = "https://www.workbuddy.ai";
/**
* Model-catalog path used by the CN region (and the global fallback). The CN
* gateway answers it with the same bytes as its legacy
* `/console/enterprises/personal/models` alias. See {@link GLOBAL_CONFIG_PATH}
* for why the international region reads a different document.
*/
const MODELS_CATALOG_PATH = "/v2/enterprises/personal/models";
/**
* Remote product-config path on the global gateway. This is the document the
* desktop channel receives; it is the only source that lists the account's
* full international chat roster (see {@link DESKTOP_UA}).
*/
const GLOBAL_CONFIG_PATH = "/v3/config";
const CLIENT_UA = "CLI/2.63.2 CodeBuddy/2.63.2";
/**
* User agent of the WorkBuddy desktop app.
*
* The config service serves a DIFFERENT product configuration per client
* channel, selected by this product token — the version suffix is ignored
* (`WorkBuddy/5.5.2`, `WorkBuddy/1.0.0` and a bare `WorkBuddy` answer
* identically). On the INTERNATIONAL gateway the split decides which models
* exist at all:
*
*   - CLI channel (`CLI/… CodeBuddy/…`) → 35 models that OMIT
*     `deepseek-v4.1-flash` and `gpt-6-astra`, even though both are perfectly
*     chat-usable (verified: `deepseek-v4.1-flash` streams HTTP 200 and is
*     billed `x0.00`);
*   - desktop channel → the account's real 20-model chat roster including both.
*
* The plugin emulates the CLI channel for CHAT but reads the desktop channel's
* configuration to learn the account's actual model list. The CN gateway needs
* no such switch: its desktop config carries no `cli` agent roster at all, so
* CN keeps reading the shared `/v2/enterprises/personal/models` path.
*/
const DESKTOP_UA = "WorkBuddy/5.5.2";
const JSON_TIMEOUT_MS = 3e4;
const ERROR_BODY_LIMIT = 4096;
/** Insufficient-credit markers, ASCII lowercase plus the original Chinese. */
const HARD_CREDIT_MARKERS = [
	"insufficient credit",
	"no credit",
	"credit exhausted",
	"out of credit",
	"quota exceeded",
	"quota exhaust",
	"payment required",
	"credit not enough",
	"not enough credit",
	"积分不足",
	"额度不足",
	"余额不足",
	"积分用完",
	"额度用尽",
	"没有积分"
];
/** Session-invalidation markers that mean "sign in again in the WorkBuddy app". */
const SESSION_DEAD_MARKERS = ["Offline user session not found", "12153"];
/** Classify an upstream failure from its HTTP status and body excerpt. */
function classifyUpstreamError(status, body) {
	if (status === 402) return "hard_credit";
	const lower = body.toLowerCase();
	for (const marker of HARD_CREDIT_MARKERS) if (lower.includes(marker.toLowerCase()) || body.includes(marker)) return "hard_credit";
	for (const marker of SESSION_DEAD_MARKERS) if (body.includes(marker)) return "session_dead";
	if (status === 429) return "soft_rate";
	if (status === 404) return "not_found";
	if (status >= 500) return "server";
	if (status >= 400) return "client";
	return "client";
}
/**
* Region for a login domain; an empty domain means CN (matching upstream tooling).
*
* The international product is reachable under TWO brand domains: the WorkBuddy
* AI desktop app signs in at `workbuddy.ai`, while the CodeBuddy CLI signs the
* same international account in at `codebuddy.ai` (verified against a real
* credential file, issue #4). Both are served by the same gateway stack — a
* read-only probe shows `/v3/config` answering HTTP 200 with the same JSON
* envelope on both hosts — so both classify as `global`. Missing the
* `codebuddy.ai` spelling sent those tokens to the CN gateway, which rejected
* them at the openresty layer with an HTML 401.
*/
function regionOf(domain) {
	const lowered = domain.trim().toLowerCase();
	if (lowered === "workbuddy.ai" || lowered.endsWith(".workbuddy.ai")) return "global";
	if (lowered === "codebuddy.ai" || lowered.endsWith(".codebuddy.ai")) return "global";
	return "cn";
}
/**
* Gateway for a global credential.
*
* International accounts are NOT interchangeable across brand domains: a token
* issued at `codebuddy.ai` is rejected by the `workbuddy.ai` gateway (and vice
* versa), so the base must follow the credential's OWN domain rather than a
* single hardcoded host. Anything unrecognised falls back to `workbuddy.ai`,
* the desktop app's gateway.
*/
function globalBase(domain) {
	const lowered = domain.trim().toLowerCase();
	if (lowered === "codebuddy.ai" || lowered.endsWith(".codebuddy.ai")) return "https://www.codebuddy.ai";
	return GLOBAL_BASE;
}
function chatBase(credential) {
	return regionOf(credential.domain) === "global" ? globalBase(credential.domain) : CN_CHAT_BASE;
}
function billingBase(credential) {
	return regionOf(credential.domain) === "global" ? globalBase(credential.domain) : CN_BILLING_BASE;
}
function originReferer(credential) {
	return regionOf(credential.domain) === "global" ? globalBase(credential.domain) : CN_BILLING_BASE;
}
/** Headers every upstream request shares. */
function commonHeaders(credential) {
	return {
		"Accept": "application/json, text/plain, */*",
		"X-Requested-With": "XMLHttpRequest",
		"Origin": originReferer(credential),
		"Referer": `${originReferer(credential)}/`,
		"User-Agent": CLIENT_UA
	};
}
/** Chat request headers, including the X-No-* conventions the official CLI uses. */
function chatHeaders(credential) {
	return {
		...commonHeaders(credential),
		"Content-Type": "application/json",
		...credential.uid === "" ? { "X-No-User-Id": "1" } : { "X-User-Id": credential.uid },
		...credential.enterpriseId === void 0 || credential.enterpriseId === "" ? { "X-No-Enterprise-Id": "1" } : { "X-Enterprise-Id": credential.enterpriseId },
		...credential.domain === "" ? { "X-No-Department-Info": "1" } : { "X-Domain": credential.domain },
		"X-Product": "SaaS"
	};
}
/** Refresh-endpoint headers; X-Refresh-Token appears here and nowhere else. */
function refreshHeaders(credential) {
	const headers = {
		...commonHeaders(credential),
		"X-Refresh-Token": credential.refreshToken,
		"X-Auth-Refresh-Source": "workbuddy"
	};
	if (credential.enterpriseId !== void 0 && credential.enterpriseId !== "") headers["X-Enterprise-Id"] = credential.enterpriseId;
	return headers;
}
/** Billing request headers. */
function billingHeaders(credential) {
	const headers = {
		"Authorization": `Bearer ${credential.accessToken}`,
		"Accept": "application/json",
		"Content-Type": "application/json"
	};
	if (credential.uid !== "") headers["X-User-Id"] = credential.uid;
	if (credential.enterpriseId !== void 0 && credential.enterpriseId !== "") {
		headers["X-Enterprise-Id"] = credential.enterpriseId;
		headers["X-Tenant-Id"] = credential.enterpriseId;
	}
	if (credential.domain !== "") headers["X-Domain"] = credential.domain;
	return headers;
}
/**
* Normalize an OpenAI chat-completions body for the WorkBuddy upstream:
* force `stream: true` (the upstream rejects non-streaming) and flatten
* `tool_choice` (the upstream's field is a string; object forms return 400).
*/
function prepareChatBody(source) {
	let body;
	try {
		body = JSON.parse(source);
	} catch {
		return source;
	}
	if (typeof body !== "object" || body === null || Array.isArray(body)) return source;
	const obj = body;
	obj["stream"] = true;
	if (Array.isArray(obj["messages"])) for (const value of obj["messages"]) {
		if (typeof value !== "object" || value === null || Array.isArray(value)) continue;
		const message = value;
		if (message["role"] === "developer") message["role"] = "system";
	}
	normalizeToolChoice(obj);
	return JSON.stringify(obj);
}
/** Rewrite OpenAI `tool_choice` spellings into the upstream's string form. */
function normalizeToolChoice(obj) {
	const suppress = () => {
		delete obj["tools"];
		delete obj["functions"];
	};
	if (!("tool_choice" in obj)) return;
	const choice = obj["tool_choice"];
	if (typeof choice === "string") {
		if (choice.trim().toLowerCase() === "none") {
			delete obj["tool_choice"];
			suppress();
		}
		return;
	}
	if (typeof choice === "object" && choice !== null && !Array.isArray(choice)) {
		const wrapped = choice;
		const type = typeof wrapped["type"] === "string" ? wrapped["type"].trim().toLowerCase() : "";
		if (type === "none") {
			delete obj["tool_choice"];
			suppress();
		} else if (type === "auto" || type === "required") obj["tool_choice"] = type;
		else if (type === "function") {
			const fn = typeof wrapped["function"] === "object" && wrapped["function"] !== null ? wrapped["function"] : void 0;
			let name = typeof fn?.["name"] === "string" ? fn["name"] : "";
			if (name === "" && typeof wrapped["name"] === "string") name = wrapped["name"];
			name = name.trim();
			obj["tool_choice"] = name !== "" ? name : "auto";
		} else delete obj["tool_choice"];
		return;
	}
	delete obj["tool_choice"];
}
/**
* Gateway (openresty/APISIX) rejection of a token it no longer accepts.
*
* The business APIs answer JSON; an edge rejection answers an HTML error page
* instead. A 401 that is not JSON therefore means the credential was refused
* before routing — almost always a revoked/expired token rather than a bug in
* the request. Detected from the body so a proxy's own error page (which would
* also be HTML) is still described accurately.
*/
function isGatewayAuthRejection(status, text) {
	if (status !== 401 && status !== 403) return false;
	const lower = text.toLowerCase();
	return lower.includes("openresty") || lower.includes("apisix") || lower.includes("authorization required");
}
async function readEnvelope(response) {
	const text = await response.text();
	let parsed;
	try {
		parsed = JSON.parse(text);
	} catch {
		if (isGatewayAuthRejection(response.status, text)) throw new Error(`workbuddy: the signed-in credential was rejected by the upstream gateway (http ${response.status}). The stored token is no longer accepted — most likely a stale credential file from an earlier sign-in was selected. Re-sign in to the WorkBuddy desktop app, then pick that account in the plugin card. Run \`dsh-connect-workbuddy doctor\` to list every discovered credential.`);
		throw new Error(`workbuddy upstream returned non-JSON (http ${response.status}): ${text.slice(0, 160)}`);
	}
	if (typeof parsed !== "object" || parsed === null) throw new Error(`workbuddy upstream returned an unexpected document (http ${response.status})`);
	const document = parsed;
	return {
		code: typeof document["code"] === "number" ? document["code"] : 0,
		msg: typeof document["msg"] === "string" ? document["msg"] : "",
		data: "data" in document ? document["data"] : void 0
	};
}
/** Fail an envelope whose business code is non-zero, classified like HTTP errors. */
function envelopeError(status, envelope) {
	const kind = classifyUpstreamError(status, envelope.msg);
	return /* @__PURE__ */ new Error(`workbuddy upstream ${kind} (http ${status}): ${envelope.msg.slice(0, 160)}`);
}
/**
* Parse the upstream's `credits` string into a multiplier.
*
* Observed forms: `"x0.79 credits"`, `"x0.05"`, `"x0.00 credits"`,
* and absent. Unparsable values yield undefined rather than a guess — the
* card simply omits the rate instead of displaying a fabricated one.
*/
function parseCreditMultiplier(value) {
	if (typeof value !== "string") return void 0;
	const match = /x\s*([0-9]*\.?[0-9]+)/iu.exec(value);
	if (match === null) return void 0;
	const parsed = Number(match[1]);
	return Number.isFinite(parsed) && parsed >= 0 ? parsed : void 0;
}
/** Parse the upstream's `reasoning` object; unknown shapes degrade to `{}`. */
function parseReasoning(value) {
	if (typeof value !== "object" || value === null || Array.isArray(value)) return void 0;
	const raw = value;
	const supportedEfforts = Array.isArray(raw["supportedEfforts"]) ? raw["supportedEfforts"].filter((effort) => typeof effort === "string") : void 0;
	const defaultEffort = typeof raw["defaultEffort"] === "string" ? raw["defaultEffort"] : void 0;
	const canDisableThinking = typeof raw["canDisableThinking"] === "boolean" ? raw["canDisableThinking"] : void 0;
	// Upstream ships a second, fixed-effort shape for most of its roster:
	// `{ effort: "high", summary: "auto" }` names one pinned effort instead of a
	// menu. Without this key the whole object degrades to `void 0` and the model
	// is treated as non-reasoning, so no effort is ever sent on the wire.
	const effort = typeof raw["effort"] === "string" ? raw["effort"] : void 0;
	if (supportedEfforts === void 0 && defaultEffort === void 0 && canDisableThinking === void 0 && effort === void 0) return;
	return {
		...supportedEfforts === void 0 || supportedEfforts.length === 0 ? {} : { supportedEfforts },
		...defaultEffort === void 0 ? {} : { defaultEffort },
		...canDisableThinking === void 0 ? {} : { canDisableThinking },
		...effort === void 0 ? {} : { effort }
	};
}
/** Parse one catalog entry; entries without usable token limits are dropped. */
function parseUpstreamModel(value) {
	if (typeof value !== "object" || value === null) return void 0;
	const raw = value;
	const id = typeof raw["id"] === "string" ? raw["id"] : "";
	if (id === "" || raw["disabled"] === true) return void 0;
	const input = typeof raw["maxInputTokens"] === "number" ? raw["maxInputTokens"] : 0;
	const output = typeof raw["maxOutputTokens"] === "number" ? raw["maxOutputTokens"] : 0;
	if (input <= 0 || output <= 0) return void 0;
	const name = typeof raw["name"] === "string" && raw["name"] !== "" ? raw["name"] : id;
	const descriptionZh = typeof raw["descriptionZh"] === "string" && raw["descriptionZh"] !== "" ? raw["descriptionZh"] : void 0;
	const descriptionEn = typeof raw["descriptionEn"] === "string" && raw["descriptionEn"] !== "" ? raw["descriptionEn"] : void 0;
	const creditMultiplier = parseCreditMultiplier(raw["credits"]);
	const reasoning = parseReasoning(raw["reasoning"]);
	const supportsToolCall = typeof raw["supportsToolCall"] === "boolean" ? raw["supportsToolCall"] : void 0;
	return {
		id,
		name,
		contextWindow: input,
		maxTokens: output,
		...creditMultiplier === void 0 ? {} : { creditMultiplier },
		...reasoning === void 0 ? {} : { reasoning },
		...descriptionZh === void 0 ? {} : { descriptionZh },
		...descriptionEn === void 0 ? {} : { descriptionEn },
		...supportsToolCall === void 0 ? {} : { supportsToolCall }
	};
}
/**
* Select the chat-capable models from a catalog-shaped document: parse every
* entry, then keep the `cli` agent's roster in its declared order.
*
* Both the CN personal-models document and the global `/v3/config` document
* carry `models` plus an `agents` roster with the same entry shape, so one
* selector serves them. Without a usable `cli` roster the whole parsed catalog
* is exposed rather than nothing: the roster is an upstream detail that may
* change, and an empty answer would silently disarm the provider.
*/
function selectCliModels(rawModels, agents) {
	const byId = /* @__PURE__ */ new Map();
	for (const model of Array.isArray(rawModels) ? rawModels : []) {
		const parsed = parseUpstreamModel(model);
		if (parsed !== void 0) byId.set(parsed.id, parsed);
	}
	let cliIds;
	for (const agent of Array.isArray(agents) ? agents : []) if (typeof agent === "object" && agent !== null) {
		const wrapped = agent;
		if (wrapped["name"] === "cli" && Array.isArray(wrapped["models"])) {
			cliIds = wrapped["models"].filter((id) => typeof id === "string");
			break;
		}
	}
	const models = (cliIds !== void 0 && cliIds.length > 0 ? cliIds : [...byId.keys()]).map((id) => byId.get(id)).filter((model) => model !== void 0);
	if (models.length === 0) throw new Error("workbuddy model catalog resolved to an empty list");
	return models;
}
/**
* Upstream HTTP client. One instance serves the whole plugin; requests take
* the credential explicitly so token refreshes apply on the next call.
*/
var WorkBuddyUpstreamClient = class {
	/** POST the chat endpoint; a successful answer is the raw SSE response. */
	async chatStream(credential, bodyJson, signal) {
		let response;
		try {
			response = await fetch(`${chatBase(credential)}/v2/chat/completions`, {
				method: "POST",
				headers: {
					...chatHeaders(credential),
					"Authorization": `Bearer ${credential.accessToken}`
				},
				body: bodyJson,
				...signal === void 0 ? {} : { signal }
			});
		} catch (error) {
			return {
				ok: false,
				status: 0,
				kind: "server",
				message: `transport error: ${String(error)}`
			};
		}
		if (response.ok) return {
			ok: true,
			response
		};
		const text = (await response.text()).slice(0, ERROR_BODY_LIMIT);
		return {
			ok: false,
			status: response.status,
			kind: classifyUpstreamError(response.status, text),
			message: text
		};
	}
	/** POST the token-refresh endpoint; the caller merges the outcome. */
	async refreshToken(credential) {
		const response = await fetch(`${chatBase(credential)}/v2/plugin/auth/token/refresh`, {
			method: "POST",
			headers: refreshHeaders(credential),
			signal: AbortSignal.timeout(JSON_TIMEOUT_MS)
		});
		const envelope = await readEnvelope(response);
		if (!response.ok || envelope.code !== 0) throw envelopeError(response.status, envelope);
		const data = typeof envelope.data === "object" && envelope.data !== null ? envelope.data : {};
		const accessToken = typeof data["accessToken"] === "string" ? data["accessToken"] : "";
		if (accessToken === "") throw new Error("workbuddy token refresh returned no accessToken; sign in again in the WorkBuddy app");
		const outcome = { accessToken };
		if (typeof data["refreshToken"] === "string" && data["refreshToken"] !== "") outcome.refreshToken = data["refreshToken"];
		if (typeof data["expiresIn"] === "number" && data["expiresIn"] > 0) outcome.expiresInSec = data["expiresIn"];
		if (typeof data["domain"] === "string" && data["domain"] !== "") outcome.domain = data["domain"];
		return outcome;
	}
	/**
	* Read the model directory for the credential's region.
	*
	* The two regions expose their chat roster through different documents:
	* CN answers `/v2/enterprises/personal/models`, while the global gateway's
	* personal-models path returns HTTP 500 and the CLI channel's `/v3/config`
	* omits chat-usable models — so global reads `/v3/config` as the desktop
	* channel (see {@link DESKTOP_UA}). Both documents share the entry shape, so
	* one parser serves them. No user-side toggle is involved: the region comes
	* from the credential's `domain`.
	*/
	async fetchModels(credential, signal) {
		const timeout = signal ?? AbortSignal.timeout(JSON_TIMEOUT_MS);
		if (regionOf(credential.domain) === "global") {
			const response = await fetch(`${globalBase(credential.domain)}${GLOBAL_CONFIG_PATH}`, {
				headers: {
					"Authorization": `Bearer ${credential.accessToken}`,
					"Accept": "application/json",
					...credential.uid === "" ? {} : { "X-User-Id": credential.uid },
					...credential.domain === "" ? {} : { "X-Domain": credential.domain },
					"X-Product": "SaaS",
					"X-Requested-With": "XMLHttpRequest",
					"Connection": "close",
					"User-Agent": DESKTOP_UA
				},
				signal: timeout
			});
			const envelope = await readEnvelope(response);
			if (!response.ok || envelope.code !== 0) throw envelopeError(response.status, envelope);
			const data = typeof envelope.data === "object" && envelope.data !== null ? envelope.data : {};
			return selectCliModels(data["models"], data["agents"]);
		}
		const response = await fetch(`${chatBase(credential)}${MODELS_CATALOG_PATH}`, {
			headers: {
				"Authorization": `Bearer ${credential.accessToken}`,
				"Accept": "application/json",
				"Origin": originReferer(credential),
				"Referer": `${originReferer(credential)}/`,
				"User-Agent": CLIENT_UA
			},
			signal: timeout
		});
		const envelope = await readEnvelope(response);
		if (!response.ok || envelope.code !== 0) throw envelopeError(response.status, envelope);
		const data = typeof envelope.data === "object" && envelope.data !== null ? envelope.data : {};
		return selectCliModels(data["models"], data["agents"]);
	}
	/** Query today's check-in status without changing account state. */
	async fetchCheckinStatus(credential) {
		const response = await fetch(`${billingBase(credential)}/v2/billing/meter/checkin-activity-status`, {
			method: "POST",
			headers: billingHeaders(credential),
			body: "{}",
			signal: AbortSignal.timeout(JSON_TIMEOUT_MS)
		});
		const envelope = await readEnvelope(response);
		if (!response.ok || envelope.code !== 0) throw envelopeError(response.status, envelope);
		const data = typeof envelope.data === "object" && envelope.data !== null ? envelope.data : {};
		const numberField = (key) => typeof data[key] === "number" ? data[key] : 0;
		return {
			active: data["active"] === true,
			todayCheckedIn: data["today_checked_in"] === true,
			streakDays: numberField("streak_days"),
			dailyCredit: numberField("daily_credit"),
			todayCredit: numberField("today_credit"),
			isStreakDay: data["is_streak_day"] === true,
			nextStreakDay: numberField("next_streak_day"),
			streakBonusDays: numberField("streak_bonus_days"),
			streakBonusCredit: numberField("streak_bonus_credit"),
			...typeof data["claim_button_text"] === "string" && data["claim_button_text"] !== "" ? { claimButtonText: data["claim_button_text"] } : {}
		};
	}
	/** Claim today's check-in reward. The browser route guards this mutation. */
	async claimDailyCheckin(credential) {
		const response = await fetch(`${billingBase(credential)}/v2/billing/meter/daily-checkin`, {
			method: "POST",
			headers: billingHeaders(credential),
			body: "{}",
			signal: AbortSignal.timeout(JSON_TIMEOUT_MS)
		});
		const envelope = await readEnvelope(response);
		if (!response.ok || envelope.code !== 0) throw envelopeError(response.status, envelope);
		const data = typeof envelope.data === "object" && envelope.data !== null ? envelope.data : {};
		const numberField = (key) => typeof data[key] === "number" ? data[key] : 0;
		return {
			credit: numberField("credit"),
			streakDays: numberField("streak_days"),
			isStreakDay: data["is_streak_day"] === true
		};
	}
	/**
	* POST the billing endpoint for the remaining credit, keeping every package
	* separate: the card groups monthly-cycle packages itself and lists the
	* nearest-expiring one-off packages, so aggregation here would lose the
	* dates it needs.
	*/
	async fetchCredits(credential) {
		const now = /* @__PURE__ */ new Date();
		const format = (date) => [
			date.getFullYear().toString().padStart(4, "0"),
			(date.getMonth() + 1).toString().padStart(2, "0"),
			date.getDate().toString().padStart(2, "0")
		].join("-") + " " + [
			date.getHours().toString().padStart(2, "0"),
			date.getMinutes().toString().padStart(2, "0"),
			date.getSeconds().toString().padStart(2, "0")
		].join(":");
		const response = await fetch(`${billingBase(credential)}/v2/billing/meter/get-user-resource`, {
			method: "POST",
			headers: billingHeaders(credential),
			body: JSON.stringify({
				PageNumber: 1,
				PageSize: 100,
				ProductCode: "p_tcaca",
				Status: [0, 3],
				PackageEndTimeRangeBegin: format(now),
				PackageEndTimeRangeEnd: format(new Date(now.getTime() + 3185136e6))
			}),
			signal: AbortSignal.timeout(JSON_TIMEOUT_MS)
		});
		const envelope = await readEnvelope(response);
		if (!response.ok || envelope.code !== 0) throw envelopeError(response.status, envelope);
		const responseWrapper = typeof envelope.data === "object" && envelope.data !== null ? envelope.data : {};
		const data = typeof responseWrapper["Response"] === "object" && responseWrapper["Response"] !== null ? responseWrapper["Response"] : {};
		const inner = typeof data["Data"] === "object" && data["Data"] !== null ? data["Data"] : {};
		const rawAccounts = Array.isArray(inner["Accounts"]) ? inner["Accounts"] : [];
		let total = 0;
		let nearestExpiryMs;
		let expiringSoon = 0;
		const SOON_MS = 2592e5;
		const parseDate = (raw) => {
			if (typeof raw === "number" && raw > 0xe8d4a51000) return raw;
			if (typeof raw === "string" && raw !== "") {
				const parsed = Date.parse(raw);
				if (!Number.isNaN(parsed)) return parsed;
			}
		};
		const packages = [];
		for (const raw of rawAccounts) {
			if (typeof raw !== "object" || raw === null) continue;
			const account = raw;
			const numberField = (key) => typeof account[key] === "number" ? account[key] : 0;
			const monthly = numberField("CapacityType") === 4;
			const size = monthly ? numberField("CycleCapacitySize") : numberField("CapacitySize");
			const remain = monthly ? numberField("CycleCapacityRemain") : numberField("CapacityRemain");
			const cappedRemain = remain < 0 ? 0 : remain;
			const cycleEndMs = parseDate(account["CycleEndTime"]);
			const expiresAtMs = monthly ? void 0 : parseDate(account["ExpiredTime"]) ?? cycleEndMs;
			const refreshAtMs = monthly ? cycleEndMs === void 0 ? void 0 : cycleEndMs + 1e3 : void 0;
			if (!monthly && (cappedRemain <= 0 || expiresAtMs !== void 0 && expiresAtMs <= Date.now())) continue;
			total += cappedRemain;
			const expiryMs = expiresAtMs;
			if (expiryMs !== void 0) {
				if (nearestExpiryMs === void 0 || expiryMs < nearestExpiryMs) nearestExpiryMs = expiryMs;
				if (expiryMs - Date.now() <= SOON_MS) expiringSoon += cappedRemain;
			}
			packages.push({
				packageName: typeof account["PackageName"] === "string" ? account["PackageName"] : "(unnamed)",
				remain: cappedRemain,
				size,
				monthly,
				...refreshAtMs === void 0 ? {} : { refreshAtMs },
				...expiresAtMs === void 0 ? {} : { expiresAtMs }
			});
		}
		return {
			total,
			packages,
			expiringSoon,
			...nearestExpiryMs === void 0 ? {} : { nearestExpiryMs }
		};
	}
};
//#endregion
//#region src/auth.ts
/**
* WorkBuddy credential resolution.
*
* 参考：corrinehu/dsh-workbuddy-connect（MIT，Copyright (c) 2026 Corrine Hu）
*   — 桌面端 auth 文件只读、刷新结果写入 $DSH_HOME 自有副本、双凭据取
*     到期更晚者、按需刷新（5 分钟余量）与单飞去重、刷新失败但 token
*     未过期则继续沿用旧 token。这些机制已在该项目验证，此处沿用。
* 改动：原版只解析单个 `workbuddy-desktop.info`。WorkBuddy 桌面端在
*   同一 auth 目录留下带时间戳的备份文件（`workbuddy-desktop.<stamp>.info`），
*   实测这些文件各自持有不同账号的可用凭据（本机 6 个文件 → 2 个账号）。
*   本实现改为扫描整个 auth 目录，按 uin 去重为多个可选账号。跟随 App
*   当前登录（live 文件）仍是默认行为；用户显式选择的账号被严格绑定，
*   不因积分多少而切换，失效时也不会静默改选其他账号。
*   另：store 可按区域（cn | global）限定可见账号 —— 国内版与国际版各持
*   一个 store，账号、刷新、选择完全隔离；插件自有刷新副本也按区域分
*   文件（`.workbuddy-auth.<region>.json`），双账号同时在线互不覆盖，
*   旧的单文件 `.workbuddy-auth.json` 作为迁移源保留读取。
*
* @module dsh-connect-workbuddy/auth
*/
/** Legacy single-copy basename (pre-dual-provider); kept as migration source. */
const WORKBUDDY_AUTH_FILENAME = ".workbuddy-auth.json";
/** Env variable that overrides the desktop auth-file location. */
const WORKBUDDY_AUTH_FILE_ENV = "WORKBUDDY_AUTH_FILE";
/** Basename of the live WorkBuddy desktop auth file. */
const WORKBUDDY_LIVE_FILENAME = "workbuddy-desktop.info";
/** Prefix of the plugin-owned per-region credential copies. */
const WORKBUDDY_OWN_PREFIX = ".workbuddy-auth";
/** Current on-disk format of the plugin-owned copy; readers reject others. */
const OWN_FORMAT_VERSION = 1;
/**
* Plugin-owned copy path for one region inside the Harness home. Each
* region's store refreshes into its own file so two simultaneously signed-in
* regions never overwrite each other's refreshed token.
*/
function workbuddyOwnAuthPath(region) {
	return join(resolveDshHome(), `${WORKBUDDY_OWN_PREFIX}.${region}.json`);
}
/**
* Pre-dual-provider single-copy path. Still read as a migration source (a
* legacy credential serves the region it belongs to until that region's own
* first refresh writes the per-region file), and removed by `logout`.
*/
function legacyWorkbuddyOwnAuthPath() {
	return join(resolveDshHome(), WORKBUDDY_AUTH_FILENAME);
}
/**
* Platform-default directories holding the WorkBuddy desktop app's auth file.
*
* Windows and Linux prefer the OS-issued env location and fall back to the
* home-derived convention when it is unset, so a redirected profile (OneDrive
* folder backup, enterprise policy) still resolves. macOS has no equivalent
* env variable; the single Application Support path is used as-is.
*
* `platform`, `home`, and `env` are injectable so the platform branches are
* testable on any host without touching a real machine.
*/
function defaultDesktopAuthDirs(platform = process.platform, home = homedir(), env = process.env) {
	if (platform === "darwin") return [join(home, "Library", "Application Support", "CodeBuddyExtension", "Data", "Public", "auth")];
	if (platform === "win32") {
		const local = nonEmptyEnv(env["LOCALAPPDATA"]) ?? join(home, "AppData", "Local");
		const roaming = nonEmptyEnv(env["APPDATA"]) ?? join(home, "AppData", "Roaming");
		return [join(local, "CodeBuddyExtension", "Data", "Public", "auth"), join(roaming, "CodeBuddyExtension", "Data", "Public", "auth")];
	}
	if (platform === "linux") {
		const config = nonEmptyEnv(env["XDG_CONFIG_HOME"]) ?? join(home, ".config");
		return [join(config, "CodeBuddyExtension", "Data", "Public", "auth")];
	}
	return [];
}
/** A non-empty, trimmed env value, or undefined when unset/blank. */
function nonEmptyEnv(value) {
	return typeof value === "string" && value.trim() !== "" ? value.trim() : void 0;
}
/** The live auth file's platform candidates, in probe order. */
function defaultDesktopAuthCandidates() {
	return defaultDesktopAuthDirs().map((dir) => join(dir, WORKBUDDY_LIVE_FILENAME));
}
/** First platform-default candidate; see {@link defaultDesktopAuthCandidates}. */
function defaultDesktopAuthPath() {
	return defaultDesktopAuthCandidates()[0];
}
/** Normalize an expiry that may arrive in seconds or milliseconds. */
function expiryToMs(value) {
	if (value <= 0) return 0;
	return value > 0xe8d4a51000 ? value : value * 1e3;
}
function optionalString(value) {
	return typeof value === "string" && value !== "" ? value : void 0;
}
/**
* Parse a WorkBuddy auth document in either on-disk shape: the plugin OAuth
* nested form `{"auth":{...},"account":{...}}` and the flat panel form.
* Returns undefined when the document carries no access token.
*/
function parseWorkBuddyAuth(text, filePath) {
	let parsed;
	try {
		parsed = JSON.parse(text);
	} catch {
		return;
	}
	if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return void 0;
	const document = parsed;
	let auth;
	let identity;
	if (typeof document["auth"] === "object" && document["auth"] !== null) {
		auth = document["auth"];
		identity = typeof document["account"] === "object" && document["account"] !== null ? document["account"] : {};
	} else {
		auth = document;
		identity = document;
	}
	const accessToken = typeof auth["accessToken"] === "string" ? auth["accessToken"] : "";
	if (accessToken === "") return void 0;
	const expiresAtMs = typeof auth["expiresAt"] === "number" ? expiryToMs(auth["expiresAt"]) : 0;
	const refreshExpiresAtMs = typeof auth["refreshExpiresAt"] === "number" ? expiryToMs(auth["refreshExpiresAt"]) : void 0;
	const lastRefreshAtMs = typeof auth["lastRefreshTime"] === "number" ? expiryToMs(auth["lastRefreshTime"]) : void 0;
	const enterpriseId = optionalString(identity["enterpriseId"]);
	const nickname = optionalString(identity["nickname"]);
	const uin = optionalString(identity["uin"]);
	return {
		accessToken,
		refreshToken: typeof auth["refreshToken"] === "string" ? auth["refreshToken"] : "",
		expiresAtMs,
		...refreshExpiresAtMs === void 0 ? {} : { refreshExpiresAtMs },
		domain: optionalString(auth["domain"]) ?? "",
		uid: optionalString(identity["uid"]) ?? "",
		...enterpriseId === void 0 ? {} : { enterpriseId },
		...nickname === void 0 ? {} : { nickname },
		...uin === void 0 ? {} : { uin },
		...lastRefreshAtMs === void 0 ? {} : { lastRefreshAtMs },
		source: "desktop",
		filePath
	};
}
/**
* Rank two candidate files for the same account.
*
* The live `workbuddy-desktop.info` always wins: it is the app's current
* sign-in, and the upstream revokes the tokens in the timestamped backups
* even though their stored `expiresAt` is still in the future (observed on a
* real machine — every backup claimed a 2027 expiry while only the live
* file's token was accepted). Expiry is therefore only a tie-breaker among
* backups, never the primary ordering.
*/
function fileRank(path) {
	return authFileName(path) === WORKBUDDY_LIVE_FILENAME ? 0 : 1;
}
/**
* Whether `candidate` is a better pick than `incumbent` for the same account.
*
* Ordering, strongest signal first:
*
* 1. the live `workbuddy-desktop.info` (the app's current sign-in);
* 2. the most recent `lastRefreshAtMs` — the upstream's own issuance time;
* 3. `expiresAtMs`, only as a fallback for documents that omit the field.
*
* Step 2 is what makes this correct. `expiresAt` describes how long the token
* was VALID FOR at issue time, not whether it is still accepted: a revoked
* backup keeps a far-future `expiresAt` (2027 in the observed case) and would
* otherwise outrank the working live credential, which is exactly how a
* signed-in account turned into an upstream HTML 401.
*/
function isFresher(candidate, incumbent) {
	const rankDiff = fileRank(candidate.filePath) - fileRank(incumbent.filePath);
	if (rankDiff !== 0) return rankDiff < 0;
	const candidateRefresh = candidate.lastRefreshAtMs;
	const incumbentRefresh = incumbent.lastRefreshAtMs;
	if (candidateRefresh !== void 0 && incumbentRefresh !== void 0) {
		if (candidateRefresh !== incumbentRefresh) return candidateRefresh > incumbentRefresh;
	} else if (candidateRefresh !== void 0) return true;
	else if (incumbentRefresh !== void 0) return false;
	return candidate.expiresAtMs > incumbent.expiresAtMs;
}
/**
* Filename of a path regardless of the host separator: Windows paths use `\`
* and this helper must keep working when a Windows path is compared on a
* POSIX host (e.g. tests injecting a Windows-style auth dir).
*/
function authFileName(path) {
	const separator = Math.max(path.lastIndexOf("/"), path.lastIndexOf("\\"));
	return separator === -1 ? path : path.slice(separator + 1);
}
/**
* Stable account id. `uin` is the billing identity the upstream keys on and
* survives across re-login; `uid` is the fallback for documents without one.
*/
function workbuddyAccountId(credential) {
	const stable = credential.uin ?? credential.uid ?? credential.nickname ?? "unknown";
	return createHash("sha256").update(`workbuddy\0${stable}`).digest("hex").slice(0, 24);
}
/** Serialize the plugin-owned copy. */
function ownDocument(credential, accountId) {
	return {
		version: OWN_FORMAT_VERSION,
		...accountId === void 0 ? {} : { accountId },
		credential
	};
}
/** Parse the plugin-owned copy; other versions and shapes are rejected. */
function parseOwnDocument(text, filePath) {
	let parsed;
	try {
		parsed = JSON.parse(text);
	} catch {
		return;
	}
	if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return void 0;
	const document = parsed;
	if (document["version"] !== OWN_FORMAT_VERSION) return void 0;
	if (typeof document["credential"] !== "object" || document["credential"] === null) return void 0;
	const stored = document["credential"];
	// The own copy holds the runtime credential, so its identity fields and its
	// absolute expiry sit on the same object. Hand them in as both halves of the
	// upstream shape: without that the row comes back unnamed (the id then hashes
	// "unknown") and with a zero expiry, which forces a refresh on every read.
	const credential = parseWorkBuddyAuth(JSON.stringify({
		auth: stored,
		account: stored
	}), filePath);
	if (credential === void 0) return void 0;
	const expiresAtMs = typeof stored["expiresAtMs"] === "number" ? expiryToMs(stored["expiresAtMs"]) : credential.expiresAtMs;
	const refreshExpiresAtMs = typeof stored["refreshExpiresAtMs"] === "number" ? expiryToMs(stored["refreshExpiresAtMs"]) : credential.refreshExpiresAtMs;
	const lastRefreshAtMs = typeof stored["lastRefreshAtMs"] === "number" ? expiryToMs(stored["lastRefreshAtMs"]) : credential.lastRefreshAtMs;
	return {
		...credential,
		expiresAtMs,
		...refreshExpiresAtMs === void 0 ? {} : { refreshExpiresAtMs },
		...lastRefreshAtMs === void 0 ? {} : { lastRefreshAtMs },
		source: "dsh"
	};
}
/** Whether a filesystem error reports an absent path. */
function isENOENT(error) {
	return error?.code === "ENOENT";
}
/** Read one auth file, tolerating absence and unparsable content. */
async function readAuthFile(path) {
	try {
		return parseWorkBuddyAuth(await readFile(path, "utf8"), path);
	} catch (error) {
		if (isENOENT(error)) return void 0;
		return;
	}
}
/**
* Read-only credential store with demand-driven refresh and multi-account
* discovery.
*
* Refresh policy: refresh only when the access token is inside the margin
* (or already expired), keep the refreshed credential in the plugin-owned
* copy, and never write the desktop app's files. A failed refresh still
* returns a not-yet-expired token so an unreachable refresh endpoint does
* not take down a working session.
*/
var WorkBuddyCredentialStore = class {
	refresh;
	refreshMarginMs;
	region;
	ownPathExplicit;
	legacyOwnPath;
	legacyOwnPathExplicit;
	authDirs;
	desktopPathOverride;
	accountId;
	inflight;
	constructor(options) {
		this.refresh = options.refresh;
		this.refreshMarginMs = options.refreshMarginMs ?? 3e5;
		this.region = options.region;
		this.ownPathExplicit = options.ownPath;
		this.legacyOwnPath = options.legacyOwnPath ?? legacyWorkbuddyOwnAuthPath();
		this.legacyOwnPathExplicit = options.legacyOwnPath;
		this.authDirs = options.authDirs;
		this.desktopPathOverride = options.desktopPath;
	}
	/** Whether a credential's login domain belongs to this store's region. */
	matchesRegion(domain) {
		return this.region === void 0 || regionOf(domain) === this.region;
	}
	/**
	* The path this store refreshes into: the per-region file for a
	* region-scoped store, the legacy single file otherwise, or an explicitly
	* injected path in tests.
	*/
	ownAuthPath() {
		if (this.ownPathExplicit !== void 0) return this.ownPathExplicit;
		return this.region !== void 0 ? workbuddyOwnAuthPath(this.region) : this.legacyOwnPath;
	}
	/**
	* Every plugin-owned copy to read, most preferred first. A region-scoped
	* store reads the legacy single copy as its migration source (readAll's
	* region filter drops it when it carries the other region's credential); an
	* unscoped store reads everything so diagnostics see both regions.
	*
	* With an explicitly injected own path the legacy source is read ONLY when
	* it was injected too — a test that pins one file must not accidentally see
	* the real machine's legacy copy.
	*/
	ownCandidates() {
		if (this.ownPathExplicit !== void 0) return this.legacyOwnPathExplicit !== void 0 ? [this.ownPathExplicit, this.legacyOwnPathExplicit] : [this.ownPathExplicit];
		if (this.region !== void 0) return [workbuddyOwnAuthPath(this.region), this.legacyOwnPath];
		return [
			this.legacyOwnPath,
			workbuddyOwnAuthPath("cn"),
			workbuddyOwnAuthPath("global")
		];
	}
	/** Repoint the desktop file or directory; applies on the next read. */
	setDesktopPath(path) {
		this.desktopPathOverride = path;
		this.inflight = void 0;
	}
	/** Select an account by id; tokens stay outside settings. */
	selectAccount(accountId) {
		this.accountId = accountId;
		this.inflight = void 0;
	}
	/** Selected account id, for diagnostics and route assembly. */
	selectedAccountId() {
		return this.accountId;
	}
	/** The auth-file path candidates, in probe order. */
	resolveDesktopCandidates() {
		const fromEnv = process.env[WORKBUDDY_AUTH_FILE_ENV];
		const explicit = this.desktopPathOverride ?? (fromEnv !== void 0 && fromEnv.trim() !== "" ? fromEnv : void 0);
		if (explicit !== void 0) return [explicit];
		return defaultDesktopAuthCandidates();
	}
	/** The resolved desktop auth-file path, for diagnostics. */
	desktopAuthPath() {
		return this.resolveDesktopCandidates()[0];
	}
	/**
	* Every auth file to scan: the live file plus the timestamped backups
	* WorkBuddy leaves beside it.
	*
	* An explicitly configured path pins the *directory*: its siblings are
	* still scanned, because a user who points the plugin at their auth file
	* expects account switching to work the same way it does on the default
	* path. Only the file ordering changes.
	*
	* A corrupt or signed-out file must never hide the others, so each read is
	* independent and failures are skipped rather than propagated.
	*/
	async candidateFiles() {
		const explicitPath = this.desktopPathOverride ?? ((process.env["WORKBUDDY_AUTH_FILE"] ?? "").trim() !== "" ? process.env["WORKBUDDY_AUTH_FILE"] : void 0);
		const files = [];
		if (explicitPath !== void 0) {
			files.push(explicitPath);
			for (const backup of await this.backupsBeside(explicitPath)) files.push(backup);
			return files;
		}
		const dirs = this.authDirs ?? defaultDesktopAuthDirs();
		for (const dir of dirs) {
			const live = join(dir, WORKBUDDY_LIVE_FILENAME);
			files.push(live);
			for (const backup of await this.backupsBeside(live)) files.push(backup);
		}
		return files;
	}
	/** Timestamped siblings of one auth file, newest first by filename. */
	async backupsBeside(path) {
		const dir = dirname(path);
		const base = path.slice(dir.length + 1);
		try {
			return (await readdir(dir)).filter((name) => name !== base && name.endsWith(".info")).sort().reverse().map((name) => join(dir, name));
		} catch {
			return [];
		}
	}
	/**
	* Read every local credential, deduplicated by account id. Files are
	* probed newest-first, so the first entry for an account is its freshest.
	*
	* A region-scoped store sees only its own region's credentials: the other
	* region's accounts are invisible to selection, refresh, and status alike,
	* which is what keeps the two regions' providers from cross-billing.
	*/
	async readAll() {
		const files = await this.candidateFiles();
		const byId = /* @__PURE__ */ new Map();
		for (const file of files) {
			const credential = await readAuthFile(file);
			if (credential === void 0 || !this.matchesRegion(credential.domain)) continue;
			const id = workbuddyAccountId(credential);
			const existing = byId.get(id);
			if (existing === void 0) {
				byId.set(id, credential);
				continue;
			}
			if (isFresher(credential, existing)) byId.set(id, credential);
		}
		for (const own of await this.readOwns()) {
			if (!this.matchesRegion(own.domain)) continue;
			const id = workbuddyAccountId(own);
			const existing = byId.get(id);
			if (existing === void 0) byId.set(id, own);
			else if (fileRank(existing.filePath) !== 0 && own.expiresAtMs > existing.expiresAtMs) byId.set(id, own);
		}
		return [...byId.values()];
	}
	/**
	* Default when no account is explicitly selected: the live sign-in, else the
	* freshest credential. Following the app's current sign-in is the documented
	* default behaviour; the backups exist so the user can switch explicitly.
	* This is NOT credit-seeking — it never reorders accounts to find one with
	* remaining credit.
	*/
	preferred(credentials) {
		if (credentials.length === 0) return void 0;
		return credentials.reduce((best, credential) => isFresher(credential, best) ? credential : best);
	}
	/** Token-free account list for the plugin card. */
	async accounts() {
		const credentials = await this.readAll();
		if (credentials.length === 0) return [];
		const selectedExists = this.accountId !== void 0 && credentials.some((credential) => workbuddyAccountId(credential) === this.accountId);
		const defaultSelected = this.preferred(credentials);
		return credentials.map((credential) => {
			const id = workbuddyAccountId(credential);
			return {
				id,
				accountName: credential.nickname ?? credential.uin ?? credential.uid,
				...credential.uin === void 0 ? {} : { uin: credential.uin },
				domain: credential.domain,
				source: credential.source,
				tokenExpiresAtMs: credential.expiresAtMs,
				filePath: credential.filePath,
				selected: selectedExists ? id === this.accountId : credential === defaultSelected
			};
		});
	}
	/** The freshest stored credential for the current selection, no refresh. */
	async current() {
		const credentials = await this.readAll();
		if (this.accountId === void 0) return this.preferred(credentials);
		return credentials.find((credential) => workbuddyAccountId(credential) === this.accountId);
	}
	/** The credential to send upstream: {@link current}, refreshed on demand. */
	async resolve() {
		const credential = await this.current();
		if (credential === void 0) {
			const candidates = this.resolveDesktopCandidates();
			const desktop = candidates.length > 0 ? candidates.join(" or ") : "(no desktop path on this platform)";
			throw new Error(`workbuddy: no signed-in WorkBuddy account found; sign in once in the WorkBuddy desktop app (expected ${desktop} or ${WORKBUDDY_AUTH_FILE_ENV}), or refresh an existing session`);
		}
		if (!this.needsRefresh(credential)) return credential;
		this.inflight ??= this.refreshNow(credential).finally(() => {
			this.inflight = void 0;
		});
		return this.inflight;
	}
	/** Read-only sign-in summary; never refreshes and never throws. */
	async status() {
		try {
			const credential = await this.current();
			if (credential === void 0) return { state: "signed-out" };
			return {
				state: "signed-in",
				expiresAtMs: credential.expiresAtMs,
				...credential.refreshExpiresAtMs === void 0 ? {} : { refreshExpiresAtMs: credential.refreshExpiresAtMs },
				...credential.nickname === void 0 ? {} : { nickname: credential.nickname },
				...credential.domain === "" ? {} : { domain: credential.domain },
				source: credential.source
			};
		} catch {
			return { state: "signed-out" };
		}
	}
	/**
	* Remove every plugin-owned copy this store could read (per-region file,
	* legacy single file, and their lock siblings); the desktop files are
	* untouched. A region store's logout therefore also clears the legacy
	* migration source — deliberate: `logout` is the user's "forget what the
	* plugin stored" action, not a per-account toggle.
	*/
	async logout() {
		for (const path of this.ownCandidates()) {
			await rm(path, { force: true });
			await rm(`${path}.lock`, { force: true });
		}
	}
	needsRefresh(credential) {
		if (credential.expiresAtMs <= 0) return true;
		return Date.now() + this.refreshMarginMs >= credential.expiresAtMs;
	}
	async refreshNow(credential) {
		if (credential.refreshToken === "") {
			if (credential.expiresAtMs > Date.now() + 3e4) return credential;
			throw new Error("workbuddy: access token expired and no refresh token is stored; sign in again in the WorkBuddy desktop app");
		}
		try {
			const outcome = await this.refresh(credential);
			const refreshed = {
				...credential,
				accessToken: outcome.accessToken,
				...outcome.refreshToken === void 0 ? {} : { refreshToken: outcome.refreshToken },
				expiresAtMs: outcome.expiresInSec !== void 0 ? Date.now() + outcome.expiresInSec * 1e3 : credential.expiresAtMs,
				...outcome.domain === void 0 || outcome.domain === "" ? {} : { domain: outcome.domain },
				source: "dsh"
			};
			await this.saveOwn(refreshed);
			return refreshed;
		} catch (error) {
			if (credential.expiresAtMs > Date.now() + 3e4) return credential;
			throw new Error(`workbuddy: token refresh failed and the access token is expired (${String(error)}); open the WorkBuddy desktop app once to sign in again`);
		}
	}
	async saveOwn(credential) {
		const accountId = workbuddyAccountId(credential);
		const path = this.ownAuthPath();
		await withFileLock(path, async () => {
			await writeFileAtomic(path, `${JSON.stringify(ownDocument(credential, accountId), null, 2)}\n`, {
				mode: 384,
				dirMode: 448
			});
		});
	}
	/**
	* Every readable plugin-owned copy, in candidate order; absent or corrupt
	* files are skipped rather than propagated.
	*/
	async readOwns() {
		const copies = [];
		for (const path of this.ownCandidates()) try {
			const parsed = parseOwnDocument(await readFile(path, "utf8"), path);
			if (parsed !== void 0) copies.push(parsed);
		} catch {}
		return copies;
	}
	/** Whether any candidate file exists as a regular file; diagnostics only. */
	async desktopFilePresent() {
		for (const path of this.resolveDesktopCandidates()) try {
			if ((await stat(path)).isFile()) return true;
		} catch {}
		return false;
	}
};
//#endregion
//#region src/catalog.ts
/**
* Static CLI models captured from the CN endpoint (2026-08-30). The upstream
* refresh replaces this list at startup; it exists so the provider registers
* with a usable catalog even while the first fetch is in flight or offline.
*/
const FALLBACK_WORKBUDDY_MODELS = [
	{
		id: "auto",
		name: "Auto",
		contextWindow: 168e3,
		maxTokens: 32e3
	},
	{
		id: "hy3",
		name: "Hy3",
		contextWindow: 192e3,
		maxTokens: 64e3
	},
	{
		id: "glm-5v-turbo",
		name: "GLM-5v-Turbo",
		contextWindow: 2e5,
		maxTokens: 64e3
	},
	{
		id: "glm-5.3",
		name: "GLM-5.3",
		contextWindow: 1e6,
		maxTokens: 48e3
	},
	{
		id: "glm-5.2",
		name: "GLM-5.2",
		contextWindow: 1e6,
		maxTokens: 48e3
	},
	{
		id: "glm-5.1",
		name: "GLM-5.1",
		contextWindow: 2e5,
		maxTokens: 48e3
	},
	{
		id: "minimax-m3",
		name: "MiniMax-M3",
		contextWindow: 512e3,
		maxTokens: 128e3
	},
	{
		id: "kimi-k3-1",
		name: "Kimi-K3",
		contextWindow: 1e6,
		maxTokens: 32e3
	},
	{
		id: "kimi-k2.7",
		name: "Kimi-K2.7-Code",
		contextWindow: 256e3,
		maxTokens: 32e3
	},
	{
		id: "kimi-k2.6",
		name: "Kimi-K2.6",
		contextWindow: 256e3,
		maxTokens: 32e3
	},
	{
		id: "deepseek-v4-flash",
		name: "Deepseek-V4-Flash",
		contextWindow: 1e6,
		maxTokens: 5e4
	},
	{
		id: "deepseek-v4-pro",
		name: "Deepseek-V4-Pro",
		contextWindow: 1e6,
		maxTokens: 5e4
	}
];
/**
* Static CLI models captured from the INTERNATIONAL gateway's desktop-channel
* product config (`www.workbuddy.ai/v3/config`, 2026-09-11). The two regions
* expose different rosters — the CN list has no `gpt-*`/`gemini-*` entries —
* so a global account must never be seeded with the CN list. Like the CN
* fallback this is replaced by the live refresh; it only keeps the provider
* usable before the first fetch lands. Order and rates mirror the upstream.
*/
const FALLBACK_WORKBUDDY_MODELS_GLOBAL = [
	{
		id: "default-model",
		name: "Auto",
		contextWindow: 176e3,
		maxTokens: 24e3,
		creditMultiplier: .79
	},
	{
		id: "fast-model",
		name: "Fast",
		contextWindow: 2e5,
		maxTokens: 32e3,
		creditMultiplier: .34
	},
	{
		id: "balanced-model",
		name: "Balanced",
		contextWindow: 256e3,
		maxTokens: 32e3,
		creditMultiplier: .59
	},
	{
		id: "primary-model",
		name: "Primary",
		contextWindow: 272e3,
		maxTokens: 72e3,
		creditMultiplier: 3.31
	},
	{
		id: "deep-model",
		name: "Deep",
		contextWindow: 176e3,
		maxTokens: 24e3,
		creditMultiplier: 3.33
	},
	{
		id: "deepseek-v4.1-flash",
		name: "Deepseek-V4.1-Flash",
		contextWindow: 1e6,
		maxTokens: 128e3,
		creditMultiplier: 0
	},
	{
		id: "gpt-6-astra",
		name: "GPT-6-Astra",
		contextWindow: 1e6,
		maxTokens: 128e3,
		creditMultiplier: 6.67
	},
	{
		id: "hy4-preview",
		name: "Hy4 preview",
		contextWindow: 1e6,
		maxTokens: 64e3,
		creditMultiplier: 0
	},
	{
		id: "hy3",
		name: "Hy3",
		contextWindow: 192e3,
		maxTokens: 64e3,
		creditMultiplier: 0
	},
	{
		id: "gpt-5.6-sol",
		name: "GPT-5.6-Sol",
		contextWindow: 1e6,
		maxTokens: 128e3,
		creditMultiplier: 3.47
	},
	{
		id: "gpt-5.6-terra",
		name: "GPT-5.6-Terra",
		contextWindow: 1e6,
		maxTokens: 128e3,
		creditMultiplier: 1.39
	},
	{
		id: "gpt-5.6-luna",
		name: "GPT-5.6-Luna",
		contextWindow: 1e6,
		maxTokens: 128e3,
		creditMultiplier: .14
	},
	{
		id: "gpt-5.5",
		name: "GPT-5.5",
		contextWindow: 1e6,
		maxTokens: 128e3,
		creditMultiplier: 3.31
	},
	{
		id: "gpt-5.4",
		name: "GPT-5.4",
		contextWindow: 272e3,
		maxTokens: 72e3,
		creditMultiplier: 1.65
	},
	{
		id: "gpt-5.3-codex",
		name: "GPT-5.3-Codex",
		contextWindow: 272e3,
		maxTokens: 72e3,
		creditMultiplier: 1.25
	},
	{
		id: "gemini-3.5-flash",
		name: "Gemini-3.5-Flash",
		contextWindow: 1e6,
		maxTokens: 65536,
		creditMultiplier: .99
	},
	{
		id: "glm-5.3",
		name: "GLM-5.3",
		contextWindow: 1e6,
		maxTokens: 48e3,
		creditMultiplier: .79
	},
	{
		id: "glm-5.2",
		name: "GLM-5.2",
		contextWindow: 1e6,
		maxTokens: 48e3,
		creditMultiplier: .79
	},
	{
		id: "kimi-k3",
		name: "Kimi-K3",
		contextWindow: 1e6,
		maxTokens: 32e3,
		creditMultiplier: 1.62
	},
	{
		id: "kimi-k2.6",
		name: "Kimi-K2.6",
		contextWindow: 256e3,
		maxTokens: 32e3,
		creditMultiplier: .52
	}
];
/**
* Static fallback directory for a region. Each region keeps its own model
* slot in settings; the fallback must match the region so an account never
* shows the other region's roster.
*/
function fallbackModelsFor(region) {
	return region === "global" ? FALLBACK_WORKBUDDY_MODELS_GLOBAL : FALLBACK_WORKBUDDY_MODELS;
}
/** Apply the saved local DSH budget; models above 200K default to 200K. */
function applyContextBudgets(catalog, budgets = {}) {
	return catalog.map((model) => ({
		...model,
		contextWindow: model.contextWindow > 2e5 ? Math.min(model.contextWindow, budgets[model.id] ?? 2e5) : model.contextWindow
	}));
}
function deriveCatalog(catalog, enabled, budgets = {}) {
	return applyContextBudgets(enabled.size === 0 ? catalog : catalog.filter((model) => enabled.has(model.id)), budgets);
}
/** Mutable catalog shared by the shim's `/v1/models` and the adapter. */
var WorkBuddyCatalog = class {
	models;
	/**
	* @param region Seeds the static fallback for this region; each region's
	* provider must never serve the other region's roster before its first
	* live refresh lands.
	*/
	constructor(region = "cn") {
		this.models = fallbackModelsFor(region);
	}
	/** Current entries; the fallback list until the upstream answer lands. */
	current() {
		return this.models;
	}
	/** Replace the list; callers invalidate their adapter snapshot after this. */
	set(models) {
		if (models.length === 0) throw new Error("workbuddy model catalog cannot be empty");
		this.models = models.map((model) => ({ ...model }));
	}
};
//#endregion
//#region src/version.ts
/** The npm package version this build was produced from. */
const WORKBUDDY_CONNECT_VERSION = "2.0.2";
//#endregion
//#region src/host-heartbeat.ts
/**
* Host-side heartbeat: a small JSON file written under `$DSH_HOME` once the
* `workbuddy` provider is registered. The status CLI reads it to report
* whether the host bundle is alive, independent of the browser card.
*
* 参考：corrinehu/dsh-workbuddy-connect（MIT，Copyright (c) 2026 Corrine Hu）
*   — 该机制由其设计：浏览器端无法写文件，其健康只能靠 console.error 上报，
*     因此由宿主写心跳文件，缺失即代表宿主从未启动；崩溃后的陈旧心跳
*     通过 PID 存活检查识别。
* 改动：无。机制本身已完备，原样沿用。
*
* @module dsh-connect-workbuddy/host-heartbeat
*/
/** Basename of the host heartbeat file inside the Harness home. */
const WORKBUDDY_HOST_HEARTBEAT_FILENAME = ".workbuddy-host-heartbeat.json";
/** Current on-disk heartbeat format; readers reject others. */
const HEARTBEAT_FORMAT_VERSION = 1;
/** Absolute path of the host heartbeat file. */
function workbuddyHostHeartbeatPath() {
	return join(resolveDshHome(), WORKBUDDY_HOST_HEARTBEAT_FILENAME);
}
/**
* Process start time in epoch milliseconds; undefined when unavailable.
*
* POSIX reads `ps -o lstart=`; Windows has no such command, so the creation
* time is taken from PowerShell's `Get-Process` StartTime, emitted as UTC ISO
* 8601 so `Date.parse` understands it without locale assumptions. Absent or
* unqueryable processes (other users' processes) degrade to undefined.
*/
function processStartTimeMs(pid) {
	try {
		const output = process.platform === "win32" ? execFileSync("powershell", [
			"-NoProfile",
			"-NonInteractive",
			"-Command",
			`(Get-Process -Id ${pid} -ErrorAction SilentlyContinue).StartTime.ToUniversalTime().ToString('o')`
		], { encoding: "utf8" }) : execFileSync("ps", [
			"-o",
			"lstart=",
			"-p",
			String(pid)
		], { encoding: "utf8" });
		const parsed = Date.parse(output.trim());
		return Number.isFinite(parsed) ? parsed : void 0;
	} catch {
		return;
	}
}
/**
* Whether the recorded host process still matches the heartbeat's PID.
*
* A PID can be reused after a crash, so the recorded start time is compared
* against the live process: a different start time means a different process.
*/
function isHeartbeatProcessAlive(heartbeat) {
	if (!Number.isInteger(heartbeat.pid) || heartbeat.pid <= 0) return false;
	try {
		process.kill(heartbeat.pid, 0);
	} catch {
		return false;
	}
	const startedAt = processStartTimeMs(heartbeat.pid);
	if (startedAt === void 0) return true;
	return Math.abs(startedAt - heartbeat.registeredAt) < 6e4;
}
/** Read the heartbeat; absent or unparsable files report undefined. */
async function readHostHeartbeat() {
	try {
		const parsed = JSON.parse(await readFile(workbuddyHostHeartbeatPath(), "utf8"));
		if (typeof parsed !== "object" || parsed === null) return void 0;
		const document = parsed;
		if (document["version"] !== HEARTBEAT_FORMAT_VERSION) return void 0;
		if (document["package"] !== "dsh-connect-workbuddy") return void 0;
		const pid = document["pid"];
		const registeredAt = document["registeredAt"];
		if (typeof pid !== "number" || typeof registeredAt !== "number") return void 0;
		return {
			version: HEARTBEAT_FORMAT_VERSION,
			package: "dsh-connect-workbuddy",
			pluginVersion: typeof document["pluginVersion"] === "string" ? document["pluginVersion"] : WORKBUDDY_CONNECT_VERSION,
			registeredAt,
			pid
		};
	} catch {
		return;
	}
}
/** Write the heartbeat for the current process. */
async function writeHostHeartbeat() {
	const heartbeat = {
		version: HEARTBEAT_FORMAT_VERSION,
		package: "dsh-connect-workbuddy",
		pluginVersion: WORKBUDDY_CONNECT_VERSION,
		registeredAt: Date.now(),
		pid: process.pid
	};
	await writeFile(workbuddyHostHeartbeatPath(), `${JSON.stringify(heartbeat, null, 2)}\n`, { mode: 384 });
}
/** Remove the heartbeat; called when the plugin is disposed. */
async function clearHostHeartbeat() {
	await rm(workbuddyHostHeartbeatPath(), { force: true });
}
//#endregion
export { prepareChatBody as A, workbuddyAccountId as C, parseCreditMultiplier as D, classifyUpstreamError as E, parseReasoning as O, parseWorkBuddyAuth as S, WorkBuddyUpstreamClient as T, authFileName as _, readHostHeartbeat as a, defaultDesktopAuthPath as b, WORKBUDDY_CONNECT_VERSION as c, WorkBuddyCatalog as d, deriveCatalog as f, WorkBuddyCredentialStore as g, WORKBUDDY_AUTH_FILE_ENV as h, processStartTimeMs as i, regionOf as j, parseUpstreamModel as k, FALLBACK_WORKBUDDY_MODELS as l, WORKBUDDY_AUTH_FILENAME as m, clearHostHeartbeat as n, workbuddyHostHeartbeatPath as o, fallbackModelsFor as p, isHeartbeatProcessAlive as r, writeHostHeartbeat as s, WORKBUDDY_HOST_HEARTBEAT_FILENAME as t, FALLBACK_WORKBUDDY_MODELS_GLOBAL as u, defaultDesktopAuthCandidates as v, workbuddyOwnAuthPath as w, legacyWorkbuddyOwnAuthPath as x, defaultDesktopAuthDirs as y };
