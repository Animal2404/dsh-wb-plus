import { A as prepareChatBody, C as workbuddyAccountId, D as parseCreditMultiplier, E as classifyUpstreamError, O as parseReasoning, S as parseWorkBuddyAuth, T as WorkBuddyUpstreamClient, _ as authFileName, a as readHostHeartbeat, b as defaultDesktopAuthPath, c as WORKBUDDY_CONNECT_VERSION, d as WorkBuddyCatalog, f as deriveCatalog, g as WorkBuddyCredentialStore, h as WORKBUDDY_AUTH_FILE_ENV, i as processStartTimeMs, j as regionOf, k as parseUpstreamModel, l as FALLBACK_WORKBUDDY_MODELS, m as WORKBUDDY_AUTH_FILENAME, n as clearHostHeartbeat, o as workbuddyHostHeartbeatPath, p as fallbackModelsFor, r as isHeartbeatProcessAlive, s as writeHostHeartbeat, t as WORKBUDDY_HOST_HEARTBEAT_FILENAME, u as FALLBACK_WORKBUDDY_MODELS_GLOBAL, v as defaultDesktopAuthCandidates, w as workbuddyOwnAuthPath, x as legacyWorkbuddyOwnAuthPath, y as defaultDesktopAuthDirs } from "./host-heartbeat-CaS5Koaw.js";
import z from "@deepseek-ai/schemastery";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { createProvider } from "@earendil-works/pi-ai";
import { openAICompletionsApi } from "@earendil-works/pi-ai/api/openai-completions.lazy";
import { resolveRetryPolicy } from "@deepseek-ai/dsh-llm";
import { PiAiAdapter } from "@deepseek-ai/dsh-llm-pi-ai";
import { createServer } from "node:http";
import { Readable } from "node:stream";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
//#region src/adapter.ts
/**
* The WorkBuddy pi-ai providers: loopback-backed adapters registered
* into the Harness LLM seam, assembled from public `dsh-llm-pi-ai`
* extension points. One instance per region — `workbuddy` for the domestic
* gateway, `workbuddy-global` for the international one — each pointing at
* its own shim and catalog so the two regions serve simultaneously.
*
* 参考：corrinehu/dsh-workbuddy-connect（MIT，Copyright (c) 2026 Corrine Hu）
*   — pi-ai provider 的装配方式（createProvider + openAICompletionsApi +
*     inert auth plane + 用 shim 的进程内 secret 作为 apiKey）由该项目实现；
*   DSH 插件结构与 provider 注册的思路参照
*     franksong2702/dsh-codex-connect（Apache-2.0），经其转引。
* 改动：模型描述符补上 upstream 给出的多模态与推理档位信息（若有），
*   供 DSH 的能力判断使用；工厂参数化 provider id，支持双区域实例。
*
* @module dsh-connect-workbuddy/adapter
*/
/** Provider route this bundle owns for the domestic (CN) gateway. */
const WORKBUDDY_PROVIDER = "workbuddy";
/** Provider route this bundle owns for the international gateway. */
const WORKBUDDY_GLOBAL_PROVIDER = "workbuddy-global";
/** The provider id each region registers as. */
const WORKBUDDY_PROVIDERS = {
	cn: WORKBUDDY_PROVIDER,
	global: WORKBUDDY_GLOBAL_PROVIDER
};
/** Region a provider route id belongs to. */
function regionOfProvider(provider) {
	for (const [region, id] of Object.entries(WORKBUDDY_PROVIDERS)) if (id === provider) return region;
}
/** Human-readable provider name, shown in the DSH model picker. */
const WORKBUDDY_PROVIDER_DISPLAY_NAMES = {
	cn: "WorkBuddy",
	global: "WorkBuddy Global"
};
/** Provider idle ceiling while one stream read is outstanding. */
const WORKBUDDY_STREAM_IDLE_TIMEOUT_MS = 3e5;
/**
* Image-request budgets at the dsh-llm-pi-ai defaults; the profile type made
* them required in 0.1.1-rc.2.
*/
const REQUEST_IMAGE_BUDGETS = {
	maxRequestImageBytes: 20971520,
	requestImagePixelBudget: 4194304,
	requestImageMaxBytes: 1048576
};
/**
* Inert pi-ai auth plane. The workbuddy route authenticates only through the
* shim shared secret resolved per request by `resolveApiKey`, so pi-ai's own
* credential lifecycle and ambient discovery must never manufacture a
* credential for it. `PiAiAdapterOptions.auth` is required since 0.1.1-rc.2;
* every ambient question here answers "nothing stored, nothing set".
*/
const INERT_AUTH = {
	credentials: {
		async read() {},
		async list() {
			return [];
		},
		async modify() {
			throw new Error("dsh-connect-workbuddy: the workbuddy route has no pi-ai credential lifecycle");
		},
		async delete() {}
	},
	authContext: {
		async env() {},
		async fileExists() {
			return false;
		}
	}
};
/** No per-token pricing is knowable for a subscription quota; report zero. */
const NO_COST = {
	input: 0,
	output: 0,
	cacheRead: 0,
	cacheWrite: 0
};
const THINKING_LEVELS = [
	"minimal",
	"low",
	"medium",
	"high",
	"xhigh",
	"max"
];
/** pi-ai input modalities: images only when WorkBuddy advertises them. */
function workBuddyModelInput(info) {
	return info.multimodal === true ? ["text", "image"] : ["text"];
}
/**
* DSH-facing display name: the model name plus the upstream credit multiplier,
* spelled the way WorkBuddy's own selector does (`GLM-5.3 · x0.79`).
*
* Display-only by construction: every DSH-side join keys on the model id —
* the selector's current choice (`provider` + `model`), the durable
* `model/selection` / `request/header` session events, the agent default-model
* settings, and the request wire (`model: <id>` reaching the shim). A model
* without a parsed multiplier keeps its bare name; a zero multiplier shows
* `x0.00`, matching WorkBuddy's rendering of free models.
*/
function workBuddyDisplayName(info) {
	return info.creditMultiplier === void 0 ? info.name : `${info.name} · x${info.creditMultiplier.toFixed(2)}`;
}
/**
 * Effort ladders for models whose card uses upstream's fixed-effort shape
 * (`{ effort, summary }`) instead of a `supportedEfforts` menu. Each entry is
 * measured, not assumed: the gateway accepts every listed spelling for that id
 * and returns a distinct amount of thinking for each (deepseek-v4.1-flash, CN
 * low/medium/high/xhigh/max and global low/medium/high/max all verified).
 *
 * Keyed on the model id ALONE, deliberately. The catalog is seeded at startup
 * from the persisted directory and the shipped fallback, and neither carries a
 * `reasoning` block for this id — only the one-shot upstream discovery adds
 * `reasoning.effort`. Gating the ladder on that key made the levels appear or
 * vanish with discovery timing, and a session holding a saved effort then died
 * with UNSUPPORTED_REASONING_EFFORT. The table is the allowlist, so no other
 * model's advertised capabilities change.
 */
const FIXED_EFFORT_LADDERS = {
	"deepseek-v4.1-flash": ["low", "medium", "high", "max"]
};
/** Map only levels advertised by WorkBuddy; undeclared DSH levels stay unavailable. */
function workBuddyThinkingLevelMap(info) {
	// Upstream's own menu shape wins whenever it is present; otherwise a measured
	// ladder supplies the levels for an id whose card pinned a single effort (or,
	// before discovery lands, described no reasoning at all).
	const advertised = info.reasoning?.supportedEfforts?.filter((effort) => THINKING_LEVELS.includes(effort));
	const measured = FIXED_EFFORT_LADDERS[info.id];
	const supported = advertised !== void 0 && advertised.length > 0 ? advertised : measured;
	if (supported === void 0 || supported.length === 0) return void 0;
	const map = Object.fromEntries(THINKING_LEVELS.map((level) => [level, supported.includes(level) ? level : null]));
	// `off` is offered when the card says thinking can be disabled, or when the
	// measured ladder supplied the levels. A card that can do neither pins `off`
	// to null so the harness hides it; leaving the key absent is what pi-ai reads
	// as "supported, send nothing".
	if (!(info.reasoning?.canDisableThinking === true || supported === measured)) map.off = null;
	return map;
}
/** Build one pi-ai model descriptor pointing at the loopback shim. */
function toPiModel(info, baseUrl, providerId) {
	const thinkingLevelMap = workBuddyThinkingLevelMap(info);
	return {
		id: info.id,
		name: workBuddyDisplayName(info),
		api: "openai-completions",
		provider: providerId,
		baseUrl,
		input: workBuddyModelInput(info),
		cost: NO_COST,
		contextWindow: info.contextWindow,
		maxTokens: info.maxTokens,
		reasoning: thinkingLevelMap !== void 0,
		...thinkingLevelMap === void 0 ? {} : { thinkingLevelMap },
		compat: { supportsReasoningEffort: thinkingLevelMap !== void 0 }
	};
}
/**
* Assemble the adapter. The provider's `getModels` reads the live catalog,
* and every model's `baseUrl` is re-resolved per read so the shim's
* ephemeral port applies from the first snapshot after startup.
*/
function createWorkBuddyAdapter(options) {
	const { shim, store, catalog, resolveAttachments } = options;
	const providerId = options.provider ?? "workbuddy";
	const providerName = options.displayName ?? "WorkBuddy";
	const buildModels = () => {
		const baseUrl = `${shim.baseUrl()}/v1`;
		return catalog.current().map((info) => toPiModel(info, baseUrl, providerId));
	};
	const provider = {
		...createProvider({
			id: providerId,
			name: providerName,
			auth: { apiKey: {
				name: "WorkBuddy OAuth bearer token",
				async resolve({ credential }) {
					const apiKey = credential?.key;
					return apiKey === void 0 || apiKey.length === 0 ? void 0 : {
						auth: { apiKey },
						source: "WorkBuddy"
					};
				}
			} },
			models: buildModels(),
			api: openAICompletionsApi()
		}),
		getModels: () => buildModels()
	};
	const profile = {
		provider: providerId,
		displayName: providerName,
		streamIdleTimeoutMs: WORKBUDDY_STREAM_IDLE_TIMEOUT_MS,
		retryPolicy: resolveRetryPolicy(void 0, "dsh-connect-workbuddy retryPolicy"),
		configuredMaxTokens: /* @__PURE__ */ new Map(),
		modelErrors: /* @__PURE__ */ new Map(),
		...REQUEST_IMAGE_BUDGETS,
		piProvider: provider
	};
	let profiles = /* @__PURE__ */ new Map([[providerId, profile]]);
	return {
		adapter: new PiAiAdapter({
			profiles: () => profiles,
			auth: INERT_AUTH,
			resolveApiKey: async () => shim.token(),
			...resolveAttachments === void 0 ? {} : { resolveAttachments }
		}),
		invalidate: () => {
			profiles = /* @__PURE__ */ new Map([[providerId, profile]]);
		}
	};
}
//#endregion
//#region src/shim.ts
/**
* Loopback OpenAI-compatible endpoint. The pi-ai provider points here; the
* shim applies the WorkBuddy wire quirks (forced streaming, string
* `tool_choice`, CLI-shaped headers) and forwards to the real upstream.
* It binds 127.0.0.1 only and never serves another interface.
*
* 参考：corrinehu/dsh-workbuddy-connect（MIT，Copyright (c) 2026 Corrine Hu）
*   — 入站加固的四重校验（Host 必须回环、Origin 必须回环、chat POST 必须
*     JSON、bearer 必须匹配进程内随机 secret）、常量时间比对、
*     随机端口绑定、body 上限、上游错误分类到 HTTP 状态码的映射，
*     均由该项目设计并验证。
* 改动：无。安全相关代码不做「改善」，原样沿用。

* @module dsh-connect-workbuddy/shim
*/
const REQUEST_BODY_LIMIT = 67108864;
/** Loopback hostnames the shim's own in-process client uses. */
const LOOPBACK_HOSTS = /* @__PURE__ */ new Set([
	"127.0.0.1",
	"localhost",
	"[::1]"
]);
/** Strip the optional :port from a Host header value, IPv6-bracket aware. */
function hostnameOfHost(host) {
	let hostname = host.trim().toLowerCase();
	if (hostname.startsWith("[")) {
		const end = hostname.indexOf("]");
		return end === -1 ? hostname : hostname.slice(0, end + 1);
	}
	const colon = hostname.lastIndexOf(":");
	if (colon !== -1 && /^\d+$/.test(hostname.slice(colon + 1))) hostname = hostname.slice(0, colon);
	return hostname;
}
/**
* The request's Host header must name the loopback interface. A DNS-rebinding
* page (attacker domain re-resolved to 127.0.0.1) sends its own domain in
* Host, so this check drops those before any routing happens.
*/
function hostIsLoopback(host) {
	if (host === void 0 || host.trim() === "") return false;
	return LOOPBACK_HOSTS.has(hostnameOfHost(host));
}
/**
* A browser-sent Origin (present header) must be loopback. Non-browser
* clients (the plugin's own fetch calls) send no Origin at all and pass.
*/
function originIsLoopback(origin) {
	if (origin === void 0 || origin.trim() === "") return true;
	try {
		const { hostname } = new URL(origin);
		return LOOPBACK_HOSTS.has(hostname) || hostname === "::1";
	} catch {
		return false;
	}
}
/** Chat-completion POSTs must carry a JSON body type (simple-request CSRF drops here). */
function isJsonContentType(req) {
	const type = req.headers["content-type"];
	return typeof type === "string" && type.trim().toLowerCase().startsWith("application/json");
}
/** HTTP status each upstream failure class surfaces as. */
const KIND_STATUS = {
	hard_credit: 402,
	soft_rate: 429,
	session_dead: 401,
	not_found: 502,
	server: 502,
	client: 400
};
function writeJson(res, status, body) {
	const payload = JSON.stringify(body);
	res.writeHead(status, {
		"Content-Type": "application/json",
		"Content-Length": Buffer.byteLength(payload)
	});
	res.end(payload);
}
function writeOpenAIError(res, status, kind, message) {
	writeJson(res, status, { error: {
		message,
		type: kind,
		code: kind
	} });
}
/** Read a request body with a size cap; over-limit bodies fail the request. */
function readBody(req) {
	return new Promise((resolve, reject) => {
		const chunks = [];
		let size = 0;
		req.on("data", (chunk) => {
			size += chunk.length;
			if (size > REQUEST_BODY_LIMIT) {
				reject(/* @__PURE__ */ new Error("request body too large"));
				req.destroy();
				return;
			}
			chunks.push(chunk);
		});
		req.on("end", () => resolve(Buffer.concat(chunks)));
		req.on("error", reject);
	});
}
/**
* Start the loopback endpoint. Requests must carry the shim's shared secret;
* the loopback bind alone is not a trust boundary.
*/
function createWorkBuddyShim(options) {
	const { store, client, catalog } = options;
	const logger = options.logger;
	const SHARED_SECRET = randomBytes(32).toString("base64url");
	/**
	* Which region this shim serves. Supplied by the caller rather than inferred:
	* one shim instance belongs to exactly one credential store, so the usage row
	* can name the region without re-deriving it from a credential that may have
	* rotated mid-flight.
	*/
	const region = options.region ?? "cn";
	const usage = options.usage;
	/**
	* Reports a refused chat call (rate/credit limits) to whoever owns the pool's
	* health map. Absent in isolated tests, hence the optional call.
	*/
	const onUpstreamRefusal = options.onUpstreamRefusal;
	/**
	* Per-account request accounting for the pool panel.
	*
	* The totals are restored from the usage ledger at startup, so 调用次数 /
	* 首 token / Token 速度 / Token 总量 accumulate for as long as the ledger
	* lives instead of resetting on every restart. Only `inFlight` is genuinely
	* live - it describes requests open right now and is meaningless afterwards,
	* so it starts at 0 and is never restored. Only model chat calls count;
	* credits and check-in refreshes are bookkeeping, not account traffic.
	*
	* The stream figures come from the upstream's own SSE frames: first-token time
	* is measured from the moment the request left this process, the generation
	* window runs from the first content delta to the end of the answer, and the
	* token counts are the ones the upstream reported. Nothing here is estimated -
	* a stream that reports no usage adds no tokens, rather than a made-up number.
	*/
	const poolStats = /* @__PURE__ */ new Map();
	/* seed the lifetime totals from disk before the first request arrives */
	try {
		const restored = usage?.lifetimeByAccount?.(region);
		if (restored !== void 0 && restored !== null) for (const [id, row] of restored) poolStats.set(id, {
			...row,
			inFlight: 0
		});
	} catch (error) {}
	const poolStatOf = (id) => {
		const current = poolStats.get(id);
		if (current !== void 0) return current;
		const next = {
			total: 0,
			successes: 0,
			failures: 0,
			inFlight: 0,
			lastSuccessAt: 0,
			firstTokenMsSum: 0,
			firstTokenSamples: 0,
			generationMsSum: 0,
			generationTokens: 0,
			promptTokens: 0,
			completionTokens: 0,
			totalTokens: 0,
			credit: 0,
			cacheHitTokens: 0,
			cacheMissTokens: 0
		};
		poolStats.set(id, next);
		return next;
	};
	const positive = (value) => typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0;
	/**
	* Turn one stream's raw measurement into the two derived figures the panel
	* shows: first-token latency, and a decode rate.
	*
	* The rate needs a real window and at least two tokens. A one-token answer that
	* arrives inside a single tick would otherwise divide out to thousands of
	* tokens per second; such a stream still reports its tokens, it just has no
	* rate to report. Both the live counters and the hourly ledger come through
	* here, so the two can never disagree about what counts as a sample.
	*/
	const speedSampleOf = (measured) => {
		const firstTokenMs = positive(measured.firstTokenMs);
		const generationMs = positive(measured.generationMs);
		const completionTokens = positive(measured.completionTokens);
		return {
			firstTokenMs,
			/* carried through so the ledger can rebuild a token-weighted rate; the
			   plain tokensPerSecond below is what the per-call view uses */
			generationMs,
			...generationMs >= 50 && completionTokens >= 2 ? { tokensPerSecond: completionTokens / (generationMs / 1e3) } : {}
		};
	};
	const beginAccountCall = (id) => {
		if (id === "" || id === "unknown") return { settle: () => {}, cancel: () => {} };
		const stat = poolStatOf(id);
		stat.total += 1;
		stat.inFlight += 1;
		let settled = false;
		const settle = (ok, measured) => {
			if (settled) return;
			settled = true;
			stat.inFlight = Math.max(0, stat.inFlight - 1);
			if (!ok) {
				stat.failures += 1;
				return;
			}
			stat.successes += 1;
			stat.lastSuccessAt = Date.now();
			if (measured === void 0) return;
			const sample = speedSampleOf(measured);
			const firstTokenMs = sample.firstTokenMs;
			if (firstTokenMs > 0) {
				stat.firstTokenMsSum += firstTokenMs;
				stat.firstTokenSamples += 1;
			}
			const completionTokens = positive(measured.completionTokens);
			if (sample.tokensPerSecond !== void 0) {
				/* accumulate a window long enough to divide back out later */
				stat.generationMsSum += completionTokens / sample.tokensPerSecond * 1e3;
				stat.generationTokens += completionTokens;
			}
			stat.promptTokens += positive(measured.promptTokens);
			stat.completionTokens += completionTokens;
			stat.totalTokens += positive(measured.totalTokens);
			/* Billable and cached token counts ride along so the panel can show a
			   real tokens-per-credit figure instead of a blended guess */
			stat.credit += positive(measured.credit);
			stat.cacheHitTokens += positive(measured.cacheHitTokens);
			stat.cacheMissTokens += positive(measured.cacheMissTokens);
		};
		/**
		* The caller walked away (stop button, closed tab, dropped connection).
		*
		* That is not an upstream fault, so it must not be counted as a failure -
		* doing so made a perfectly healthy account read as 5/17成功, because every
		* abandoned stream was blamed on it. The call is removed entirely: it never
		* completed, so it is neither a success nor a failure, and no ledger row is
		* written for it.
		*/
		const cancel = () => {
			if (settled) return;
			settled = true;
			stat.total = Math.max(0, stat.total - 1);
			stat.inFlight = Math.max(0, stat.inFlight - 1);
		};
		return {
			settle,
			cancel
		};
	};
	/** True when one streamed choice carried output the caller can actually see. */
	const deltaHasOutput = (delta) => {
		if (typeof delta["content"] === "string" && delta["content"] !== "") return true;
		if (typeof delta["reasoning_content"] === "string" && delta["reasoning_content"] !== "") return true;
		return delta["tool_calls"] !== void 0 && delta["tool_calls"] !== null || delta["function_call"] !== void 0 && delta["function_call"] !== null;
	};
	/**
	* Watch one forwarded stream without touching it: when the first content delta
	* went past, when the last one did, and the token counts the upstream put on
	* the wire. The shim must not buffer or rewrite these frames for the caller, so
	* this reads them on their way past and keeps the numbers, not the text.
	*/
	const createStreamMeter = (startedAtMs) => {
		let buffer = "";
		let firstTokenAt = 0;
		let lastTokenAt = 0;
		let endedAt = 0;
		let promptTokens = 0;
		let completionTokens = 0;
		let totalTokens = 0;
		let credit = 0;
		let cacheHitTokens = 0;
		let cacheMissTokens = 0;
		const readEvent = (line) => {
			const payloadText = line.startsWith("data:") ? line.slice(5).trim() : "";
			if (payloadText === "" || payloadText === "[DONE]") return;
			/* cheap gate: parsing heartbeat frames would burn CPU for nothing */
			if (!payloadText.includes("\"delta\"") && !payloadText.includes("\"message\"") && !payloadText.includes("\"usage\"")) return;
			let payload;
			try {
				payload = JSON.parse(payloadText);
			} catch {
				return;
			}
			if (payload === null || typeof payload !== "object") return;
			const usage = payload["usage"];
			if (usage !== null && typeof usage === "object") {
				const count = (snake, camel) => positive(usage[snake] ?? usage[camel]);
				promptTokens = count("prompt_tokens", "promptTokens") || promptTokens;
				completionTokens = count("completion_tokens", "completionTokens") || completionTokens;
				totalTokens = count("total_tokens", "totalTokens") || totalTokens;
				/**
				* The upstream bills each call itself: `usage.credit` is the actual
				* amount deducted, not a rate we derived. Recording it verbatim is what
				* lets the panel answer "1 credit buys how many tokens" from real bills
				* instead of from a pricing model that may be wrong.
				*
				* Cache hits are billed far below misses (measured ~2% of a miss on
				* deepseek-v4.1-flash), so the two are kept apart: a blended figure
				* without them would swing depending on how much of the prompt was
				* cached, and the panel could not explain why.
				*/
				const billed = usage["credit"];
				if (typeof billed === "number" && Number.isFinite(billed) && billed >= 0) credit = billed;
				cacheHitTokens = count("prompt_cache_hit_tokens", "promptCacheHitTokens") || cacheHitTokens;
				cacheMissTokens = count("prompt_cache_miss_tokens", "promptCacheMissTokens") || cacheMissTokens;
			}
			const choices = payload["choices"];
			if (!Array.isArray(choices) || choices.length === 0) return;
			const choice = choices[0];
			if (choice === null || typeof choice !== "object") return;
			const delta = choice["delta"] ?? choice["message"];
			if (delta === null || typeof delta !== "object" || !deltaHasOutput(delta)) return;
			const at = Date.now();
			if (firstTokenAt === 0) firstTokenAt = at;
			lastTokenAt = at;
		};
		return {
			push(chunk) {
				buffer += chunk.toString("utf8");
				let end = buffer.indexOf("\n\n");
				while (end !== -1) {
					const event = buffer.slice(0, end);
					buffer = buffer.slice(end + 2);
					for (const line of event.split("\n")) readEvent(line.endsWith("\r") ? line.slice(0, -1) : line);
					end = buffer.indexOf("\n\n");
				}
			/* a frame that never terminates must not grow the buffer forever */
				if (buffer.length > 1 << 20) buffer = buffer.slice(-(1 << 16));
			},
			end() {
				if (endedAt === 0) endedAt = Date.now();
			},
			snapshot() {
				/* The upstream may hand several frames over in one chunk, so the spread
				   between content frames is a network artifact rather than a generation
				   window. Measure from the first visible token to the end of the answer
				   instead - that always covers the time the model spent producing it. */
				const windowEnd = endedAt > firstTokenAt ? endedAt : lastTokenAt;
				return {
					firstTokenMs: firstTokenAt === 0 ? 0 : Math.max(1, firstTokenAt - startedAtMs),
					generationMs: firstTokenAt === 0 || windowEnd <= firstTokenAt ? 0 : windowEnd - firstTokenAt,
					promptTokens,
					completionTokens,
					totalTokens: totalTokens > 0 ? totalTokens : promptTokens + completionTokens,
					credit,
					cacheHitTokens,
					cacheMissTokens
				};
			}
		};
	};
	/** Constant-time bearer check; absent or mismatched bearers are rejected. */
	function bearerOk(req) {
		const header = req.headers.authorization;
		if (typeof header !== "string") return false;
		const match = /^Bearer\s+(.+)$/i.exec(header.trim());
		if (match === null) return false;
		const presented = match[1];
		const expected = SHARED_SECRET;
		const a = Buffer.from(presented);
		const b = Buffer.from(expected);
		if (a.length !== b.length) return false;
		return timingSafeEqual(a, b);
	}
	const server = createServer((req, res) => {
		handle(req, res);
	});
	const ready = new Promise((resolve, reject) => {
		server.once("listening", () => resolve());
		server.once("error", reject);
	});
	server.listen(0, "127.0.0.1");
	const baseUrl = () => {
		const address = server.address();
		if (address === null || typeof address === "string") throw new Error("workbuddy shim has no listening address");
		return `http://127.0.0.1:${address.port}`;
	};
	async function handle(req, res) {
		try {
			if (!hostIsLoopback(req.headers.host)) {
				writeOpenAIError(res, 403, "host_not_allowed", "Host header must name the loopback interface");
				return;
			}
			if (!originIsLoopback(req.headers.origin)) {
				writeOpenAIError(res, 403, "origin_not_allowed", "Origin must be a loopback origin");
				return;
			}
			if (!bearerOk(req)) {
				writeOpenAIError(res, 401, "unauthorized", "missing or invalid Authorization bearer");
				return;
			}
			const url = req.url ?? "/";
			if (req.method === "GET" && (url === "/healthz" || url === "/healthz/")) {
				writeJson(res, 200, { ok: true });
				return;
			}
			if (req.method === "GET" && (url === "/v1/models" || url === "/v1/models/")) {
				writeJson(res, 200, {
					object: "list",
					data: catalog.current().map((model) => ({
						id: model.id,
						object: "model",
						created: 0,
						owned_by: "workbuddy"
					}))
				});
				return;
			}
			if (req.method === "POST" && (url === "/v1/chat/completions" || url === "/v1/chat/completions/")) {
				await chatCompletions(req, res);
				return;
			}
			writeOpenAIError(res, 404, "not_found", `no such route: ${req.method} ${url}`);
		} catch (error) {
			if (!res.headersSent) writeOpenAIError(res, 500, "internal", String(error));
			else res.end();
		}
	}
	async function chatCompletions(req, res) {
		if (!isJsonContentType(req)) {
			writeOpenAIError(res, 415, "unsupported_media_type", "Content-Type must be application/json");
			return;
		}
		let credential;
		try {
			credential = await store.resolve();
		} catch (error) {
			writeOpenAIError(res, 401, "not_signed_in", String(error));
			return;
		}
		const raw = (await readBody(req)).toString("utf8");
		const prepared = prepareChatBody(raw);
		const accountId = workbuddyAccountId(credential);
		const settleAccountCall = beginAccountCall(accountId);
		/** The model the caller asked for; a body we cannot parse records as unknown. */
		let requestedModel = "";
		try {
			const parsed = JSON.parse(raw);
			if (parsed !== null && typeof parsed === "object" && typeof parsed["model"] === "string") requestedModel = parsed["model"];
		} catch (error) {}
		/**
		* Settle the live counters and the hourly ledger together, so the two can
		* never disagree about whether a call happened. The ledger row is written
		* for failures too - that is what makes the失败 count on the usage view real.
		*
		* Guarded here as well as inside the counter: `end` and `close` both fire on
		* a normal stream, and the ledger write must not ride along twice.
		*/
		let settledOnce = false;
		/* an unresolvable account id is skipped by the live counters, so the ledger
		   skips it too rather than inventing an "unknown" account row */
		const accountable = accountId !== "" && accountId !== "unknown";
		const settle = (ok, measured) => {
			if (settledOnce) return;
			settledOnce = true;
			settleAccountCall.settle(ok, measured);
			if (!accountable) return;
			/* hand the ledger the same derived sample the live counters use, so the
			   two readouts cannot drift apart on what a rate sample is */
			usage?.record(region, accountId, requestedModel, ok, measured === void 0 ? void 0 : {
				...measured,
				...speedSampleOf(measured)
			});
		};
		/**
		* The caller went away before the answer finished. Treated as "this call
		* never happened": the in-flight marker is cleared and nothing is recorded,
		* because an abandoned stream says nothing about the account's health.
		*/
		const abandon = () => {
			if (settledOnce) return;
			settledOnce = true;
			settleAccountCall.cancel();
		};
		const meter = createStreamMeter(Date.now());
		const controller = new AbortController();
		/**
		* Whether the CLIENT walked away mid-answer.
		*
		* `res.writableFinished` is the reliable signal: it is true only once we
		* finished writing the response ourselves. A stop button, a closed tab or a
		* dropped connection leaves it false, and that is the case where blaming the
		* account would be wrong.
		*/
		let clientGone = false;
		res.on("close", () => {
			/* we finished the response ourselves: a normal end of stream */
			if (res.writableFinished) return;
			/* otherwise the client hung up mid-answer: stop reading upstream and
			   drop the call instead of charging the account with a failure */
			clientGone = true;
			controller.abort();
			abandon();
		});
		try {
			const result = await client.chatStream(credential, prepared, controller.signal);
			if (!result.ok) {
				/**
				* A refusal here is the account telling us it is out of allowance, so it
				* must cool the row down - not just count as a failed call. This is the
				* case the screenshot showed: a `code:6004` 使用量已超出频率限制 on a real
				* chat call, while the pool row kept claiming 可用.
				*
				* Only rate/credit refusals carry a health verdict; a transport blip or a
				* 5xx has no cooldown meaning and is ignored by the classifier.
				*/
				/* the model travels with the refusal: a model-scoped limit is recorded
				   against THAT model, not against the whole account */
				onUpstreamRefusal?.(accountId, result, requestedModel);
				settle(false);
				writeOpenAIError(res, KIND_STATUS[result.kind], result.kind, `workbuddy upstream ${result.kind} (http ${result.status}): ${result.message.slice(0, 400)}`);
				return;
			}
			res.writeHead(200, {
				"Content-Type": "text/event-stream",
				"Cache-Control": "no-cache",
				"Connection": "keep-alive",
				"X-Accel-Buffering": "no"
			});
			let sawDone = false;
			const body = Readable.fromWeb(result.response.body);
			body.on("data", (chunk) => {
				meter.push(chunk);
				if (chunk.includes("[DONE]")) sawDone = true;
			});
			body.on("end", () => {
				meter.end();
				settle(true, meter.snapshot());
			});
			body.on("error", (error) => {
				/* an error caused by our own abort is the client leaving, not a fault */
				if (clientGone) abandon();
				else settle(false);
				logger?.warn("dsh-connect-workbuddy: upstream stream failed mid-flight", error);
				if (!sawDone && res.writable) res.end("data: [DONE]\n\n");
			});
			body.on("close", () => {
				meter.end();
				if (sawDone) settle(true, meter.snapshot());
				else if (clientGone) abandon();
				else settle(false);
			});
			body.pipe(res);
		} catch (error) {
			if (clientGone) abandon();
			else settle(false);
			throw error;
		}
	}
	return {
		ready,
		baseUrl,
		token: () => SHARED_SECRET,
		stats: () => {
			const out = {};
			/* the route shapes these for the panel; the sums stay exact here so
			   the region rollup never averages a rounded average */
			for (const [id, stat] of poolStats) out[id] = {
				...stat
			};
			return out;
		},
		close: () => new Promise((resolve, reject) => {
			server.close(() => resolve());
			server.closeAllConnections();
			server.once("error", reject);
		})
	};
}
//#endregion
//#region src/status-paths.ts
/**
* Node-free constants and types shared by the Host and browser halves.
*
* 参考：dingminhua/dsh-connect-trae（MIT，Copyright (c) 2026 LaoDing）
*   — 「3 条同源只读路由（usage / models:refresh / accounts:refresh）+ 一份
*     与浏览器共享的 node-free 类型定义」的 host↔client 桥梁形态来自该项目
*     （其 `status-paths.ts` 亦如此，并注明沿用
*     corrinehu/dsh-workbuddy-connect 的 status-route 模式）。
* 改动：路由路径改用本插件 id；类型字段按 WorkBuddy 上游实际给出的能力
*   （积分倍率、多模态、推理档位）调整，不保留 trae 的 1M 变体字段。
*
* @module dsh-connect-workbuddy/status-paths
*/
/** Plugin-owned usage endpoint consumed by its browser half. */
const WORKBUDDY_USAGE_PATH = "/plugins/dsh-connect-workbuddy/usage";
/** Plugin-owned live model refresh endpoint. */
const WORKBUDDY_MODELS_REFRESH_PATH = "/plugins/dsh-connect-workbuddy/models/refresh";
/** Plugin-owned local account rescan endpoint. */
const WORKBUDDY_ACCOUNTS_REFRESH_PATH = "/plugins/dsh-connect-workbuddy/accounts/refresh";
/** Plugin-owned daily check-in action endpoint. */
const WORKBUDDY_CHECKIN_PATH = "/plugins/dsh-connect-workbuddy/checkin";
/** Plugin-owned add-account flow: mint a device-authorization link, then poll it. */
const WORKBUDDY_LOGIN_START_PATH = "/plugins/dsh-connect-workbuddy/login/start";
const WORKBUDDY_LOGIN_POLL_PATH = "/plugins/dsh-connect-workbuddy/login/poll";
/** Query parameter naming the region a card request addresses. */
const WORKBUDDY_REGION_PARAM = "region";
/** Every region, in card tab order. */
const WORKBUDDY_REGIONS = ["cn", "global"];
/**
* Address one region's status route. The two regions are separate provider
* stacks; every card request carries the region whose tab the user is on.
*/
function withWorkBuddyRegion(path, region) {
	return `${path}?${WORKBUDDY_REGION_PARAM}=${region}`;
}
/**
* Read the region parameter off a status-route URL. Absent means the domestic
* tab (`cn`); a present-but-unknown value returns undefined so the route can
* answer 400 instead of guessing.
*/
function regionOfStatusUrl(url) {
	const at = url.indexOf("?");
	const value = at === -1 ? null : new URLSearchParams(url.slice(at + 1)).get(WORKBUDDY_REGION_PARAM);
	if (value === null || value === "") return "cn";
	return WORKBUDDY_REGIONS.includes(value) ? value : void 0;
}
/**
* Project one card row into its persisted `lastCatalog` shape: the native
* context window becomes the stored `contextWindow`, and the card-only
* presentation fields (`nativeContextWindow`, `multimodal`) are removed BY
* KEY. They must never be set to `undefined`: explicit `undefined` values
* survive `structuredClone` and are rejected by the settings write path's
* strict JSON codec (`client api: settings/mutate rejected "ops"`), which
* fails the whole save.
*/
function toPersistedWorkBuddyModel(model) {
	const { nativeContextWindow, multimodal: _cardOnly, ...rest } = model;
	return {
		...rest,
		contextWindow: nativeContextWindow
	};
}
//#endregion
//#region src/web-status.ts
/** Redact token-like content before it crosses to the browser. */
function safeMessage(error) {
	return (error instanceof Error ? error.message : String(error)).replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/gu, "[redacted token]").replace(/(\b(?:code|token|refresh_token|access_token)=)[^&\s]+/giu, "$1[redacted]").slice(0, 500);
}
function json(res, status, body) {
	const payload = JSON.stringify(body);
	res.writeHead(status, {
		"Content-Type": "application/json",
		"Content-Length": Buffer.byteLength(payload)
	});
	res.end(payload);
}
/** Loopback browser origins only; other devices are refused until trusted origins exist. */
function loopbackOrigin(req) {
	const origin = req.headers.origin;
	if (origin === void 0) return true;
	try {
		const { hostname } = new URL(origin);
		return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]" || hostname === "::1";
	} catch {
		return false;
	}
}
/** Map the credit answer to the card's compact document. */
function toCredits(answer) {
	return {
		total: answer.total,
		packages: answer.packages.map((pack) => ({
			packageName: pack.packageName,
			remain: pack.remain,
			size: pack.size,
			monthly: pack.monthly,
			...pack.refreshAtMs === void 0 ? {} : { cycleRefreshMs: pack.refreshAtMs },
			...pack.expiresAtMs === void 0 ? {} : { expiresAtMs: pack.expiresAtMs }
		})),
		expiringSoon: answer.expiringSoon,
		...answer.nearestExpiryMs === void 0 ? {} : { nearestExpiryMs: answer.nearestExpiryMs }
	};
}
/**
* Some upstream model rows omit reasoning metadata even though the model has a
* fixed or known effort menu. Keep this table conservative: only models
* explicitly documented by the upstream/desktop roster are filled in.
*/
function fallbackReasoningOf(model) {
	const id = typeof model?.id === "string" ? model.id.toLowerCase() : "";
	if (id === "auto") return {
		supportedEfforts: ["high"],
		defaultEffort: "high"
	};
	if (id.startsWith("deepseek-v4.1-flash")) return {
		supportedEfforts: ["low", "high", "max", "off"],
		defaultEffort: "max"
	};
	if (id.startsWith("deepseek-v4-pro")) return {
		supportedEfforts: ["low", "high", "xhigh", "off"],
		defaultEffort: "xhigh"
	};
	if (id.startsWith("deepseek-v4-flash")) return {
		supportedEfforts: ["low", "high", "xhigh", "off"],
		defaultEffort: "xhigh"
	};
	if (id.startsWith("glm-5.3")) return {
		supportedEfforts: ["low", "high", "max", "off"],
		defaultEffort: "max"
	};
	if (id.startsWith("glm-5.2")) return {
		supportedEfforts: ["high", "xhigh", "off"],
		defaultEffort: "xhigh"
	};
	if (id.startsWith("glm-5.1") || id.startsWith("glm-5v")) return {
		supportedEfforts: ["medium"],
		defaultEffort: "medium"
	};
	if (id.startsWith("kimi-k2.8")) return {
		supportedEfforts: ["low", "high", "max", "off"],
		defaultEffort: "max"
	};
	if (id.startsWith("kimi-k3") || id.startsWith("kimi-k2.7") || id.startsWith("kimi-k2.6") || id.startsWith("minimax")) return {
		supportedEfforts: ["medium"],
		defaultEffort: "medium"
	};
	if (id.startsWith("hy4")) return {
		supportedEfforts: ["high"],
		defaultEffort: "high"
	};
	if (id.startsWith("hy3")) return {
		supportedEfforts: ["low", "high"],
		defaultEffort: "high"
	};
	return void 0;
}
/** Project a model into the card's row, dropping empty optional fields. */
function toWebModel(model, budgets) {
	const fallbackReasoning = fallbackReasoningOf(model);
	const supportedEfforts = Array.isArray(model.reasoning?.supportedEfforts) ? model.reasoning.supportedEfforts : fallbackReasoning?.supportedEfforts;
	const defaultEffort = typeof model.reasoning?.defaultEffort === "string" ? model.reasoning.defaultEffort : fallbackReasoning?.defaultEffort;
	return {
		id: model.id,
		name: model.name,
		contextWindow: model.contextWindow > 2e5 ? Math.min(model.contextWindow, budgets[model.id] ?? 2e5) : model.contextWindow,
		nativeContextWindow: model.contextWindow,
		maxTokens: model.maxTokens,
		...model.creditMultiplier === void 0 ? {} : { creditMultiplier: model.creditMultiplier },
		...model.multimodal === void 0 ? {} : { multimodal: model.multimodal },
		...supportedEfforts === void 0 && defaultEffort === void 0 ? {} : { reasoning: {
			...supportedEfforts === void 0 ? {} : { supportedEfforts: [...supportedEfforts] },
			...defaultEffort === void 0 ? {} : { defaultEffort }
		} }
	};
}
/** Project a store account into the card's token-free account row. */
function toWebAccount(account) {
	return {
		id: account.id,
		accountName: account.accountName,
		...account.uin === void 0 ? {} : { uin: account.uin },
		domain: account.domain,
		source: account.source,
		tokenExpiresAtMs: account.tokenExpiresAtMs,
		selected: account.selected
	};
}
/**
* Assemble one region's card document. `region` is the tab the card is on;
* the region-scoped store already answers with only that region's accounts,
* so the document's model slots and account list are that region's by
* construction. Sign-in state is read-only; credit is a live billing answer
* whose failure degrades to `creditsError` rather than failing the document.
*/
/**
* The fast half of the status document: the signed-in account, the account list,
* the model roster and which of them are enabled.
*
* Everything here comes from local state or from the persisted catalog, so it
* answers without touching the network. The panel needs exactly this to render
* the account rows and the model picker, and it is what makes a provider switch
* feel instant instead of waiting on two upstream round trips.
*/
async function workBuddyWebStatusFast(deps, region) {
	const store = deps.store(region);
	const accounts = await store.accounts();
	if ((await store.status()).state !== "signed-out" && accounts.length === 0) return {
		status: "signed-out",
		accounts: []
	};
	let credential;
	try {
		/**
		* `current()`, NOT `resolve()`.
		*
		* `resolve()` refreshes the token when it looks stale, and that refresh is an
		* upstream round trip - which is exactly what this "fast" half exists to
		* avoid. That call was why the first switch still took ~1.6s. The full status
		* document still uses `resolve()`, so token maintenance happens there.
		*/
		credential = await store.current();
		if (credential === void 0) throw new Error("no stored credential for this region");
	} catch (error) {
		return {
			status: "signed-out",
			accounts: accounts.map(toWebAccount),
			message: safeMessage(error)
		};
	}
	const account = {
		accountId: accounts.find((account) => account.selected)?.id ?? "",
		accountName: credential.nickname ?? credential.uin ?? credential.uid,
		...credential.uin === void 0 ? {} : { uin: credential.uin },
		...credential.domain === "" ? {} : { domain: credential.domain },
		region,
		source: credential.source,
		tokenExpiresAtMs: credential.expiresAtMs,
		accounts: accounts.map(toWebAccount),
		models: deps.displayModels(region).map((model) => toWebModel(model, deps.contextBudgets(region))),
		enabledModelIds: [...deps.enabledModelIds(region)],
		imageModelIds: [...deps.imageModelIds(region)]
	};
	return {
		status: "signed-in",
		...account
	};
}
/**
* The full document: the fast half plus the two upstream reads (credits and
* check-in status).
*
* Kept as one function so the existing callers keep working, but the route no
* longer blocks on it during a provider switch - see the `fast` query parameter
* in the usage route.
*/
async function workBuddyWebStatus(deps, region) {
	const base = await workBuddyWebStatusFast(deps, region);
	if (base.status !== "signed-in") return base;
	const store = deps.store(region);
	let credential;
	try {
		/* the full document does the token maintenance the fast half skips */
		credential = await store.resolve();
	} catch (error) {
		return base;
	}
	const [creditsResult, checkinResult] = await Promise.allSettled([deps.client.fetchCredits(credential), deps.client.fetchCheckinStatus(credential)]);
	return {
		...base,
		...creditsResult.status === "fulfilled" ? { credits: toCredits(creditsResult.value) } : { creditsError: safeMessage(creditsResult.reason) },
		...checkinResult.status === "fulfilled" ? { checkin: checkinResult.value } : { checkinError: safeMessage(checkinResult.reason) }
	};
}
/**
* The region a request addresses, or a 400 answer. Absent parameter means the
* domestic tab; an unknown value is refused rather than guessed.
*/
function requestRegion(req, res) {
	const region = regionOfStatusUrl(req.url ?? "/");
	if (region === void 0) {
		json(res, 400, { error: "unknown region" });
		return;
	}
	return region;
}
/** Device-authorization host for one region; the two regions differ by host only. */
function workBuddyLoginBase(region) {
	return region === "global" ? "https://www.workbuddy.ai" : "https://www.codebuddy.cn";
}
/** The CLI client identity the device flow is issued to. */
const WORKBUDDY_LOGIN_USER_AGENT = "CLI/2.63.2 CodeBuddy/2.63.2";
/** A pending authorization is forgotten after this long. */
const WORKBUDDY_LOGIN_TTL_MS = 9e5;
/** state -> { region, createdAtMs }; the flow outlives the panel that started it. */
const workBuddyLoginSessions = /* @__PURE__ */ new Map();
/** Headers the device flow is called with, mirroring WorkBuddy's own CLI. */
function workBuddyLoginHeaders(region, accessToken) {
	const base = workBuddyLoginBase(region);
	return {
		"Accept": "application/json, text/plain, */*",
		"Content-Type": "application/json",
		"X-Requested-With": "XMLHttpRequest",
		"Origin": base,
		"Referer": `${base}/`,
		"User-Agent": WORKBUDDY_LOGIN_USER_AGENT,
		...accessToken === void 0 ? {} : { "Authorization": `Bearer ${accessToken}` }
	};
}
/** Read one device-flow envelope; a non-zero code carries upstream's own text. */
async function readWorkBuddyLoginEnvelope(response) {
	let parsed;
	try {
		parsed = JSON.parse(await response.text());
	} catch {
		parsed = void 0;
	}
	if (typeof parsed !== "object" || parsed === null) return {
		code: -1,
		msg: `http ${response.status}`,
		data: void 0
	};
	return {
		code: typeof parsed.code === "number" ? parsed.code : 0,
		msg: typeof parsed.msg === "string" ? parsed.msg : "",
		data: parsed.data
	};
}
/**
* Identity behind a freshly issued token. The profile call is authoritative;
* when it cannot be read the JWT payload still supplies the uid, because the
* pool keys every account on that id.
*/
async function workBuddyLoginIdentity(region, state, accessToken) {
	const identity = {};
	try {
		const part = accessToken.split(".")[1];
		if (part !== void 0) {
			const payload = JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
			for (const key of ["uid", "sub", "userId", "user_id"]) if (typeof payload[key] === "string" && payload[key] !== "") {
				identity.uid = payload[key];
				break;
			}
			if (typeof payload.nickname === "string" && payload.nickname !== "") identity.nickname = payload.nickname;
		}
	} catch {}
	try {
		const response = await fetch(`${workBuddyLoginBase(region)}/v2/plugin/login/account?state=${encodeURIComponent(state)}`, {
			headers: workBuddyLoginHeaders(region, accessToken),
			signal: AbortSignal.timeout(2e4)
		});
		const envelope = await readWorkBuddyLoginEnvelope(response);
		const data = typeof envelope.data === "object" && envelope.data !== null ? envelope.data : {};
		if (envelope.code === 0) {
			if (typeof data.uid === "string" && data.uid !== "") identity.uid = data.uid;
			if (typeof data.uin === "string" && data.uin !== "") identity.uin = data.uin;
			if (typeof data.nickname === "string" && data.nickname !== "") identity.nickname = data.nickname;
			if (typeof data.enterpriseId === "string" && data.enterpriseId !== "") identity.enterpriseId = data.enterpriseId;
		}
	} catch {}
	return identity;
}
/**
* Mount the read-only routes on a context where `webServer` is available.
* The caller uses `ctx.inject(['webServer'], ...)`, so Desktop startup order
* cannot make this registration disappear.
*/
/** Per-account credits for the pool list, one entry per pooled account. */
const WORKBUDDY_POOL_CREDITS_PATH = "/plugins/dsh-connect-workbuddy/pool/credits";
/** Memory-only per-account chat request stats for the live pool panel. */
const WORKBUDDY_POOL_STATS_PATH = "/plugins/dsh-connect-workbuddy/pool/stats";
/** Per-account daily check-in: one named account, or every account at once. */
const WORKBUDDY_POOL_CHECKIN_PATH = "/plugins/dsh-connect-workbuddy/pool/checkin";
/** Daily check-in exists on the domestic provider only. */
const supportsCheckin = (region) => region === "cn";
/** Ledger file: token totals survive a restart. */
const WORKBUDDY_TOKEN_LEDGER_FILE = ".workbuddy-token-ledger.json";
const WORKBUDDY_TOKEN_LEDGER_FORMAT = 1;
/** Usage ledger: hourly, per account and model, so the usage view has history. */
const WORKBUDDY_USAGE_LEDGER_FILE = ".workbuddy-usage.json";
const WORKBUDDY_USAGE_LEDGER_FORMAT = 1;
/**
* The usage ledger is kept forever. Nothing prunes it: one row is one
* (hour, region, account, model) bucket - a handful of rows per day even under
* heavy use - so "permanent" costs almost nothing and is what the panel promises.
* Only the *window* a view asks for is bounded, never the stored history.
*/
/** The usage view asks for one of these windows; anything else is rejected. */
const WORKBUDDY_USAGE_RANGES = {
	"1d": 24 * 36e5,
	"3d": 3 * 24 * 36e5,
	"7d": 7 * 24 * 36e5,
	"14d": 14 * 24 * 36e5,
	/* everything ever recorded; the ledger itself is never pruned */
	"all": Infinity
};
/** Plugin-owned token-usage endpoint. */
const WORKBUDDY_TOKENS_PATH = "/plugins/dsh-connect-workbuddy/tokens";
/** Hourly usage analytics for the panel's usage view. */
const WORKBUDDY_USAGE_STATS_PATH = "/plugins/dsh-connect-workbuddy/usage-stats";
/** The only providers this plugin serves, so the only ones it counts. */
const WORKBUDDY_TOKEN_PROVIDERS = ["workbuddy", "workbuddy-global"];
/**
* On-disk store for the ledger. Both directions are best-effort on purpose:
* accounting is a readout, so a missing or unwritable file must never become a
* host error - it degrades to "no history" and nothing else.
*/
function workBuddyLedgerPath() {
	try {
		return join(homedir(), ".dsh", WORKBUDDY_TOKEN_LEDGER_FILE);
	} catch (error) {
		return void 0;
	}
}
/** Same best-effort contract as the token ledger, for the hourly usage rows. */
function workBuddyUsageLedgerPath() {
	try {
		return join(homedir(), ".dsh", WORKBUDDY_USAGE_LEDGER_FILE);
	} catch (error) {
		return void 0;
	}
}
function readWorkBuddyLedger() {
	try {
		const path = workBuddyLedgerPath();
		if (path === void 0) return void 0;
		const parsed = JSON.parse(readFileSync(path, "utf8"));
		if (parsed === null || typeof parsed !== "object") return void 0;
		if (parsed["version"] !== WORKBUDDY_TOKEN_LEDGER_FORMAT) return void 0;
		const providers = parsed["providers"];
		return providers !== null && typeof providers === "object" ? providers : void 0;
	} catch (error) {
		return void 0;
	}
}
function writeWorkBuddyLedger(providers) {
	try {
		const path = workBuddyLedgerPath();
		if (path === void 0) return;
		writeFileSync(path, JSON.stringify({
			version: WORKBUDDY_TOKEN_LEDGER_FORMAT,
			updatedAtMs: Date.now(),
			providers
		}), "utf8");
	} catch (error) {}
}
/**
* One ledger row per (hour, region, account, model). Every field is a running
* sum so the view can add a window up without replaying individual calls:
* `calls`/`failures` are counts, the token fields are upstream-reported totals,
* `latencyMsSum`/`latencySamples` average into first-token latency, and
* `speedSum`/`speedSamples` average into tokens per second.
*
* Kept on disk because the panel offers a 1/3/7/14-day window: an in-memory Map
* would answer "since the last restart" and quietly mislabel it as a week.
*/
function createWorkBuddyUsageLedger() {
	/** `${hour}|${region}|${accountId}|${model}` -> row */
	const rows = /* @__PURE__ */ new Map();
	let dirty = false;
	let flushTimer;
	const hourOf = (atMs) => Math.floor(atMs / 36e5) * 36e5;
	const num = (value) => typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
	const keyOf = (hour, region, accountId, model) => `${hour}|${region}|${accountId}|${model}`;
	/** Restore whatever survived the last run; a bad file means "no history". */
	const restore = () => {
		try {
			const parsed = JSON.parse(readFileSync(workBuddyUsageLedgerPath(), "utf8"));
			if (parsed === null || typeof parsed !== "object") return;
			if (parsed["version"] !== WORKBUDDY_USAGE_LEDGER_FORMAT) return;
			for (const row of Array.isArray(parsed["rows"]) ? parsed["rows"] : []) {
				if (row === null || typeof row !== "object") continue;
				const hour = num(row["h"]);
				if (hour <= 0) continue;
				rows.set(keyOf(hour, String(row["r"] ?? ""), String(row["u"] ?? ""), String(row["m"] ?? "")), {
					h: hour,
					r: String(row["r"] ?? ""),
					u: String(row["u"] ?? ""),
					m: String(row["m"] ?? ""),
					q: num(row["q"]),
					e: num(row["e"]),
					p: num(row["p"]),
					c: num(row["c"]),
					t: num(row["t"]),
					l: num(row["l"]),
					ln: num(row["ln"]),
					v: num(row["v"]),
					vn: num(row["vn"]),
					cr: num(row["cr"]),
					ch: num(row["ch"]),
					cm: num(row["cm"]),
					/* generation accumulators, stored raw so the pool readout can be
					   rebuilt from the ledger byte-for-byte after a restart */
					gm: num(row["gm"]),
					gt: num(row["gt"]),
					/* `ls` (first-token samples) is new; rows written before it existed
					   still carry `ln`, which counted exactly the same thing, so this is
					   an exact backfill rather than a guess. */
					ls: num(row["ls"]) || num(row["ln"]),
					/* last successful call in this bucket, so "最近成功" survives a
					   restart instead of reading as "never".
					   Rows written before `sl` existed have no timestamp, but the bucket
					   itself proves a success happened somewhere inside that hour; using
					   the bucket start is a truthful lower bound (never a time in the
					   future) and beats claiming the account never succeeded. */
					sl: num(row["sl"]) || (num(row["q"]) > num(row["e"]) ? hour : 0)
				});
			}
		} catch (error) {}
	};
	const persist = () => {
		if (!dirty) return;
		dirty = false;
		try {
			/* no pruning: the ledger is the permanent record */
			writeFileSync(workBuddyUsageLedgerPath(), JSON.stringify({
				version: WORKBUDDY_USAGE_LEDGER_FORMAT,
				updatedAtMs: Date.now(),
				rows: [...rows.values()]
			}), "utf8");
		} catch (error) {}
	};
	restore();
	return {
		/**
		* Add one settled call. `ok` decides the failure count; the measurement
		* carries whatever the upstream actually reported, and an absent figure
		* contributes to no sum rather than to a zero.
		*/
		record(region, accountId, model, ok, measured) {
			const at = Date.now();
			const key = keyOf(hourOf(at), region, accountId, model);
			const row = rows.get(key) ?? {
				h: hourOf(at),
				r: region,
				u: accountId,
				m: model,
				q: 0,
				e: 0,
				p: 0,
				c: 0,
				t: 0,
				l: 0,
				ln: 0,
				v: 0,
				vn: 0,
				cr: 0,
				ch: 0,
				cm: 0,
				gm: 0,
				gt: 0,
				ls: 0,
				sl: 0
			};
			row.q += 1;
			if (!ok) row.e += 1;
				if (measured !== void 0) {
				row.p += num(measured.promptTokens);
				row.c += num(measured.completionTokens);
				row.t += num(measured.totalTokens);
				const firstTokenMs = num(measured.firstTokenMs);
				if (firstTokenMs > 0) {
					row.l += firstTokenMs;
					row.ln += 1;
				}
					const speed = num(measured.tokensPerSecond);
					if (speed > 0) {
						row.v += speed;
						row.vn += 1;
					}
					/* the upstream's own bill for this call, kept as billed */
					row.cr += num(measured.credit);
					row.ch += num(measured.cacheHitTokens);
					row.cm += num(measured.cacheMissTokens);
					/* raw generation accumulators so the pool readout survives a restart */
					if (num(measured.generationMs) > 0 && num(measured.completionTokens) > 0) {
						row.gm += num(measured.generationMs);
						row.gt += num(measured.completionTokens);
					}
					if (num(measured.firstTokenMs) > 0) row.ls += 1;
					row.sl = Math.max(row.sl, at);
				}
			rows.set(key, row);
			dirty = true;
			/* batching the write keeps a busy hour from doing one fsync per call */
			if (flushTimer === void 0) {
				flushTimer = setTimeout(() => {
					flushTimer = void 0;
					persist();
				}, 2e3);
				flushTimer.unref?.();
			}
		},
		/** Every row inside the window, plus the window's own bounds. */
		window(range) {
			const span = WORKBUDDY_USAGE_RANGES[range];
			const now = Date.now();
			/* Infinity (the "all" window) means "no lower bound at all" */
			const since = Number.isFinite(span) ? hourOf(now) - (span - 36e5) : -Infinity;
			const out = [];
			for (const row of rows.values()) if (row.h >= since && row.h <= hourOf(now)) out.push({
				...row
			});
			return {
				since,
				until: now,
				rows: out
			};
		},
		/**
		* Lifetime per-account totals, rebuilt from the ledger.
		*
		* This is what lets the pool readout (调用次数 / 首 token / Token 速度 /
		* Token 总量) survive a restart: those figures are the same numbers the
		* usage page already keeps on disk, so instead of a second store the shim
		* seeds itself from this on startup.
		*
		* Rate samples are summed as generation-ms and completion-tokens (not as a
		* per-call average) so the restored tok/s equals "total tokens / total
		* generation time" - the same token-weighted definition the live counters
		* use, rather than an average of averages.
		*/
		lifetimeByAccount(onlyRegion) {
			const out = /* @__PURE__ */ new Map();
			for (const row of rows.values()) {
				if (row.u === "") continue;
				/* one shim serves one region; an account id that appears on both
				   sides must not have its two pools summed together */
				if (typeof onlyRegion === "string" && onlyRegion !== "" && row.r !== onlyRegion) continue;
				/**
				* `gm`/`gt` (generation ms / tokens) are newer fields. A row written
				* before they existed still has its own average rate (`v`/`vn`) and its
				* completion-token total (`c`), so the generation window can be rebuilt
				* as `tokens / averageRate` - which is exactly the window the rate was
				* derived from. That keeps 速度 continuous across the upgrade instead of
				* dropping to a dash until new traffic arrives.
				*/
				const legacyAvgRate = row.vn > 0 ? row.v / row.vn : 0;
				const generationMsSum = row.gm > 0 ? row.gm : legacyAvgRate > 0 && row.c > 0 ? row.c / legacyAvgRate * 1e3 : 0;
				const generationTokens = row.gt > 0 ? row.gt : generationMsSum > 0 ? row.c : 0;
				const row0 = out.get(row.u) ?? {
					total: 0,
					successes: 0,
					failures: 0,
					lastSuccessAt: 0,
					firstTokenMsSum: 0,
					firstTokenSamples: 0,
					generationMsSum: 0,
					generationTokens: 0,
					promptTokens: 0,
					completionTokens: 0,
					totalTokens: 0,
					credit: 0,
					cacheHitTokens: 0,
					cacheMissTokens: 0
				};
				row0.total += row.q;
				row0.failures += row.e;
				row0.successes += Math.max(0, row.q - row.e);
				row0.lastSuccessAt = Math.max(row0.lastSuccessAt, row.sl);
				row0.firstTokenMsSum += row.l;
				row0.firstTokenSamples += row.ls;
				row0.generationMsSum += generationMsSum;
				row0.generationTokens += generationTokens;
				row0.promptTokens += row.p;
				row0.completionTokens += row.c;
				row0.totalTokens += row.t;
				row0.credit += row.cr;
				row0.cacheHitTokens += row.ch;
				row0.cacheMissTokens += row.cm;
				out.set(row.u, row0);
			}
			return out;
		},
		flush: persist
	};
}
/**
* Per-provider token accounting for the providers this plugin owns.
*
* Usage arrives on the session event bus: `assistant/message` carries
* `data.usage` (`{ inputTokens, outputTokens, totalTokens, cacheReadTokens }`)
* and the provider that produced it sits on `data.message.source.provider`.
* Filtering on that provider keeps other providers' traffic out of the totals.
* Totals are process memory only - a live readout, not a persisted ledger.
*/
function createWorkBuddyTokenLedger() {
	const byProvider = /* @__PURE__ */ new Map();
	/** Provider ids the filter saw and refused. Names only - no amounts are kept. */
	const ignoredProviders = /* @__PURE__ */ new Set();
	const blank = () => ({
		inputTokens: 0,
		outputTokens: 0,
		cacheReadTokens: 0,
		totalTokens: 0,
		messages: 0
	});
	const num = (value) => typeof value === "number" && Number.isFinite(value) ? value : 0;
	/** Seed from the previous run so the figures keep accumulating across restarts. */
	try {
		const restored = readWorkBuddyLedger();
		if (restored !== void 0) for (const provider of WORKBUDDY_TOKEN_PROVIDERS) {
			const row = restored[provider];
			if (row === null || typeof row !== "object") continue;
			byProvider.set(provider, {
				inputTokens: num(row.inputTokens),
				outputTokens: num(row.outputTokens),
				cacheReadTokens: num(row.cacheReadTokens),
				totalTokens: num(row.totalTokens),
				messages: num(row.messages)
			});
		}
	} catch (error) {}
	return {
		record(provider, usage) {
			if (typeof provider !== "string" || !WORKBUDDY_TOKEN_PROVIDERS.includes(provider)) {
				if (typeof provider === "string" && provider !== "") ignoredProviders.add(provider);
				return;
			}
			const row = byProvider.get(provider) ?? blank();
			row.inputTokens += num(usage.inputTokens);
			row.outputTokens += num(usage.outputTokens);
			row.cacheReadTokens += num(usage.cacheReadTokens);
			row.totalTokens += num(usage.totalTokens);
			row.messages += 1;
			byProvider.set(provider, row);
			writeWorkBuddyLedger(Object.fromEntries(byProvider));
		},
		snapshot() {
			const providers = {};
			const total = blank();
			for (const provider of WORKBUDDY_TOKEN_PROVIDERS) {
				const row = byProvider.get(provider) ?? blank();
				providers[provider] = {
					...row
				};
				total.inputTokens += row.inputTokens;
				total.outputTokens += row.outputTokens;
				total.cacheReadTokens += row.cacheReadTokens;
				total.totalTokens += row.totalTokens;
				total.messages += row.messages;
			}
			return {
				scope: [...WORKBUDDY_TOKEN_PROVIDERS],
				ignoredProviders: [...ignoredProviders].sort(),
				providers,
				total
			};
		}
	};
}

/**
* Pool health: what the upstream said about one account's allowance.
*
* The upstream answers a spent daily allowance with a business error rather than
* a status the client can rely on, so the only honest signal is the message and
* code it returns. Classification is deliberately conservative: an unrecognised
* failure says nothing about the account and leaves its health untouched, so a
* transient network error can never mark a usable account as cooling.
*/
const WORKBUDDY_SOFT_LIMIT_MARKERS = ["频率限制", "rate limit", "rate-limit", "too many requests", "429", "6004"];
const WORKBUDDY_HARD_LIMIT_MARKERS = ["积分不足", "额度不足", "余额不足", "quota", "insufficient", "402", "exceeded"];
/**
* Phrases that mean the limit applies to ONE MODEL, not to the whole account.
*
* Upstream says this in its own words for `code 6004`: 「您也可以切换其他模型继续使用」
* - i.e. the account is fine, that model is not. Telling the two apart matters
* because the UI must not grey out a healthy account over one throttled model,
* nor hide a model-level limit behind a generic "available".
*/
const WORKBUDDY_MODEL_SCOPE_MARKERS = [
	"切换其他模型",
	"其他模型",
	"switch to another model",
	"another model",
	"this model"
];
/** Default cooldown when the upstream refuses but names no reset moment. */
const WORKBUDDY_SOFT_LIMIT_MS = 60 * 60 * 1000;
/**
* Read the upstream's own reset hint out of a message: either a thirteen-digit
* epoch or its `将在 YYYY-MM-DD HH:MM:SS` sentence. Returns undefined when the
* text carries no usable moment, so the caller keeps its default.
*/
function workBuddyResetAt(message, now) {
	if (typeof message !== "string") return void 0;
	const epoch = message.match(/\b(1\d{12})\b/);
	if (epoch !== null) {
		const at = Number(epoch[1]);
		if (Number.isFinite(at) && at > now) return at;
	}
	const stamped = message.match(/(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
	if (stamped !== null) {
		const at = new Date(Number(stamped[1]), Number(stamped[2]) - 1, Number(stamped[3]), Number(stamped[4]), Number(stamped[5]), Number(stamped[6] ?? 0)).getTime();
		if (Number.isFinite(at) && at > now) return at;
	}
	return void 0;
}
/** Next local midnight: the moment a spent daily allowance comes back. */
function workBuddyNextMidnight(now) {
	const next = new Date(now);
	next.setHours(24, 0, 0, 0);
	return next.getTime();
}
/**
* Classify one upstream failure into a pool health entry, or undefined when the
* failure carries no allowance meaning at all.
*/
function workBuddyHealthOf(error, now) {
	const message = safeMessage(error);
	const text = message.toLowerCase();
	const soft = WORKBUDDY_SOFT_LIMIT_MARKERS.some((marker) => text.includes(marker.toLowerCase()));
	const hard = WORKBUDDY_HARD_LIMIT_MARKERS.some((marker) => text.includes(marker.toLowerCase()));
	if (!soft && !hard) return void 0;
	const kind = soft ? "rate" : "credit";
	const until = workBuddyResetAt(message, now) ?? (kind === "rate" ? now + WORKBUDDY_SOFT_LIMIT_MS : workBuddyNextMidnight(now));
	/**
	* Scope: does this limit the account, or just the one model that was asked for?
	*
	* Upstream's own wording decides. `scope: "model"` lets the panel keep the
	* account usable and surface the limit on the model row instead of greying out
	* the whole account; anything without that hint is treated as account-wide,
	* which is the conservative reading (do not keep hammering a blocked account).
	*/
	const modelScoped = kind === "rate" && WORKBUDDY_MODEL_SCOPE_MARKERS.some((marker) => text.includes(marker.toLowerCase()));
	return {
		kind,
		scope: modelScoped ? "model" : "account",
		until,
		reason: message,
		at: now
	};
}
/** Read the pool's per-account health, pruned of entries whose deadline passed. */
function workBuddyHealthSnapshot(store, now) {
	const out = {};
	for (const [id, entry] of store) {
		if (!Number.isFinite(entry.until) || entry.until <= now) {
			store.delete(id);
			continue;
		}
		out[id] = {
			kind: entry.kind,
			...entry.scope === void 0 ? {} : { scope: entry.scope },
			until: entry.until,
			reason: entry.reason
		};
	}
	return out;
}
/**
* Model-scoped limits as `{accountId: {modelId: {kind, until, reason}}}`.
*
* Pruned on the same rule as account health: an entry disappears the moment its
* own reset time passes, so the panel never claims a model is throttled after
* upstream said it would be back.
*/
function workBuddyModelHealthSnapshot(store, now) {
	const out = {};
	for (const [key, entry] of store) {
		if (!Number.isFinite(entry.until) || entry.until <= now) {
			store.delete(key);
			continue;
		}
		const at = key.indexOf("\u0000");
		if (at <= 0) continue;
		const accountId = key.slice(0, at);
		const modelId = key.slice(at + 1);
		if (modelId === "") continue;
		const row = out[accountId] ?? {};
		row[modelId] = {
			kind: entry.kind,
			until: entry.until,
			reason: entry.reason
		};
		out[accountId] = row;
	}
	return out;
}
function registerWorkBuddyStatusRoute(ctx, deps) {
	/**
	* Fold hourly ledger rows into the shapes the usage view renders.
	*
	* Everything here is additive, so one pass produces the headline totals, the
	* hourly series and all three breakdowns without re-reading the ledger. Averages
	* divide by their own sample count: a row with no measured latency must not
	* drag the average toward zero.
	*/
	const summarizeUsage = (rows) => {
		/** Finite non-negative, else 0 - one malformed row must not poison a total. */
		const safe = (value) => typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
		const blank = () => ({
			calls: 0,
			failures: 0,
			promptTokens: 0,
			completionTokens: 0,
			totalTokens: 0,
			latencyMsSum: 0,
			latencySamples: 0,
			speedSum: 0,
			speedSamples: 0,
			credits: 0,
			cacheHitTokens: 0,
			cacheMissTokens: 0
		});
		const add = (into, row) => {
			into.calls += safe(row.q);
			into.failures += safe(row.e);
			into.promptTokens += safe(row.p);
			into.completionTokens += safe(row.c);
			into.totalTokens += safe(row.t);
			into.latencyMsSum += safe(row.l);
			into.latencySamples += safe(row.ln);
			into.speedSum += safe(row.v);
			into.speedSamples += safe(row.vn);
			/* ledger rows written before the credit fields existed have no `cr`, and
			   one missing value must not turn the whole window's total into NaN */
			into.credits += safe(row.cr);
			into.cacheHitTokens += safe(row.ch);
			into.cacheMissTokens += safe(row.cm);
		};
		const totals = blank();
		const series = /* @__PURE__ */ new Map();
		const byAccount = /* @__PURE__ */ new Map();
		const byModel = /* @__PURE__ */ new Map();
		const byRegion = /* @__PURE__ */ new Map();
		const bucket = (map, key) => {
			const row = map.get(key) ?? blank();
			map.set(key, row);
			return row;
		};
		for (const row of rows) {
			add(totals, row);
			add(bucket(series, row.h), row);
			add(bucket(byAccount, `${row.u}\u0000${row.r}`), row);
			add(bucket(byModel, row.m === "" ? "unknown" : row.m), row);
			add(bucket(byRegion, row.r), row);
		}
		const shape = (row) => ({
			calls: row.calls,
			failures: row.failures,
			promptTokens: row.promptTokens,
			completionTokens: row.completionTokens,
			totalTokens: row.totalTokens,
			credits: Math.round(row.credits * 1e4) / 1e4,
			cacheHitTokens: row.cacheHitTokens,
			cacheMissTokens: row.cacheMissTokens,
			/* Tokens one credit buys, measured from the upstream's own bill. Null when
			   nothing was billed in this window, so the UI shows a dash rather than
			   dividing by zero or inventing a rate. */
			tokensPerCredit: row.credits > 0 ? Math.round(row.totalTokens / row.credits) : null,
			...row.latencySamples === 0 ? {} : { avgLatencyMs: Math.round(row.latencyMsSum / row.latencySamples) },
			...row.speedSamples === 0 ? {} : { avgTokensPerSecond: Math.round(row.speedSum / row.speedSamples * 10) / 10 }
		});
		return {
			totals: shape(totals),
			series: [...series.entries()].map(([h, row]) => ({
				hour: h,
				...shape(row)
			})).sort((left, right) => left.hour - right.hour),
			accounts: [...byAccount.entries()].map(([key, row]) => {
				const [accountId, region] = key.split("\u0000");
				return {
					accountId,
					region,
					...shape(row)
				};
			}).sort((left, right) => right.totalTokens - left.totalTokens || right.calls - left.calls),
			models: [...byModel.entries()].map(([model, row]) => ({
				model,
				...shape(row)
			})).sort((left, right) => right.totalTokens - left.totalTokens || right.calls - left.calls),
			regions: [...byRegion.entries()].map(([region, row]) => ({
				region,
				...shape(row)
			})).sort((left, right) => right.totalTokens - left.totalTokens)
		};
	};
	ctx.effect(() => {
		const disposeUsage = ctx.webServer.register({
			kind: "exact",
			path: WORKBUDDY_USAGE_PATH,
			handler: async (req, res) => {
				if (req.method !== "GET") {
					json(res, 405, { error: "method not allowed" });
					return;
				}
				if (!loopbackOrigin(req)) {
					json(res, 403, { error: "origin-not-trusted" });
					return;
				}
				const region = requestRegion(req, res);
				if (region === void 0) return;
				try {
					/**
					* `?fast=1` returns the local half only (account, models, enabled
					* sets) so a provider switch paints immediately; the client then
					* fetches the full document in the background for credits/check-in.
					*/
					const url = req.url ?? "";
					const at = url.indexOf("?");
					const fast = at !== -1 && new URLSearchParams(url.slice(at + 1)).get("fast") === "1";
					json(res, 200, fast ? await workBuddyWebStatusFast(deps, region) : await workBuddyWebStatus(deps, region));
				} catch (error) {
					json(res, 500, { error: safeMessage(error) });
				}
			}
		});
		const disposeAccounts = ctx.webServer.register({
			kind: "exact",
			path: WORKBUDDY_ACCOUNTS_REFRESH_PATH,
			handler: async (req, res) => {
				if (req.method !== "POST") return json(res, 405, { error: "method not allowed" });
				if (!loopbackOrigin(req)) return json(res, 403, { error: "origin-not-trusted" });
				const region = requestRegion(req, res);
				if (region === void 0) return;
				try {
					json(res, 200, { accounts: (await deps.store(region).accounts()).map(toWebAccount) });
				} catch (error) {
					json(res, 500, { error: safeMessage(error) });
				}
			}
		});
		const disposeCheckin = ctx.webServer.register({
			kind: "exact",
			path: WORKBUDDY_CHECKIN_PATH,
			handler: async (req, res) => {
				if (req.method !== "POST") return json(res, 405, { error: "method not allowed" });
				if (!loopbackOrigin(req)) return json(res, 403, { error: "origin-not-trusted" });
				const region = requestRegion(req, res);
				if (region === void 0) return;
				try {
					const credential = await deps.store(region).resolve();
					const current = await deps.client.fetchCheckinStatus(credential);
					if (!current.active) return json(res, 409, { error: "check-in activity is not active" });
					if (current.todayCheckedIn) return json(res, 200, {
						alreadyCheckedIn: true,
						checkin: current
					});
					json(res, 200, {
						alreadyCheckedIn: false,
						claim: await deps.client.claimDailyCheckin(credential),
						checkin: await deps.client.fetchCheckinStatus(credential)
					});
				} catch (error) {
					json(res, 500, { error: safeMessage(error) });
				}
			}
		});
		const disposeRefresh = ctx.webServer.register({
			kind: "exact",
			path: WORKBUDDY_MODELS_REFRESH_PATH,
			handler: async (req, res) => {
				if (req.method !== "POST") return json(res, 405, { error: "method not allowed" });
				if (!loopbackOrigin(req)) return json(res, 403, { error: "origin-not-trusted" });
				if (deps.discoverModels === void 0) return json(res, 503, { error: "model refresh unavailable" });
				const region = requestRegion(req, res);
				if (region === void 0) return;
				try {
					json(res, 200, { models: (await deps.discoverModels(region)).map((model) => toWebModel(model, deps.contextBudgets(region))) });
				} catch (error) {
					json(res, 500, { error: safeMessage(error) });
				}
			}
		});
		/**
		* Add account, step 1: mint a WorkBuddy device-authorization link.
		*
		* Nothing is read or written here; the user authorizes in their own
		* browser and step 2 collects the result. The state lives in this process
		* so the poll survives a page reload (start on one tab, finish in another).
		*/
		const disposeLoginStart = ctx.webServer.register({
			kind: "exact",
			path: WORKBUDDY_LOGIN_START_PATH,
			handler: async (req, res) => {
				if (req.method !== "POST") return json(res, 405, { error: "method not allowed" });
				if (!loopbackOrigin(req)) return json(res, 403, { error: "origin-not-trusted" });
				const region = requestRegion(req, res);
				if (region === void 0) return;
				try {
					const base = workBuddyLoginBase(region);
					const response = await fetch(`${base}/v2/plugin/auth/state?platform=CLI`, {
						method: "POST",
						headers: workBuddyLoginHeaders(region),
						body: "{}",
						signal: AbortSignal.timeout(2e4)
					});
					const envelope = await readWorkBuddyLoginEnvelope(response);
					const data = typeof envelope.data === "object" && envelope.data !== null ? envelope.data : {};
					const state = typeof data.state === "string" ? data.state : "";
					const url = typeof data.authUrl === "string" ? data.authUrl : "";
					if (!response.ok || envelope.code !== 0 || state === "" || url === "") {
						json(res, 502, { error: envelope.msg === "" ? `HTTP ${response.status}` : safeMessage(envelope.msg) });
						return;
					}
					for (const [key, session] of workBuddyLoginSessions) if (Date.now() - session.createdAtMs > WORKBUDDY_LOGIN_TTL_MS) workBuddyLoginSessions.delete(key);
					workBuddyLoginSessions.set(state, {
						region,
						createdAtMs: Date.now()
					});
					json(res, 200, {
						state,
						url,
						region
					});
				} catch (error) {
					json(res, 502, { error: safeMessage(error) });
				}
			}
		});
		/**
		* Add account, step 2: poll the authorization.
		*
		* While the browser is still on the consent page upstream answers a
		* business error, which is `pending` here rather than a failure. The first
		* answer carrying a token is written through the same credential store
		* every other account comes from, so the pool has no second registry.
		*/
		const disposeLoginPoll = ctx.webServer.register({
			kind: "exact",
			path: WORKBUDDY_LOGIN_POLL_PATH,
			handler: async (req, res) => {
				if (req.method !== "GET") return json(res, 405, { error: "method not allowed" });
				if (!loopbackOrigin(req)) return json(res, 403, { error: "origin-not-trusted" });
				const region = requestRegion(req, res);
				if (region === void 0) return;
				const state = new URL(req.url ?? "/", "http://127.0.0.1").searchParams.get("state") ?? "";
				const session = workBuddyLoginSessions.get(state);
				if (state === "" || session === void 0 || session.region !== region) {
					json(res, 404, { error: "unknown or expired login state" });
					return;
				}
				try {
					const base = workBuddyLoginBase(region);
					const response = await fetch(`${base}/v2/plugin/auth/token?state=${encodeURIComponent(state)}`, {
						headers: workBuddyLoginHeaders(region),
						signal: AbortSignal.timeout(2e4)
					});
					const envelope = await readWorkBuddyLoginEnvelope(response);
					const data = typeof envelope.data === "object" && envelope.data !== null ? envelope.data : {};
					const accessToken = typeof data.accessToken === "string" ? data.accessToken : "";
					if (!response.ok) {
						json(res, 502, { error: `HTTP ${response.status}` });
						return;
					}
					if (envelope.code !== 0 || accessToken === "") {
						json(res, 200, {
							done: false,
							pending: true,
							message: safeMessage(envelope.msg === "" ? "waiting for login" : envelope.msg)
						});
						return;
					}
					const identity = await workBuddyLoginIdentity(region, state, accessToken);
					if (identity.uid === void 0) {
						json(res, 502, { error: "login completed but the account profile could not be read; start again" });
						return;
					}
					const credential = {
						accessToken,
						refreshToken: typeof data.refreshToken === "string" ? data.refreshToken : "",
						expiresAtMs: typeof data.expiresIn === "number" && data.expiresIn > 0 ? Date.now() + data.expiresIn * 1e3 : 0,
						domain: typeof data.domain === "string" && data.domain !== "" ? data.domain : new URL(base).hostname,
						uid: identity.uid,
						...identity.uin === void 0 ? {} : { uin: identity.uin },
						...identity.nickname === void 0 ? {} : { nickname: identity.nickname },
						...identity.enterpriseId === void 0 ? {} : { enterpriseId: identity.enterpriseId },
						source: "dsh"
					};
					const store = deps.store(region);
					await store.saveOwn(credential);
					workBuddyLoginSessions.delete(state);
					const accounts = await store.accounts();
					const saved = accounts.find((account) => account.id === workbuddyAccountId(credential));
					if (saved === void 0) {
						json(res, 502, { error: `the new credential did not join the ${region} pool (domain ${credential.domain})` });
						return;
					}
					json(res, 200, {
						done: true,
						account: toWebAccount(saved),
						accounts: accounts.map(toWebAccount)
					});
				} catch (error) {
					json(res, 502, { error: safeMessage(error) });
				}
			}
		});
		/**
		* Credits for every account in this region's pool, so the list can show each
		* account's own figure rather than only the selected one's. Each account is
		* fetched independently: one failure degrades that row, never the list.
		*/
		/**
		* Per-account allowance health.
		*
		* Supplied by the caller so the chat shims and this route share ONE map:
		* a 429 during a real conversation and a refusal while reading credits must
		* land on the same account row. Memory-only on purpose - a cooldown is a
		* statement about right now, never a fact worth persisting across a restart.
		*/
		const poolHealth = deps.poolHealth ?? /* @__PURE__ */ new Map();
		/** Model-scoped limits, keyed `accountId\u0000modelId`; see the recorder in apply(). */
		const poolModelHealth = deps.poolModelHealth ?? /* @__PURE__ */ new Map();
		/**
		* Read one account's credits and daily check-in state, and turn a refusal
		* into that account's health rather than into a dead row.
		*/
		const readPoolAccount = async (id, credential, region) => {
			const now = Date.now();
			const [creditsResult, checkinResult] = await Promise.allSettled([deps.client.fetchCredits(credential), supportsCheckin(region) ? deps.client.fetchCheckinStatus(credential) : Promise.resolve(void 0)]);
			if (creditsResult.status === "fulfilled") {
				const credits = toCredits(creditsResult.value);
				const creditsTotal = credits.packages.reduce((sum, pack) => sum + (Number.isFinite(pack.size) ? pack.size : 0), 0);
				/**
				* NOTE: a readable credit balance does NOT mean the account is un-throttled.
				*
				* `code 6004` is a MODEL-level rate limit; the billing endpoint still
				* answers normally while chat calls are refused. Clearing health here used
				* to wipe a cooldown that a chat failure had just recorded - the row went
				* back to 可用 within one 30s poll. Health now expires only on its own
				* deadline, which {@link workBuddyHealthSnapshot} prunes.
				*/
				return {
					id,
					credits: credits.total,
					creditsTotal,
					packages: credits.packages,
					...checkinResult.status === "fulfilled" && checkinResult.value !== void 0 ? { checkin: checkinResult.value } : {}
				};
			}
			const health = workBuddyHealthOf(creditsResult.reason, now);
			if (health === void 0) return {
				id,
				error: safeMessage(creditsResult.reason)
			};
			poolHealth.set(id, health);
			return {
				id,
				error: safeMessage(creditsResult.reason),
				health
			};
		};
		const poolStatsRaw = (region) => typeof deps.stats === "function" ? deps.stats(region) ?? {} : {};
		const amount = (value) => typeof value === "number" && Number.isFinite(value) && value > 0 ? value : 0;
		/**
		* Turn the shim's exact sums into the numbers the pool panel shows.
		*
		* Every average is derived here, from sums: first-token time over the streams
		* that reported one, token speed over the streams that reported both a
		* generation window and a completion count. A figure no stream produced stays
		* absent, so the browser can print a dash rather than a made-up zero.
		*/
		const poolStatView = (stat) => {
			const firstTokenSamples = amount(stat.firstTokenSamples);
			const generationMsSum = amount(stat.generationMsSum);
			const generationTokens = amount(stat.generationTokens);
			return {
				total: amount(stat.total),
				successes: amount(stat.successes),
				failures: amount(stat.failures),
				inFlight: amount(stat.inFlight),
				...amount(stat.lastSuccessAt) === 0 ? {} : { lastSuccessAt: amount(stat.lastSuccessAt) },
				...firstTokenSamples === 0 ? {} : { firstTokenMs: Math.round(amount(stat.firstTokenMsSum) / firstTokenSamples) },
				...generationMsSum === 0 || generationTokens === 0 ? {} : { tokensPerSecond: Math.round(generationTokens / (generationMsSum / 1000) * 10) / 10 },
				...amount(stat.promptTokens) === 0 ? {} : { promptTokens: amount(stat.promptTokens) },
				...amount(stat.completionTokens) === 0 ? {} : { completionTokens: amount(stat.completionTokens) },
				...amount(stat.totalTokens) === 0 ? {} : { totalTokens: amount(stat.totalTokens) },
				/* billed credits, and the token counts that were actually billed at
				   full price (cache hits are near-free, so they are excluded) */
				...amount(stat.credit) === 0 ? {} : { credit: Math.round(amount(stat.credit) * 1e4) / 1e4 },
				...amount(stat.cacheHitTokens) === 0 ? {} : { cacheHitTokens: amount(stat.cacheHitTokens) },
				...amount(stat.cacheMissTokens) === 0 ? {} : { cacheMissTokens: amount(stat.cacheMissTokens) }
			};
		};
		/** Region rollup for the pool header, summed from the same exact figures. */
		const poolStatsSnapshot = (region) => {
			const stats = {};
			let successes = 0;
			let failures = 0;
			let inFlight = 0;
			let promptTokens = 0;
			let completionTokens = 0;
			let totalTokens = 0;
			let firstTokenMsSum = 0;
			let firstTokenSamples = 0;
			let generationMsSum = 0;
			let generationTokens = 0;
			let credit = 0;
			let cacheHitTokens = 0;
			let cacheMissTokens = 0;
			for (const [id, raw] of Object.entries(poolStatsRaw(region))) {
				if (id === "" || raw === null || typeof raw !== "object") continue;
				stats[id] = poolStatView(raw);
				successes += amount(raw.successes);
				failures += amount(raw.failures);
				inFlight += amount(raw.inFlight);
				promptTokens += amount(raw.promptTokens);
				completionTokens += amount(raw.completionTokens);
				totalTokens += amount(raw.totalTokens);
				firstTokenMsSum += amount(raw.firstTokenMsSum);
				firstTokenSamples += amount(raw.firstTokenSamples);
				generationMsSum += amount(raw.generationMsSum);
				generationTokens += amount(raw.generationTokens);
				credit += amount(raw.credit);
				cacheHitTokens += amount(raw.cacheHitTokens);
				cacheMissTokens += amount(raw.cacheMissTokens);
			}
			return {
				stats,
				/* Model-scoped limits are memory-only, so the fast stats poll can
				   keep their row badges current without another upstream read. */
				modelHealth: workBuddyModelHealthSnapshot(poolModelHealth, Date.now()),
				totals: {
					calls: successes + failures,
					successes,
					failures,
					inFlight,
					promptTokens,
					completionTokens,
					totalTokens,
					credit: Math.round(credit * 1e4) / 1e4,
					cacheHitTokens,
					cacheMissTokens,
					/* the headline the user asked for: how many tokens one credit buys,
					   computed from real billed credits, never from a price table */
					...credit === 0 ? {} : { tokensPerCredit: Math.round(totalTokens / credit) },
					...firstTokenSamples === 0 ? {} : { firstTokenMs: Math.round(firstTokenMsSum / firstTokenSamples) },
					...generationMsSum === 0 || generationTokens === 0 ? {} : { tokensPerSecond: Math.round(generationTokens / (generationMsSum / 1000) * 10) / 10 }
				}
			};
		};
		const disposePoolCredits = ctx.webServer.register({
			kind: "exact",
			path: WORKBUDDY_POOL_CREDITS_PATH,
			handler: async (req, res) => {
				if (req.method !== "GET") return json(res, 405, {
					error: "method not allowed"
				});
				if (!loopbackOrigin(req)) return json(res, 403, {
					error: "origin-not-trusted"
				});
				const region = requestRegion(req, res);
				if (region === void 0) return;
				try {
					const store = deps.store(region);
					const credentials = await store.readAll();
					const byId = /* @__PURE__ */ new Map(credentials.map((credential) => [workbuddyAccountId(credential), credential]));
					const ids = [...byId.keys()];
					const settled = await Promise.all(ids.map((id) => readPoolAccount(id, byId.get(id), region)));
					const now = Date.now();
					const counters = poolStatsSnapshot(region);
					json(res, 200, {
						accounts: settled,
						health: workBuddyHealthSnapshot(poolHealth, now),
						cooling: Object.keys(workBuddyHealthSnapshot(poolHealth, now)).length,
						/* model-scoped limits: these do NOT count as the account cooling */
						modelHealth: counters.modelHealth,
						stats: counters.stats,
						totals: counters.totals
					});
				} catch (error) {
					json(res, 500, {
						error: safeMessage(error)
					});
				}
			}
		});
		/**
		* Live request stats for the pool rows. This route touches memory only, so
		* the panel can poll it much faster than credit refreshes without creating
		* upstream traffic.
		*/
		const disposePoolStats = ctx.webServer.register({
			kind: "exact",
			path: WORKBUDDY_POOL_STATS_PATH,
			handler: async (req, res) => {
				if (req.method !== "GET") return json(res, 405, {
					error: "method not allowed"
				});
				if (!loopbackOrigin(req)) return json(res, 403, {
					error: "origin-not-trusted"
				});
				const region = requestRegion(req, res);
				if (region === void 0) return;
				try {
					json(res, 200, poolStatsSnapshot(region));
				} catch (error) {
					json(res, 500, {
						error: safeMessage(error)
					});
				}
			}
		});
		/**
		* Daily check-in for one named account, or for every account in the region
		* when the body names none. The subject is always explicit: a request that
		* means "all" says so by omitting the id, never by accident.
		*/
		const disposePoolCheckin = ctx.webServer.register({
			kind: "exact",
			path: WORKBUDDY_POOL_CHECKIN_PATH,
			handler: async (req, res) => {
				if (req.method !== "POST") return json(res, 405, {
					error: "method not allowed"
				});
				if (!loopbackOrigin(req)) return json(res, 403, {
					error: "origin-not-trusted"
				});
				const region = requestRegion(req, res);
				if (region === void 0) return;
				if (!supportsCheckin(region)) return json(res, 409, {
					error: "check-in is not available for this provider"
				});
				let body;
				try {
					const raw = (await readBody(req)).toString("utf8");
					body = raw === "" ? {} : JSON.parse(raw);
				} catch (error) {
					return json(res, 400, {
						error: "invalid body"
					});
				}
				const wanted = typeof body?.accountId === "string" && body.accountId !== "" ? body.accountId : void 0;
				try {
					const store = deps.store(region);
					const credentials = await store.readAll();
					const byId = /* @__PURE__ */ new Map(credentials.map((credential) => [workbuddyAccountId(credential), credential]));
					const ids = wanted === void 0 ? [...byId.keys()] : [wanted];
					if (wanted !== void 0 && !byId.has(wanted)) return json(res, 404, {
						error: "unknown account"
					});
					const results = await Promise.all(ids.map(async (id) => {
						try {
							const credential = byId.get(id);
							const current = await deps.client.fetchCheckinStatus(credential);
							if (!current.active) return {
								id,
								ok: false,
								error: "check-in activity is not active"
							};
							if (current.todayCheckedIn) return {
								id,
								ok: true,
								alreadyCheckedIn: true,
								checkin: current
							};
							await deps.client.claimDailyCheckin(credential);
							return {
								id,
								ok: true,
								alreadyCheckedIn: false,
								checkin: await deps.client.fetchCheckinStatus(credential)
							};
						} catch (error) {
							return {
								id,
								ok: false,
								error: safeMessage(error)
							};
						}
					}));
					json(res, 200, {
						results,
						checkedIn: results.filter((entry) => entry.ok && entry.alreadyCheckedIn !== true).length,
						alreadyCheckedIn: results.filter((entry) => entry.alreadyCheckedIn === true).length,
						failed: results.filter((entry) => entry.ok !== true).length
					});
				} catch (error) {
					json(res, 500, {
						error: safeMessage(error)
					});
				}
			}
		});
		const tokens = createWorkBuddyTokenLedger();
		/**
		* Count this plugin's providers only. Wrapped whole: accounting must never
		* disturb a turn, whatever shape an event arrives in.
		*/
		const disposeTokenEvents = ctx.on("session/event", (session, event) => {
			try {
				if (event === null || typeof event !== "object") return;
				if (event.type !== "assistant/message") return;
				const data = event.data;
				if (data === null || typeof data !== "object") return;
				const usage = data.usage;
				if (usage === null || typeof usage !== "object") return;
				const message = data.message;
				const source = message === null || typeof message !== "object" ? void 0 : message.source;
				tokens.record(source === null || typeof source !== "object" ? void 0 : source.provider, usage);
			} catch (error) {}
		});
		const disposeTokens = ctx.webServer.register({
			kind: "exact",
			path: WORKBUDDY_TOKENS_PATH,
			handler: async (req, res) => {
				if (req.method !== "GET") return json(res, 405, {
					error: "method not allowed"
				});
				if (!loopbackOrigin(req)) return json(res, 403, {
					error: "origin-not-trusted"
				});
				json(res, 200, tokens.snapshot());
			}
		});
		/**
		* Hourly usage analytics for the usage view. `range` picks the window and
		* defaults to three days - the same default the reference panel uses. An
		* unknown range is a 400 rather than a silent fallback, so a typo in the
		* client cannot quietly show the wrong window.
		*/
		const disposeUsageStats = ctx.webServer.register({
			kind: "exact",
			path: WORKBUDDY_USAGE_STATS_PATH,
			handler: async (req, res) => {
				if (req.method !== "GET") return json(res, 405, {
					error: "method not allowed"
				});
				if (!loopbackOrigin(req)) return json(res, 403, {
					error: "origin-not-trusted"
				});
				const url = req.url ?? "";
				const at = url.indexOf("?");
				const range = (at === -1 ? "" : new URLSearchParams(url.slice(at + 1)).get("range") ?? "") || "3d";
				if (!Object.hasOwn(WORKBUDDY_USAGE_RANGES, range)) return json(res, 400, {
					error: "unknown range"
				});
				try {
					const window = deps.usage.window(range);
					json(res, 200, {
						range,
						since: window.since,
						until: window.until,
						...summarizeUsage(window.rows)
					});
				} catch (error) {
					json(res, 500, { error: safeMessage(error) });
				}
			}
		});
		return () => {
			disposeRefresh();
			disposeLoginStart();
			disposeLoginPoll();
			disposeCheckin();
			disposeAccounts();
			disposeUsage();
			disposeTokens();
			disposeTokenEvents();
			disposePoolCredits();
			disposePoolStats();
			disposePoolCheckin();
			disposeUsageStats();
		};
	}, "dsh-connect-workbuddy: Web status route");
}
//#endregion
//#region src/index.ts
/** Stable Cordis plugin name. */
const name = "dsh-connect-workbuddy";
/** The model registry required before the provider can register. */
const inject = ["llm", "settings"];
/** Settings namespace for the plugin configuration card. */
const WORKBUDDY_SETTINGS_NS = "workbuddy";
const modelConfig = z.object({
	id: z.string().required(),
	name: z.string().required(),
	contextWindow: z.number().step(1).min(1),
	maxTokens: z.number().step(1).min(1)
});
const regionStateConfig = z.object({
	lastCatalog: z.array(modelConfig).default([]),
	enabledModelIds: z.array(z.string()).default([]),
	imageModelIds: z.array(z.string()).default([]),
	contextBudgets: z.dict(z.number().step(1).min(1)).default({})
});
const accountSelectionConfig = z.object({
	cn: z.string().description("Selected domestic (CN) account id (never a token)"),
	global: z.string().description("Selected international account id (never a token)")
});
const Config = z.object({
	authFile: z.string().description("WorkBuddy desktop auth file (defaults to the app's own location)"),
	accountId: z.string().description("Deprecated: pre-split account selector, attributed to its own region"),
	accounts: accountSelectionConfig.description("Per-region account selections, keyed cn | global"),
	regions: z.dict(regionStateConfig).default({}).description("Per-region model directory and selection, keyed cn | global"),
	lastCatalog: z.array(modelConfig).description("Deprecated: pre-region-split CN model directory"),
	enabledModelIds: z.array(z.string()).default([]).description("Deprecated: pre-region-split CN selection"),
	imageModelIds: z.array(z.string()).default([]).description("Deprecated: pre-region-split CN image opt-in"),
	contextBudgets: z.dict(z.number().step(1).min(1)).default({}).description("Deprecated: pre-region-split CN context budgets")
});
/**
* One region's saved model state. A config written before the region split has
* only the flat fields: those were always captured from the CN endpoint (the
* plugin had no international support), so they are read as the CN state and
* only when no explicit CN slot exists. The global region never inherits them —
* that inheritance is exactly the bug where a stale CN directory was
* intersected with the international catalog and silently dropped the user's
* picks.
*/
function regionStateOf(config, region) {
	const stored = config.regions?.[region];
	if (stored !== void 0) return stored;
	if (region !== "cn") return {};
	return {
		...config.lastCatalog === void 0 ? {} : { lastCatalog: config.lastCatalog },
		...config.enabledModelIds === void 0 ? {} : { enabledModelIds: config.enabledModelIds },
		...config.imageModelIds === void 0 ? {} : { imageModelIds: config.imageModelIds },
		...config.contextBudgets === void 0 ? {} : { contextBudgets: config.contextBudgets }
	};
}
/** Every region, in card tab order. */
const REGION_KEYS = ["cn", "global"];
/**
* Start both regions' loopback endpoints, register the `workbuddy` (CN) and
* `workbuddy-global` (international) providers, and refresh each region's
* model catalog from the upstream once that region's credentials allow it.
* The static fallback catalogs serve from the first moment, so an offline
* upstream never leaves a provider empty.
*/
function apply(ctx, config) {
	const client = new WorkBuddyUpstreamClient();
	const usage = createWorkBuddyUsageLedger();
	/**
	* One health recorder shared by both halves of this plugin.
	*
	* The map lives here (not inside the route) because TWO paths learn that an
	* account is out of allowance: reading its credits, and being refused during a
	* chat call. Only the first used to record anything, so an account that got a
	* 429 mid-conversation kept showing "可用" while every call failed.
	*
	* Memory-only on purpose: a cooldown is a statement about right now, never a
	* fact worth surviving a restart.
	*/
	const poolHealth = /* @__PURE__ */ new Map();
	/**
	* Model-level limits, keyed `accountId\u0000modelId`.
	*
	* Kept apart from `poolHealth` on purpose: a throttled MODEL must not grey out
	* a healthy account. Upstream distinguishes them itself - a `6004` that says
	* 「您也可以切换其他模型继续使用」 limits that one model, and the account keeps
	* serving every other model.
	*/
	const poolModelHealth = /* @__PURE__ */ new Map();
	const stacks = {};
	for (const region of REGION_KEYS) {
		const store = new WorkBuddyCredentialStore({
			region,
			...config.authFile === void 0 ? {} : { desktopPath: config.authFile },
			refresh: (credential) => client.refreshToken(credential)
		});
		const catalog = new WorkBuddyCatalog(region);
		stacks[region] = {
			store,
			catalog,
			shim: createWorkBuddyShim({
				store,
				client,
				catalog,
				region,
				usage,
				/* the shim reports a refused chat call here, so the pool row can cool down */
				onUpstreamRefusal: (accountId, error, model) => {
					/**
					* Pass the MESSAGE, not the result envelope.
					*
					* `workBuddyHealthOf` reads its argument with `String(...)`, so handing
					* it the whole `{ok,status,kind,message}` object stringifies to
					* "[object Object]" and never matches a marker - the cooldown was
					* silently never recorded.
					*/
					const health = workBuddyHealthOf(error?.message ?? String(error), Date.now());
					if (health === void 0 || accountId === "" || accountId === "unknown") return;
					/* a model-scoped limit belongs to that model, not to the account */
					if (health.scope === "model" && typeof model === "string" && model !== "") poolModelHealth.set(`${accountId}\u0000${model}`, health);
					else poolHealth.set(accountId, health);
				},
				logger: ctx.logger
			})
		};
	}
	const withImageSelection = (models, images) => models.map((model) => ({
		...model,
		...images.has(model.id) ? { multimodal: true } : { multimodal: false }
	}));
	const configuredModels = (value, region) => {
		const state = regionStateOf(value, region);
		return withImageSelection(deriveCatalog(state.lastCatalog?.length ? state.lastCatalog : fallbackModelsFor(region), new Set(state.enabledModelIds ?? []), state.contextBudgets ?? {}), new Set(state.imageModelIds ?? []));
	};
	const displayModels = (value, region) => {
		const state = regionStateOf(value, region);
		return state.lastCatalog?.length ? state.lastCatalog : fallbackModelsFor(region);
	};
	let current = () => config;
	let invalidateCatalog = () => {};
	/**
	* Legacy migration for the pre-split single `accountId`: its region is
	* resolved once from the local account scan and the selection is then
	* attributed to that region ONLY — the other region keeps its documented
	* default (follow the app's current sign-in) instead of silently inheriting
	* a selection that belongs to the other side of the split.
	*/
	let legacyAccountRegion;
	const effectiveAccountFor = (region, value) => {
		const explicit = value.accounts?.[region];
		if (explicit !== void 0) return explicit;
		return legacyAccountRegion === region ? value.accountId : void 0;
	};
	const discoverModels = async (region, signal) => {
		const credential = await stacks[region].store.resolve();
		return client.fetchModels(credential, signal);
	};
	/** Push the current config into every region's store selection and catalog. */
	const applySelection = (value) => {
		for (const region of REGION_KEYS) {
			stacks[region].store.setDesktopPath(value.authFile);
			stacks[region].store.selectAccount(effectiveAccountFor(region, value));
			stacks[region].catalog.set(configuredModels(value, region));
		}
		invalidateCatalog();
	};
	ctx.inject(["webServer"], (webCtx) => registerWorkBuddyStatusRoute(webCtx, {
		store: (region) => stacks[region].store,
		client,
		stats: (region) => stacks[region].shim.stats(),
		usage,
		/* the same map the shims report refusals into, so a chat-time 429 and a
		   credits-time refusal both land on the account's row */
		poolHealth,
		/* model-scoped limits ride alongside; the panel shows these on the model row */
		poolModelHealth,
		displayModels: (region) => displayModels(current(), region),
		enabledModelIds: (region) => regionStateOf(current(), region).enabledModelIds ?? [],
		imageModelIds: (region) => regionStateOf(current(), region).imageModelIds ?? [],
		contextBudgets: (region) => regionStateOf(current(), region).contextBudgets ?? {},
		discoverModels
	}));
	ctx.settings.installSection(ctx, WORKBUDDY_SETTINGS_NS, Config, config, {
		setSource(source) {
			current = source;
		},
		onChange() {
			applySelection(current());
		}
	});
	applySelection(config);
	(async () => {
		const id = current().accountId;
		if (id === void 0) return;
		try {
			for (const region of REGION_KEYS) if ((await stacks[region].store.accounts()).some((account) => account.id === id)) {
				legacyAccountRegion = region;
				applySelection(current());
				return;
			}
		} catch {}
	})();
	let stopped = false;
	ctx.effect(() => () => {
		stopped = true;
		for (const region of REGION_KEYS) stacks[region].shim.close();
		clearHostHeartbeat();
	});
	Promise.all(REGION_KEYS.map((region) => stacks[region].shim.ready)).then(async () => {
		if (stopped) return;
		const adapters = {};
		try {
			for (const region of REGION_KEYS) adapters[region] = createWorkBuddyAdapter({
				shim: stacks[region].shim,
				store: stacks[region].store,
				catalog: stacks[region].catalog,
				provider: WORKBUDDY_PROVIDERS[region],
				displayName: WORKBUDDY_PROVIDER_DISPLAY_NAMES[region],
				resolveAttachments: () => ctx.get("attachments")
			});
			invalidateCatalog = () => {
				for (const region of REGION_KEYS) adapters[region].invalidate();
			};
			let releaseAdapterCn;
			let releaseAdapterGlobal;
			let releaseDirectory;
			try {
				releaseAdapterCn = ctx.llm.registerAdapter([WORKBUDDY_PROVIDER], adapters.cn.adapter);
				releaseAdapterGlobal = ctx.llm.registerAdapter([WORKBUDDY_GLOBAL_PROVIDER], adapters.global.adapter);
				releaseDirectory = ctx.llm.registerConfigurableProviders([{
					provider: WORKBUDDY_PROVIDER,
					displayName: WORKBUDDY_PROVIDER_DISPLAY_NAMES.cn,
					settingsNs: WORKBUDDY_SETTINGS_NS,
					settingsPath: [],
					declared: false
				}, {
					provider: WORKBUDDY_GLOBAL_PROVIDER,
					displayName: WORKBUDDY_PROVIDER_DISPLAY_NAMES.global,
					settingsNs: WORKBUDDY_SETTINGS_NS,
					settingsPath: [],
					declared: false
				}]);
			} finally {
				if (releaseAdapterCn === void 0 || releaseAdapterGlobal === void 0 || releaseDirectory === void 0) {
					releaseAdapterCn?.();
					releaseAdapterGlobal?.();
					releaseDirectory?.();
				}
			}
			try {
				ctx.effect(() => () => {
					releaseAdapterCn?.();
					releaseAdapterGlobal?.();
					releaseDirectory?.();
				});
			} catch {
				releaseAdapterCn?.();
				releaseAdapterGlobal?.();
				releaseDirectory?.();
			}
			ctx.llm.registerModelDiscovery(WORKBUDDY_SETTINGS_NS, async (request, signal) => {
				const region = regionOfProvider(request.provider ?? "");
				if (region === void 0) return [];
				const discovered = await discoverModels(region, signal);
				const state = regionStateOf(current(), region);
				return withImageSelection(deriveCatalog(discovered, new Set(state.enabledModelIds ?? []), state.contextBudgets ?? {}), new Set(state.imageModelIds ?? [])).map((model) => ({
					id: model.id,
					name: workBuddyDisplayName(model),
					contextWindow: model.contextWindow,
					maxTokens: model.maxTokens,
					inputModalities: workBuddyModelInput(model)
				}));
			});
			writeHostHeartbeat();
		} catch (error) {
			ctx.logger.error("dsh-connect-workbuddy: provider registration failed", error);
			return;
		}
		if (stopped) return;
		for (const region of REGION_KEYS) (async () => {
			try {
				const credential = await stacks[region].store.resolve();
				if (stopped) return;
				const models = await client.fetchModels(credential);
				if (stopped) return;
				const state = regionStateOf(current(), region);
				stacks[region].catalog.set(withImageSelection(deriveCatalog(models, new Set(state.enabledModelIds ?? []), state.contextBudgets ?? {}), new Set(state.imageModelIds ?? [])));
				adapters[region].invalidate();
			} catch (error) {
				ctx.logger.warn(`dsh-connect-workbuddy: dynamic ${region} model catalog unavailable; serving the static fallback list`, error);
			}
		})();
	}).catch((error) => {
		ctx.logger.error("dsh-connect-workbuddy: loopback endpoint failed to start; providers not registered", error);
	});
}
//#endregion
export { Config, FALLBACK_WORKBUDDY_MODELS, FALLBACK_WORKBUDDY_MODELS_GLOBAL, WORKBUDDY_ACCOUNTS_REFRESH_PATH, WORKBUDDY_AUTH_FILENAME, WORKBUDDY_AUTH_FILE_ENV, WORKBUDDY_CHECKIN_PATH, WORKBUDDY_CONNECT_VERSION, WORKBUDDY_GLOBAL_PROVIDER, WORKBUDDY_HOST_HEARTBEAT_FILENAME, WORKBUDDY_MODELS_REFRESH_PATH, WORKBUDDY_PROVIDER, WORKBUDDY_PROVIDERS, WORKBUDDY_PROVIDER_DISPLAY_NAMES, WORKBUDDY_REGIONS, WORKBUDDY_REGION_PARAM, WORKBUDDY_SETTINGS_NS, WORKBUDDY_STREAM_IDLE_TIMEOUT_MS, WORKBUDDY_USAGE_PATH, WorkBuddyCatalog, WorkBuddyCredentialStore, WorkBuddyUpstreamClient, apply, authFileName, classifyUpstreamError, clearHostHeartbeat, createWorkBuddyAdapter, createWorkBuddyShim, createWorkBuddyUsageLedger, defaultDesktopAuthCandidates, defaultDesktopAuthDirs, defaultDesktopAuthPath, deriveCatalog, fallbackModelsFor, inject, isHeartbeatProcessAlive, legacyWorkbuddyOwnAuthPath, name, parseCreditMultiplier, parseReasoning, parseUpstreamModel, parseWorkBuddyAuth, prepareChatBody, processStartTimeMs, readHostHeartbeat, regionOf, regionOfProvider, regionOfStatusUrl, regionStateOf, registerWorkBuddyStatusRoute, toPersistedWorkBuddyModel, withWorkBuddyRegion, workBuddyDisplayName, workBuddyModelInput, workBuddyThinkingLevelMap, workBuddyWebStatus, workbuddyAccountId, workbuddyHostHeartbeatPath, workbuddyOwnAuthPath, writeHostHeartbeat };
export { WORKBUDDY_LOGIN_POLL_PATH, WORKBUDDY_LOGIN_START_PATH, workBuddyHealthOf };
