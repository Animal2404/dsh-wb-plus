		//#region src/client/WorkBuddySidebar.tsx
		/**
		* Sidebar entry + panel for the WorkBuddy plugin.
		*
		* Mounted through ui-sidebar's own extension point: `sidebar.footer.action`
		* is a `kind:list` / `scope:root` slot whose owner share is `{ wide }` — the
		* same seat ui-cordis takes for its panel. The sidebar keeps owning the
		* button frame, the rail/wide geometry and the fade, so this occupant only
		* draws its own trigger and the panel it opens. Registering here adds one
		* entry to an existing list; no other sidebar plugin is displaced,
		* reordered, or made to share a seat.
		*
		* Data comes from the routes the settings card already uses (`usage` /
		* `accounts/refresh` / `models/refresh` / `checkin`). The model list and the
		* model switch use the platform's own session model directory
		* (`modelDirectories.directoryFor(sessionId)`), so a pick really installs the
		* session's model instead of faking a selection.
		*
		* @module dsh-connect-workbuddy/client/WorkBuddySidebar
		*/
		/** Panel copy (zh), kept beside the component so the panel is self-contained. */
		const WORKBUDDY_SIDEBAR_ZH = {
			entry: "WorkBuddy",
			entryTooltip: "WorkBuddy 积分与模型",
			title: "WorkBuddy",
			collapse: "收起",
			expand: "展开",
			region: "供应商",
			account: "账号",
			"sb-workbuddy-view": "WorkBuddy",
			rescan: "重新检测账号",
			rescanning: "检测中…",
			checkin: "签到",
			checkingIn: "签到中…",
			checkinDone: "今日已签到",
			checkinCredit: "签到积分",
			totalCredit: "总积分",
			refreshModels: "刷新模型",
			refreshing: "刷新中…",
			model: "选择模型",
			modelEmpty: "该供应商暂无模型",
			modelEnable: "启用并使用该模型",
			creditShort: "积分",
			creditUnknown: "—",
			pool: "号池",
			poolUnit: " 个账号",
			poolStatAccounts: "账号",
			poolStatAvailable: "可用",
			poolStatCooling: "冷却",
			poolStatCalls: "调用次数",
			poolStatFirstToken: "首 token",
			poolStatSpeed: "Token 速度",
			poolStatTokens: "Token 总量",
			tabPool: "账号池",
			tabUsage: "用量",
			/* Compact on purpose: four range chips plus the refresh button share one
			   row, and "近 14 天" truncates in the narrow sidebar. */
			usageRange1d: "1 天",
			usageRange3d: "3 天",
			usageRange7d: "7 天",
			usageRange14d: "14 天",
			usageRangeAll: "全部",
			usageRequests: "请求数",
			usageTotalTokens: "总 token",
			usagePrompt: "输入 token",
			usageCompletion: "输出 token",
			usageFailures: "失败尝试",
			usageAvgLatency: "平均延迟",
			usageAvgSpeed: "平均速率",
			usageTokensPerCredit: "token / 积分",
			usageCreditsSpent: "已耗积分",
			usageCacheHitRate: "缓存命中",
			usageByAccount: "按账号",
			usageByModel: "按模型",
			usageByRegion: "按域",
			usageColModel: "模型",
			usageColRealm: "域",
			usageColRequests: "请求",
			usageColPrompt: "输入",
			usageColCompletion: "输出",
			usageColFailures: "失败",
			usageColTotal: "合计",
			usageColLatency: "平均延迟",
			usageColSpeed: "平均速率",
			usageEmpty: "这个时间窗内还没有调用记录",
			usageRefresh: "刷新用量",
			poolPackages: "积分构成",
			packageCycle: "周期",
			packageExpires: "到期",
			modelDefault: "默认",
			modelEfforts: "档位",
			modelContext: "最大上下文",
			modelOutput: "最大输出",
			tokenExpires: "令牌到期",
			tokenAutoRenew: "自动续期",
			poolExpiring3d: "近 3 天到期",
			scan: "扫描添加账号",
			scanning: "扫描中",
			poolEmpty: "未发现账号：点「添加账号」生成登录链接，登录后自动入池",
			acctCurrent: "当前使用中",
			acctUse: "切换到这个账号",
			acctUnknown: "未命名账号",
			acctSuccess: "成功率",
			acctCalls: "次调用",
			acctLastSuccess: "最近成功",
			acctNoCalls: "暂无调用",
			acctInFlight: "在途",
			addAccount: "添加账号",
			poolCreditsLabel: "积分",
			refreshCredits: "刷新积分",
			refreshingCredits: "刷新中",
			hideNames: "隐藏账号名字",
			nameHidden: "已隐藏",
			creditsFailed: "积分刷新失败",
			addHint: "生成登录链接后在浏览器里登录要添加的账号，登录成功会自动收进号池。",
			addStart: "生成登录链接",
			addStarting: "生成中…",
			addWaiting: "等待浏览器完成登录…",
			addOpen: "打开登录页",
			addCopy: "复制链接",
			addCopied: "已复制",
			addCopyFailed: "复制失败，请手动选中链接",
			addDone: "已加入号池",
			addClose: "关闭",
			addCancel: "取消",
			addErrHttp: "添加失败",
			modelImage: "图片",
			contextBudget: "上下文",
			context200k: "200K",
			notWritable: "设置不可写，无法保存",
			modelEnabledHint: "已启用",
			modelUse: "使用",
			loading: "加载中…",
			noSession: "请先打开一个会话",
			noAccount: "未检测到账号",
			signedOut: "未登录",
			signedIn: "已登录",
			requestFailed: "请求失败",
			panelFailed: "面板渲染失败",
			poolHealthOk: "可用",
			poolHealthCooling: "冷却中",
			poolHealthModelLimited: "模型限流",
			coolingUntil: "冷却至",
			modelLimitUntil: "限流恢复时间",
			modelLimitHint: "该模型被上游限流，其它模型仍可使用",
			checkinAll: "一键签到",
			checkinAllBusy: "签到中…",
			checkinAllDone: "已全部签到",
			checkinOne: "签到",
			checkinOneDone: "已签到",
			checkinOneBusy: "签到中",
			coolingHint: "该账号被上游限流/额度耗尽，到期前自动换用其它账号"
		};
		/** English copy for the same keys. */
		const WORKBUDDY_SIDEBAR_EN = {
			entry: "WorkBuddy",
			entryTooltip: "WorkBuddy credits and models",
			title: "WorkBuddy",
			collapse: "Collapse",
			expand: "Expand",
			region: "Provider",
			account: "Account",
			"sb-workbuddy-view": "WorkBuddy",
			rescan: "Recheck account",
			rescanning: "Checking…",
			checkin: "Check in",
			checkingIn: "Checking in…",
			checkinDone: "Checked in today",
			checkinCredit: "Check-in credits",
			totalCredit: "Total credits",
			refreshModels: "Refresh models",
			refreshing: "Refreshing…",
			model: "Model",
			modelEmpty: "No models for this provider",
			modelEnable: "Enable and use this model",
			creditShort: "credits",
			creditUnknown: "—",
			pool: "Account pool",
			poolUnit: " accounts",
			poolStatAccounts: "Accounts",
			poolStatAvailable: "Ready",
			poolStatCooling: "Cooling",
			poolStatCalls: "Calls",
			poolStatFirstToken: "First token",
			poolStatSpeed: "Token speed",
			poolStatTokens: "Tokens",
			tabPool: "Accounts",
			tabUsage: "Usage",
			usageRange1d: "Last 1 day",
			usageRange3d: "Last 3 days",
			usageRange7d: "Last 7 days",
			usageRange14d: "Last 14 days",
			usageRangeAll: "All",
			usageRequests: "Requests",
			usageTotalTokens: "Total tokens",
			usagePrompt: "Input tokens",
			usageCompletion: "Output tokens",
			usageFailures: "Failures",
			usageAvgLatency: "Avg latency",
			usageAvgSpeed: "Avg speed",
			usageTokensPerCredit: "Tokens / credit",
			usageCreditsSpent: "Credits spent",
			usageCacheHitRate: "Cache hits",
			usageByAccount: "By account",
			usageByModel: "By model",
			usageByRegion: "By realm",
			usageColModel: "Model",
			usageColRealm: "Realm",
			usageColRequests: "Requests",
			usageColPrompt: "Input",
			usageColCompletion: "Output",
			usageColFailures: "Failed",
			usageColTotal: "Total",
			usageColLatency: "Avg latency",
			usageColSpeed: "Avg speed",
			usageEmpty: "No calls recorded in this window",
			usageRefresh: "Refresh usage",
			poolPackages: "Credit composition",
			packageCycle: "Cycle",
			packageExpires: "Expires",
			modelDefault: "Default",
			modelEfforts: "Efforts",
			modelContext: "Max context",
			modelOutput: "Max output",
			tokenExpires: "Token expires",
			tokenAutoRenew: "auto-renew",
			poolExpiring3d: "Expiring in 3d",
			scan: "Scan for accounts",
			scanning: "Scanning",
			poolEmpty: "No accounts yet. Add one and sign in from the generated link.",
			acctCurrent: "In use",
			acctUse: "Switch to this account",
			acctUnknown: "Unnamed account",
			acctSuccess: "Success",
			acctCalls: "calls",
			acctLastSuccess: "Last success",
			acctNoCalls: "No calls",
			acctInFlight: "In flight",
			addAccount: "Add account",
			poolCreditsLabel: "Credits",
			refreshCredits: "Refresh credits",
			refreshingCredits: "Refreshing",
			hideNames: "Hide account names",
			nameHidden: "Hidden",
			creditsFailed: "Credits refresh failed",
			addHint: "Generate a sign-in link, then sign in with the account you want to add; it joins the pool automatically.",
			addStart: "Generate sign-in link",
			addStarting: "Generating…",
			addWaiting: "Waiting for the browser to finish…",
			addOpen: "Open sign-in page",
			addCopy: "Copy link",
			addCopied: "Copied",
			addCopyFailed: "Copy failed - select the link manually",
			addDone: "Added to the pool",
			addClose: "Close",
			addCancel: "Cancel",
			addErrHttp: "Add failed",
			modelImage: "Image",
			contextBudget: "Context",
			context200k: "200K",
			notWritable: "Settings are not writable",
			modelEnabledHint: "Enabled",
			modelUse: "Use",
			loading: "Loading…",
			noSession: "Open a session first",
			noAccount: "No account detected",
			signedOut: "Signed out",
			signedIn: "Signed in",
			requestFailed: "Request failed",
			panelFailed: "Panel failed to render",
			poolHealthOk: "Ready",
			poolHealthCooling: "Cooling",
			poolHealthModelLimited: "Model limited",
			coolingUntil: "until",
			modelLimitUntil: "Reset",
			modelLimitHint: "This model is rate-limited upstream; other models remain available",
			checkinAll: "Check in all",
			checkinAllBusy: "Checking in…",
			checkinAllDone: "All checked in",
			checkinOne: "Check in",
			checkinOneDone: "Checked in",
			checkinOneBusy: "Working",
			coolingHint: "The upstream refused this account (rate limit or spent allowance); another account covers it until then"
		};
		/**
		* Effort label for one picker row, reading both reasoning shapes the host
		* hands out: the usage document's `{supportedEfforts,defaultEffort}` and the
		* routable catalog's `{efforts:[{id}]}`. Returns undefined when the model
		* advertises no efforts, so the row simply draws no tag.
		*/
		function reasoningTagOf(model) {
			const reasoning = model?.reasoning;
			if (reasoning === void 0 || reasoning === null) return void 0;
			const efforts = Array.isArray(reasoning.efforts) ? reasoning.efforts.map((effort) => effort?.id).filter((id) => typeof id === "string") : Array.isArray(reasoning.supportedEfforts) ? reasoning.supportedEfforts.filter((id) => typeof id === "string") : [];
			return efforts.length === 0 ? void 0 : efforts.join("/");
		}
		function reasoningDefaultOf(model) {
			const effort = model?.reasoning?.defaultEffort;
			return typeof effort === "string" && effort !== "" ? effort : void 0;
		}
		/**
		* Default thinking strength shown on a model row.
		*
		* The panel's rule is "max when the model actually supports max": the
		* upstream ladder is the source of truth, so a model that only advertises
		* high/medium/off keeps its own default instead of being mislabelled max.
		*/
		function displayDefaultEffortOf(model) {
			const efforts = reasoningEffortsOf(model);
			if (efforts.includes("max")) return "max";
			return reasoningDefaultOf(model);
		}
		/** All advertised effort ids, from either upstream reasoning shape. */
		function reasoningEffortsOf(model) {
			const reasoning = model?.reasoning;
			if (reasoning === void 0 || reasoning === null) return [];
			return Array.isArray(reasoning.efforts) ? reasoning.efforts.map((effort) => effort?.id).filter((id) => typeof id === "string") : Array.isArray(reasoning.supportedEfforts) ? reasoning.supportedEfforts.filter((id) => typeof id === "string") : [];
		}
		/**
		* Contains render failures to the panel body.
		*
		* The slot renderer treats a throwing entry as crashed and draws nothing, so
		* an unexpected shape in one field would remove the sidebar entry itself.
		* Catching here keeps the trigger mounted and turns the failure into copy.
		*/
		class WorkBuddySidebarBoundary extends react.Component {
			constructor(props) {
				super(props);
				this.state = { message: void 0 };
			}
			static getDerivedStateFromError(error) {
				return { message: error instanceof Error ? error.message : String(error) };
			}
			componentDidCatch(error) {
				console.error("[dsh-connect-workbuddy] sidebar panel render failed:", error);
			}
			render() {
				if (this.state.message === void 0) return this.props.children;
				return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: "dsm-wb-side-error",
					role: "alert",
					children: (this.props.label ?? "面板渲染失败") + ": " + this.state.message
				});
			}
		}
		/**
		* Credit-multiplier label for one picker row, in this deployment's usual
		* `x0.03` spelling. A model without a usable rate yields undefined, so the
		* row shows nothing rather than a wrong `x0` or `NaN`.
		*/
		function multiplierLabelOf(model) {
			const rate = model?.creditMultiplier;
			if (typeof rate !== "number" || !Number.isFinite(rate)) return void 0;
			return `x${rate.toFixed(2)}`;
		}
		/**
* Credits as a complete, readable figure.
*
* Deliberately NOT compacted to "1.2K": a credits balance is a figure the user
* acts on, and the rounded form loses the exact value. Grouped digits keep it
* legible at a glance without ever hiding magnitude.
*/
function formatSidebarCredits(value) {
	if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return "—";
	return String(Math.trunc(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
/**
* One account's credits as "remaining / capacity".
*
* The pool summary above already shows this pair for the whole region, so the
* row uses the same form and the same rounded figures; a row whose capacity the
* upstream never reported falls back to the remaining figure alone rather than
* inventing a denominator.
*/
function poolAccountCreditsLabel(remaining, capacity) {
	const hasRemaining = typeof remaining === "number" && Number.isFinite(remaining) && remaining >= 0;
	const hasCapacity = typeof capacity === "number" && Number.isFinite(capacity) && capacity > 0;
	if (!hasRemaining) return hasCapacity ? `— / ${formatSidebarCredits(capacity)}` : "—";
	return hasCapacity ? `${formatSidebarCredits(remaining)} / ${formatSidebarCredits(capacity)}` : formatSidebarCredits(remaining);
}
/** Compact date for a credit package refresh or expiry boundary. */
function formatSidebarPackageDate(value) {
	if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return void 0;
	const date = new Date(value);
	if (!Number.isFinite(date.getTime())) return void 0;
	return `${date.getMonth() + 1}/${date.getDate()}`;
}
/** Compact capacity label ("1M", "200K") matching the settings card's wording. */
		function formatSidebarCapacity(value) {
			if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return "—";
			if (value >= 1e6) return `${Number((value / 1e6).toFixed(value % 1e6 === 0 ? 0 : 1))}M`;
			if (value >= 1e3) return `${Number((value / 1e3).toFixed(value % 1e3 === 0 ? 0 : 1))}K`;
			return String(value);
		}
		/** The two WorkBuddy providers, in switch order, with their host provider ids. */
/** A measured latency in the unit a person reads at a glance: 840ms / 3.1s. */
function formatSidebarLatency(value) {
	if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return void 0;
	return value < 1e3 ? `${Math.round(value)}ms` : `${(value / 1e3).toFixed(value < 1e4 ? 1 : 0)}s`;
}
/** Token counts in the same K/M shorthand the composer uses for its own readout. */
function formatSidebarTokens(value) {
	if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return void 0;
	if (value < 1e3) return String(Math.round(value));
	if (value < 1e6) return `${(value / 1e3).toFixed(value < 1e5 ? 1 : 0)}K`;
	return `${(value / 1e6).toFixed(1)}M`;
}
/** Throughput at one decimal, so the figure does not jitter as it ticks. */
function formatSidebarSpeed(value) {
	if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return void 0;
	return `${value.toFixed(1)} tok/s`;
}
/**
* Region rollup for the pool header. The host derives every average, so this only
* refuses anything that is not a finite, non-negative number - a missing figure
* stays missing and the panel prints a dash instead of a zero it never measured.
*/
/** Compact count for the usage tables: 16.95M / 35.3k / 120. */
function formatUsageCount(value) {
	if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return "0";
	if (value < 1e3) return String(Math.round(value));
	if (value < 1e6) return `${(value / 1e3).toFixed(value < 1e4 ? 2 : 1)}k`;
	return `${(value / 1e6).toFixed(2)}M`;
}
/** Latency for the usage view: seconds with two decimals, as the reference does. */
function formatUsageLatency(ms) {
	if (typeof ms !== "number" || !Number.isFinite(ms) || ms <= 0) return "—";
	return `${(ms / 1e3).toFixed(2)}s`;
}
/** Throughput for the usage view, one decimal. */
function formatUsageSpeed(value) {
	if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return "—";
	return `${value.toFixed(1)} tok/s`;
}
/**
* "How many tokens one credit buys", from the upstream's own bill.
*
* Shown as a plain count with a grouping separator: this is a headline the user
* compares against other models, so a rounded "8.8k" would hide the difference
* that matters. Absent when nothing was billed in the window, never a zero.
*/
function formatUsageTokensPerCredit(value) {
	if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return "—";
	return String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
/** Credits as a small decimal; the upstream bills to 0.01 but we keep 4 places. */
function formatUsageCredits(value) {
	if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return "0";
	return value >= 100 ? String(Math.round(value)) : String(Math.round(value * 1e4) / 1e4);
}
/**
* Keep one server-provided aggregate row to finite, non-negative numbers. The
* host ships an absent average rather than a zero when nothing was measured, so
* an absent field stays absent here and its cell renders a dash.
*/
function normalizeUsageRow(raw, keyName) {
	const out = keyName === void 0 ? {} : { [keyName]: typeof raw?.[keyName] === "string" ? raw[keyName] : "" };
	const number = (key) => typeof raw?.[key] === "number" && Number.isFinite(raw[key]) && raw[key] >= 0 ? raw[key] : 0;
	out.calls = number("calls");
	out.failures = number("failures");
	out.promptTokens = number("promptTokens");
	out.completionTokens = number("completionTokens");
	out.totalTokens = number("totalTokens");
	out.credits = number("credits");
	out.cacheHitTokens = number("cacheHitTokens");
	out.cacheMissTokens = number("cacheMissTokens");
	/* Rounded to a whole token: the underlying bill is quantised to 0.01 credits
	   anyway, so a fractional figure would imply precision that is not there. */
	const tokensPerCredit = number("tokensPerCredit");
	if (tokensPerCredit > 0) out.tokensPerCredit = Math.round(tokensPerCredit);
	const avgLatencyMs = number("avgLatencyMs");
	if (avgLatencyMs > 0) out.avgLatencyMs = avgLatencyMs;
	const avgTokensPerSecond = number("avgTokensPerSecond");
	if (avgTokensPerSecond > 0) out.avgTokensPerSecond = avgTokensPerSecond;
	return out;
}
/**
* The usage document as the view renders it. Anything malformed degrades to an
* empty window instead of throwing: a bad readout must not blank the panel.
*/
function normalizeSidebarUsage(raw) {
	const out = {
		range: typeof raw?.range === "string" ? raw.range : "3d",
		since: typeof raw?.since === "number" ? raw.since : 0,
		until: typeof raw?.until === "number" ? raw.until : 0,
		totals: normalizeUsageRow(raw?.totals),
		series: [],
		accounts: [],
		models: [],
		regions: []
	};
	for (const entry of Array.isArray(raw?.series) ? raw.series : []) {
		if (entry === null || typeof entry !== "object") continue;
		const hour = typeof entry.hour === "number" && Number.isFinite(entry.hour) ? entry.hour : 0;
		if (hour <= 0) continue;
		out.series.push({
			hour,
			...normalizeUsageRow(entry)
		});
	}
	out.series.sort((left, right) => left.hour - right.hour);
	for (const entry of Array.isArray(raw?.accounts) ? raw.accounts : []) {
		if (entry === null || typeof entry !== "object") continue;
		const row = normalizeUsageRow(entry, "accountId");
		row.region = typeof entry.region === "string" ? entry.region : "";
		out.accounts.push(row);
	}
	for (const entry of Array.isArray(raw?.models) ? raw.models : []) {
		if (entry === null || typeof entry !== "object") continue;
		out.models.push(normalizeUsageRow(entry, "model"));
	}
	for (const entry of Array.isArray(raw?.regions) ? raw.regions : []) {
		if (entry === null || typeof entry !== "object") continue;
		out.regions.push(normalizeUsageRow(entry, "region"));
	}
	return out;
}
function normalizeSidebarPoolTotals(raw) {
	const out = {};
	if (raw === null || typeof raw !== "object") return out;
	const number = (key) => typeof raw[key] === "number" && Number.isFinite(raw[key]) && raw[key] >= 0 ? raw[key] : 0;
	out.calls = number("calls");
	const firstTokenMs = number("firstTokenMs");
	if (firstTokenMs > 0) out.firstTokenMs = firstTokenMs;
	const tokensPerSecond = number("tokensPerSecond");
	if (tokensPerSecond > 0) out.tokensPerSecond = tokensPerSecond;
	const totalTokens = number("totalTokens");
	if (totalTokens > 0) out.totalTokens = totalTokens;
	return out;
}
/** Per-account credits for the pool rows. */
const WORKBUDDY_POOL_CREDITS_PATH = "/plugins/dsh-connect-workbuddy/pool/credits";
/**
* Last known panel data, kept OUTSIDE React.
*
* Switching to the 对话 tab unmounts this view, so every `useState` starts empty
* when the user comes back - which flashed an "未登录 / 0 个账号" shell until the
* fetches returned. Caching the last good snapshot here lets a remount paint the
* real figures immediately and then refresh in place, so the panel never shows a
* bogus empty state. Cleared only when the host reloads the bundle (i.e. a real
* plugin reload), never by tab switching.
*/
const WORKBUDDY_PANEL_CACHE = {
	status: void 0,
	fetched: [],
	enabledIds: [],
	imageIds: [],
	accounts: [],
	poolCredits: {},
	poolStats: {},
	poolTotals: {},
	poolHealth: {},
	poolModelHealth: {},
	poolCheckin: {},
	poolDetails: {},
	usageStats: void 0,
	/** Which region the cached figures belong to, so a provider switch still clears. */
	region: void 0,
	/** True once anything has been stored, so we can tell "empty" from "unknown". */
	warm: false
};
/** Memory-only per-account model request stats, polled faster than credits. */
const WORKBUDDY_POOL_STATS_PATH = "/plugins/dsh-connect-workbuddy/pool/stats";
/** Hourly usage analytics: requests, tokens, latency and rate over a window. */
const WORKBUDDY_USAGE_STATS_PATH = "/plugins/dsh-connect-workbuddy/usage-stats";
/** Windows the usage view offers, in the order it offers them. */
const WORKBUDDY_USAGE_RANGES = [
	"1d",
	"3d",
	"7d",
	"14d",
	"all"
];
/** Range id -> copy key. Spelled out because "all" would otherwise become
 *  `usageRangeall`, which no locale defines. */
const WORKBUDDY_USAGE_RANGE_LABELS = {
	"1d": "usageRange1d",
	"3d": "usageRange3d",
	"7d": "usageRange7d",
	"14d": "usageRange14d",
	all: "usageRangeAll"
};
/** Name visibility is a display preference, remembered per browser. */
const NAMES_HIDDEN_KEY = "dsh.workbuddy.pool.hideNames";
/**
* UI preferences that must survive a tab switch, a page reload and a restart.
*
* These are display choices, not provider configuration, so they live in
* localStorage next to the existing name-visibility switch rather than in the
* plugin's settings (which is per-provider and would need a region to read).
*
* The region one is why this exists: the panel unmounts when the user visits the
* 对话 tab, so a plain useState fell back to 国内版 every time - the user picked
* 国际版 and it silently reverted.
*/
const PREFERENCES_KEY = "dsh.workbuddy.panel.prefs";
/** Read the saved UI preferences; malformed or absent storage yields {}. */
function readPanelPreferences() {
	try {
		const raw = window.localStorage.getItem(PREFERENCES_KEY);
		if (raw === null) return {};
		const parsed = JSON.parse(raw);
		return parsed !== null && typeof parsed === "object" ? parsed : {};
	} catch {
		return {};
	}
}
/** Persist one preference, merging into whatever is already stored. */
function writePanelPreference(key, value) {
	try {
		const next = { ...readPanelPreferences(), [key]: value };
		window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(next));
	} catch {
		/* private mode or a full quota: the choice just will not be remembered */
	}
}
/** Credits auto-refresh cadence, in milliseconds. */
const CREDITS_REFRESH_MS = 30000;
/** Live request stats are cheap and memory-only, so they can update quickly. */
const POOL_STATS_REFRESH_MS = 4000;
/** Per-account daily check-in: one named account, or every account at once. */
const WORKBUDDY_POOL_CHECKIN_PATH = "/plugins/dsh-connect-workbuddy/pool/checkin";
/** Add account: mint a device-authorization link on the host, then poll it. */
const WORKBUDDY_LOGIN_START_PATH = "/plugins/dsh-connect-workbuddy/login/start";
const WORKBUDDY_LOGIN_POLL_PATH = "/plugins/dsh-connect-workbuddy/login/poll";
/** The sign-in round trip happens in a browser tab, so poll on a slow cadence. */
const LOGIN_POLL_MS = 3000;
/**
* When a cooling account comes back, as a clock time rather than a countdown:
* the panel sits open for minutes at a time, so "冷却至 15:36" stays true while
* "还有 12 分钟" silently rots. Today shows the clock alone, later days add the
* date so a 24h allowance reset is not mistaken for this afternoon.
*/
function formatSidebarCooling(untilMs, now = Date.now()) {
	if (typeof untilMs !== "number" || !Number.isFinite(untilMs) || untilMs <= now) return void 0;
	const at = new Date(untilMs);
	const pad = (value) => String(value).padStart(2, "0");
	const clock = `${pad(at.getHours())}:${pad(at.getMinutes())}`;
	const sameDay = at.getFullYear() === new Date(now).getFullYear() && at.getMonth() === new Date(now).getMonth() && at.getDate() === new Date(now).getDate();
	return sameDay ? clock : `${pad(at.getMonth() + 1)}/${pad(at.getDate())} ${clock}`;
}
/** Absolute token expiry for an account row, e.g. `2026/10/29 07:26`. */
function formatSidebarTokenExpiry(value) {
	if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return void 0;
	const at = new Date(value);
	const pad = (number) => String(number).padStart(2, "0");
	return `${at.getFullYear()}/${pad(at.getMonth() + 1)}/${pad(at.getDate())} ${pad(at.getHours())}:${pad(at.getMinutes())}`;
}
/** Human age for the most recent successful model call. */
function formatSidebarLastSuccess(value, now = Date.now()) {
	if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) return void 0;
	const age = Math.max(0, now - value);
	if (age < 6e4) return "刚刚";
	if (age < 36e5) return `${Math.max(1, Math.round(age / 6e4))} 分钟前`;
	if (age < 864e5) return `${Math.max(1, Math.round(age / 36e5))} 小时前`;
	const at = new Date(value);
	const pad = (number) => String(number).padStart(2, "0");
	return `${pad(at.getMonth() + 1)}/${pad(at.getDate())} ${pad(at.getHours())}:${pad(at.getMinutes())}`;
}
/** Keep the stats map to finite, non-negative numbers before it reaches React. */
function normalizeSidebarPoolStats(raw) {
	const out = {};
	if (raw === null || typeof raw !== "object") return out;
	for (const [id, value] of Object.entries(raw)) {
		if (typeof id !== "string" || id === "" || value === null || typeof value !== "object") continue;
		const number = (key) => typeof value[key] === "number" && Number.isFinite(value[key]) && value[key] >= 0 ? value[key] : 0;
		const lastSuccessAt = number("lastSuccessAt");
		out[id] = {
			total: number("total"),
			successes: number("successes"),
			failures: number("failures"),
			inFlight: number("inFlight"),
			...lastSuccessAt === 0 ? {} : { lastSuccessAt }
		};
	}
	return out;
}
/**
* Composite key for a pooled account.
*
* The pool now aggregates both providers, so an account id alone is no longer
* unique enough: the same WorkBuddy login can exist in CN and global with the
* same derived id. Keying by region + id keeps their credits, stats and limits
* apart without changing the host routes.
*/
function sidebarPoolKey(region, accountId) {
	return `${region}\u0000${accountId}`;
}
/**
* Merge several regions' pool totals into one readout.
*
* Counts and token sums add up. The two averages are weighted - first-token by
* call count, speed by tokens generated - because a plain mean of means would
* let a barely-used region skew the headline.
*/
function mergeSidebarPoolTotals(list) {
	let calls = 0;
	let totalTokens = 0;
	let firstTokenWeighted = 0;
	let firstTokenWeight = 0;
	let speedWeighted = 0;
	let speedWeight = 0;
	for (const totals of list) {
		if (totals === null || typeof totals !== "object") continue;
		if (typeof totals.calls === "number" && Number.isFinite(totals.calls)) calls += totals.calls;
		if (typeof totals.totalTokens === "number" && Number.isFinite(totals.totalTokens)) totalTokens += totals.totalTokens;
		if (typeof totals.firstTokenMs === "number" && totals.firstTokenMs > 0 && typeof totals.calls === "number" && totals.calls > 0) {
			firstTokenWeighted += totals.firstTokenMs * totals.calls;
			firstTokenWeight += totals.calls;
		}
		if (typeof totals.tokensPerSecond === "number" && totals.tokensPerSecond > 0 && typeof totals.totalTokens === "number" && totals.totalTokens > 0) {
			speedWeighted += totals.tokensPerSecond * totals.totalTokens;
			speedWeight += totals.totalTokens;
		}
	}
	return {
		calls,
		...firstTokenWeight === 0 ? {} : { firstTokenMs: Math.round(firstTokenWeighted / firstTokenWeight) },
		...speedWeight === 0 ? {} : { tokensPerSecond: Math.round(speedWeighted / speedWeight * 10) / 10 },
		...totalTokens === 0 ? {} : { totalTokens }
	};
}
/** Model-scoped limits, keyed account -> model, before they reach React. */
function normalizeSidebarPoolModelHealth(raw) {
	const out = {};
	if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return out;
	for (const [accountId, accountValue] of Object.entries(raw)) {
		if (typeof accountId !== "string" || accountId === "" || accountValue === null || typeof accountValue !== "object" || Array.isArray(accountValue)) continue;
		const models = {};
		for (const [modelId, value] of Object.entries(accountValue)) {
			if (typeof modelId !== "string" || modelId === "" || value === null || typeof value !== "object" || Array.isArray(value)) continue;
			const until = typeof value.until === "number" && Number.isFinite(value.until) && value.until > 0 ? value.until : 0;
			if (until === 0) continue;
			models[modelId] = {
				kind: typeof value.kind === "string" ? value.kind : "rate",
				until,
				...typeof value.reason === "string" && value.reason !== "" ? { reason: value.reason } : {}
			};
		}
		if (Object.keys(models).length > 0) out[accountId] = models;
	}
	return out;
}
/**
* How much room the host's floating composer needs at the bottom of the tab.
*
* Measured from the composer itself rather than hard-coded: the dock grows and
* shrinks with the thinking-level row, the slider and the token readout, and a
* fixed number that clears it today sits on top of it tomorrow. Walks up from
* the send button to the dock root - the highest ancestor still anchored to the
* window bottom - and leaves a margin for the toolbar row above it.
*/
function workBuddyDockClearance() {
	const FALLBACK = 200;
	try {
		const byLabel = document.querySelector("button[aria-label*=\"发送消息\"],button[aria-label*=\"发送\"],button[aria-label*=\"Send\"],button[aria-label*=\"send\"]");
		let send = byLabel;
		if (send === null) {
			/**
			* The composer's send control is the last match in DOM order; the label may
			* live in its text rather than an aria attribute, so match either.
			*/
			const candidates = document.querySelectorAll("button,[role=\"button\"]");
			for (let index = candidates.length - 1; index >= 0; index -= 1) {
				const node = candidates[index];
				const label = `${node.getAttribute("aria-label") ?? ""} ${node.getAttribute("title") ?? ""} ${node.textContent ?? ""}`;
				if (/发送|Send/i.test(label)) {
					send = node;
					break;
				}
			}
		}
		if (send === null) return FALLBACK;
		let node = send;
		while (node.parentElement !== null) {
			const parentRect = node.parentElement.getBoundingClientRect();
			if (parentRect.height > window.innerHeight * 0.6) break;
			node = node.parentElement;
		}
		const rect = node.getBoundingClientRect();
		if (!(rect.height > 0)) return FALLBACK;
		const needed = Math.round(window.innerHeight - rect.top) + 56;
		return Math.min(460, Math.max(140, needed));
	} catch (error) {
		return FALLBACK;
	}
}
		const WORKBUDDY_SIDEBAR_REGIONS = [
			{
				id: "cn",
				provider: "workbuddy",
				label: "国内版"
			},
			{
				id: "global",
				provider: "workbuddy-global",
				label: "国际版"
			}
		];
		/** Map a panel region id to the host provider route it addresses. */
		function workBuddySidebarProvider(region) {
			return (WORKBUDDY_SIDEBAR_REGIONS.find((entry) => entry.id === region) ?? WORKBUDDY_SIDEBAR_REGIONS[0]).provider;
		}
		/**
		* The sidebar panel: provider switch, account recheck, check-in, both credit
		* figures, model refresh, and model selection for one WorkBuddy provider.
		*
		* Every provider switch clears the previous provider's data before anything
		* new is fetched, so the two providers' accounts and credits never render
		* together. Every request disables its own control, and every failure lands
		* in a visible message rather than leaving the panel blank.
		*/
		function WorkBuddySidebar({ wide, t, useSessions, modelDirectories, settingsScope, region: regionProp, mode, sessionId }) {
			const copy = t ?? ((key) => WORKBUDDY_SIDEBAR_ZH[key] ?? key);
			const storedSession = useSessions((state) => state.current);
			/**
			* The main-area view is handed its own session id; the sidebar popover has
			* none and must read the live store instead. Preferring the prop is what
			* makes "使用" work from the tab: reading only the store left it undefined
			* there, so activation failed with "请先打开一个会话" even with a session open.
			*/
			const currentSession = typeof sessionId === "string" && sessionId !== "" ? sessionId : storedSession;
			const [open, setOpen] = (0, react.useState)(false);
			/** Main-area variant: no trigger, always expanded, sized by the view slot. */
			const isView = mode === "view";
			/**
			* Saved UI preferences, read once at mount.
			*
			* `regionProp` still wins when the host supplies one, because that is an
			* explicit instruction for this mount; otherwise the user's last choice is
			* restored. Without this the panel reverted to 国内版 on every remount.
			*/
			const savedPrefs = (0, react.useCallback)(readPanelPreferences, [])();
			const [region, setRegion] = (0, react.useState)(regionProp ?? (savedPrefs.region === "global" || savedPrefs.region === "cn" ? savedPrefs.region : "cn"));
			/** Set a preference and remember it, so it survives remount and reload. */
			const remember = (key, value) => writePanelPreference(key, value);
			/* seed every one of these from the module cache: a remount (the user
			   switching back from 对话) then paints the last real figures at once
			   instead of an empty shell that reads as "未登录 / 0 个账号" */
			const [status, setStatus] = (0, react.useState)(WORKBUDDY_PANEL_CACHE.status);
			const [busy, setBusy] = (0, react.useState)("");
			const [error, setError] = (0, react.useState)(void 0);
			const [groups, setGroups] = (0, react.useState)([]);
			const [failures, setFailures] = (0, react.useState)([]);
			/** Models this provider actually returned from the upstream, in that order. */
			const [fetched, setFetched] = (0, react.useState)(WORKBUDDY_PANEL_CACHE.fetched);
			/** Ids the provider currently serves as routable, so selection can enable one. */
			const [enabledIds, setEnabledIds] = (0, react.useState)(WORKBUDDY_PANEL_CACHE.enabledIds);
			/**
			* Accounts the current provider's store can see, in host order. The pool is
			* a projection of credential files, so this list is the pool.
			*/
			const [accounts, setAccounts] = (0, react.useState)(WORKBUDDY_PANEL_CACHE.accounts);
			/** Each pooled account's own credits, keyed by account id. */
			const [poolCredits, setPoolCredits] = (0, react.useState)(WORKBUDDY_PANEL_CACHE.poolCredits);
			/** Live model-call stats per account: rate, in-flight count, last success. */
			const [poolStats, setPoolStats] = (0, react.useState)(WORKBUDDY_PANEL_CACHE.poolStats);
			/** Region rollup under the pool summary: calls, latency, speed, tokens. */
			const [poolTotals, setPoolTotals] = (0, react.useState)(WORKBUDDY_PANEL_CACHE.poolTotals);
			/** Per-model upstream limits, kept apart from account-wide cooling. */
			const [poolModelHealth, setPoolModelHealth] = (0, react.useState)(WORKBUDDY_PANEL_CACHE.poolModelHealth);
			/** Which surface of this tab is showing: the account pool or usage. */
			const [tab, setTab] = (0, react.useState)(savedPrefs.tab === "usage" ? "usage" : "pool");
			/** Aggregated usage for the selected window, empty until first load. */
			const [usageStats, setUsageStats] = (0, react.useState)(() => WORKBUDDY_PANEL_CACHE.usageStats ?? normalizeSidebarUsage(void 0));
			const [usageRange, setUsageRange] = (0, react.useState)(WORKBUDDY_USAGE_RANGES.includes(savedPrefs.usageRange) ? savedPrefs.usageRange : "3d");
			const [usageBusy, setUsageBusy] = (0, react.useState)(false);
			const [usageError, setUsageError] = (0, react.useState)(void 0);
			const [poolHealth, setPoolHealth] = (0, react.useState)(WORKBUDDY_PANEL_CACHE.poolHealth);
			const [poolCheckin, setPoolCheckin] = (0, react.useState)(WORKBUDDY_PANEL_CACHE.poolCheckin);
			const [poolDetails, setPoolDetails] = (0, react.useState)(WORKBUDDY_PANEL_CACHE.poolDetails);
			const [checkinOneBusy, setCheckinOneBusy] = (0, react.useState)("");
			const [checkinAllBusy, setCheckinAllBusy] = (0, react.useState)(false);
			const [creditsError, setCreditsError] = (0, react.useState)(void 0);
			/** Name visibility is a display preference; remembered across reloads. */
			const [hideNames, setHideNames] = (0, react.useState)(() => {
				try {
					return window.localStorage.getItem(NAMES_HIDDEN_KEY) === "1";
				} catch {
					return false;
				}
			});
			/** Add-account flow: a sign-in step plus its own error surface. */
			const [addOpen, setAddOpen] = (0, react.useState)(false);
			const [addError, setAddError] = (0, react.useState)(void 0);
			/** idle -> starting -> waiting -> done; the link is live while waiting. */
			const [addPhase, setAddPhase] = (0, react.useState)("idle");
			const [addLink, setAddLink] = (0, react.useState)(void 0);
			const [addState, setAddState] = (0, react.useState)(void 0);
			const [addName, setAddName] = (0, react.useState)(void 0);
			const [addCopied, setAddCopied] = (0, react.useState)(false);
			/** Model ids allowed to receive images, per provider (never shared). */
			const [imageIds, setImageIds] = (0, react.useState)(WORKBUDDY_PANEL_CACHE.imageIds);
			/** Per-model context budget choices, per provider. */
			const [contextBudgets, setContextBudgets] = (0, react.useState)({});
			const [selected, setSelected] = (0, react.useState)(void 0);
			const mounted = (0, react.useRef)(true);
			/** Wraps the trigger and the panel; an outside press closes the panel. */
			const layerRef = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				mounted.current = true;
				return () => {
					mounted.current = false;
				};
			}, []);
			/**
			* Collapse the panel when a press lands outside it.
			*
			* The listener is capture-phase and mounted only while open, so any
			* interaction inside the layer (trigger or panel body) is ignored and the
			* panel's own controls keep working; the trigger keeps toggling itself.
			*/
			(0, react.useEffect)(() => {
				if (!open) return;
				const onPress = (event) => {
					const layer = layerRef.current;
					if (layer !== null && layer.contains(event.target)) return;
					setOpen(false);
				};
				document.addEventListener("pointerdown", onPress, true);
				return () => document.removeEventListener("pointerdown", onPress, true);
			}, [open]);
			const provider = workBuddySidebarProvider(region);
			/** Read this region's usage document (account, credits, check-in, models). */
			const loadUsage = (0, react.useCallback)(async (target) => {
				/**
				* `fast=1` asks the host for the local half only (account, models,
				* enabled sets). That answers without an upstream round trip, so a
				* provider switch can paint at once; the caller then refreshes the
				* slower credits/check-in fields in the background.
				*/
				const response = await fetch(`${withWorkBuddyRegion(WORKBUDDY_USAGE_PATH, target)}&fast=1`, {
					headers: { accept: "application/json" },
					credentials: "same-origin"
				});
				const body = await response.json().catch(() => void 0);
				if (!response.ok) throw new Error(body?.error ?? `HTTP ${response.status}`);
				return body;
			}, []);
			/** Re-read usage and the platform model directory for this region. */
			/**
			* The two upstream-backed summary fields (积分卡: 总积分 / 签到积分).
			*
			* Split out because the 积分 card DOES read `status.credits` and
			* `status.checkin`, so the fast half alone would leave them as "—". This
			* merges only those two fields, letting everything else paint without
			* waiting for the upstream round trip.
			*/
			const loadUsageSummary = (0, react.useCallback)(async (target) => {
				const response = await fetch(withWorkBuddyRegion(WORKBUDDY_USAGE_PATH, target), {
					headers: { accept: "application/json" },
					credentials: "same-origin"
				});
				const body = await response.json().catch(() => void 0);
				if (!response.ok) throw new Error(body?.error ?? `HTTP ${response.status}`);
				return body;
			}, []);
			const reload = (0, react.useCallback)(async (target) => {
				/**
				* Fire the slow half AT THE SAME TIME as the fast half.
				*
				* Sequencing them (fast, then full) made the extras cost the panel a
				* second glance at the switch: measured 1614ms for the fast call because
				* it was queued behind the full one. Both are independent reads, so they
				* go out together and the full one only merges the two slow fields.
				*/
				/* credits ride alongside the two usage reads rather than queueing behind
				   them: this is the request that costs an upstream round trip, so it must
				   not also pay for the fast call's latency. Region is explicit so a switch
				   can never address the provider we just left. */
				/* the pool aggregates both providers; this refresh is not region-scoped */
				void loadPoolCredits();
				/* the 积分卡's two upstream-backed fields, fetched in parallel */
				const summaryPromise = loadUsageSummary(target).catch(() => void 0);
				/**
				* The advisory model directory loads INDEPENDENTLY of the panel data.
				*
				* These used to be joined with Promise.all, which meant the fast status
				* response (measured 60ms) sat unused until `directory.load()` finished -
				* that join, not the network, was why a switch stayed blank. The directory
				* is advisory: the panel's own model roster comes from the status
				* document, so nothing here needs to wait for it.
				*/
				void (async () => {
					if (currentSession === void 0 || modelDirectories === void 0) return;
					try {
						const directory = modelDirectories.directoryFor(currentSession);
						await directory.load();
						if (!mounted.current) return;
						const snapshot = directory.store.getSnapshot();
						setGroups(snapshot.groups);
						setFailures(snapshot.failures ?? []);
						setSelected(snapshot.current ?? void 0);
					} catch {
						/* the usage document still renders; the model list is advisory */
					}
				})();
				const usage = await loadUsage(target);
				if (!mounted.current) return;
				setStatus(usage);
				/**
				* Merge the slow fields AFTER the fast document is applied.
				*
				* `setStatus(usage)` above replaces the whole object, so merging earlier
				* (while the summary was still in flight) got overwritten and the 积分卡
				* fell back to "—". Awaiting here keeps the fast paint - the status is
				* already on screen - while the two extras fill in behind it.
				*/
				void summaryPromise.then((summary) => {
					if (!mounted.current || summary === null || typeof summary !== "object") return;
					const mergeInto = (previous) => ({
						...(previous ?? {}),
						...summary.credits === void 0 ? {} : { credits: summary.credits },
						...summary.creditsError === void 0 ? {} : { creditsError: summary.creditsError },
						...summary.checkin === void 0 ? {} : { checkin: summary.checkin },
						...summary.checkinError === void 0 ? {} : { checkinError: summary.checkinError }
					});
					setStatus(mergeInto);
					/* keep the cache in step, or a remount would paint "—" again */
					WORKBUDDY_PANEL_CACHE.status = mergeInto(WORKBUDDY_PANEL_CACHE.status);
				});
				WORKBUDDY_PANEL_CACHE.status = usage;
				/* `target`, not `region`: this callback is created once per render and the
				   closed-over `region` is still the OLD provider while a switch is in
				   flight, which is what let a credits request go to the previous region. */
				WORKBUDDY_PANEL_CACHE.region = target;
				WORKBUDDY_PANEL_CACHE.warm = true;
				// The provider's own fetched list is the source of truth for the
				// picker; the routable catalog is the subset already enabled.
				setFetched(Array.isArray(usage?.models) ? usage.models : []);
				setEnabledIds(Array.isArray(usage?.enabledModelIds) ? usage.enabledModelIds : []);
				setImageIds(Array.isArray(usage?.imageModelIds) ? usage.imageModelIds : []);
				WORKBUDDY_PANEL_CACHE.fetched = Array.isArray(usage?.models) ? usage.models : [];
				WORKBUDDY_PANEL_CACHE.enabledIds = Array.isArray(usage?.enabledModelIds) ? usage.enabledModelIds : [];
				WORKBUDDY_PANEL_CACHE.imageIds = Array.isArray(usage?.imageModelIds) ? usage.imageModelIds : [];
				// Context budgets are a settings value for this region, not a field of
				// the usage document (the settings card reads them the same way).
				const configuredRegions = settingsScope?.getSnapshot?.().value?.regions;
				const savedRegions = configuredRegions !== null && typeof configuredRegions === "object" ? configuredRegions : {};
				const savedBudgets = savedRegions[target]?.contextBudgets;
				setContextBudgets(savedBudgets !== null && typeof savedBudgets === "object" ? savedBudgets : {});
				/**
				* Deliberately no third read here.
				*
				* The switch now costs exactly two upstream-touching requests - the
				* per-account credits and the summary fields - and both are already in
				* flight above. Adding a "full status" fetch on top would duplicate
				* `fetchCredits` for a third time and slow the two that matter.
				*/
			}, [loadUsage, loadUsageSummary, currentSession, modelDirectories, settingsScope]);
			/** Switching providers clears the previous provider's data first. */
			(0, react.useEffect)(() => {
				/**
				* Only clear when the PROVIDER actually changes.
				*
				* This effect also runs on every remount (it depends on `open`), and
				* clearing there is what produced the empty "未登录 / 0 个账号" flash when
				* the user came back from the 对话 tab. The cache already holds the right
				* region's data, so a remount keeps it and just refreshes.
				*/
				/* the cache knows which provider its figures came from, and that survives
				   a remount - a per-component ref would not */
				const providerChanged = WORKBUDDY_PANEL_CACHE.region !== void 0 && WORKBUDDY_PANEL_CACHE.region !== region;
				if (providerChanged) {
					/* drop the other provider's cached figures too, so a remount cannot
					   paint them for the provider now selected */
					WORKBUDDY_PANEL_CACHE.status = void 0;
					WORKBUDDY_PANEL_CACHE.fetched = [];
					WORKBUDDY_PANEL_CACHE.enabledIds = [];
					WORKBUDDY_PANEL_CACHE.imageIds = [];
					/* the pool is cross-region now: its data stays put across a
					   model-region switch, only the model column changes */
					WORKBUDDY_PANEL_CACHE.usageStats = void 0;
					WORKBUDDY_PANEL_CACHE.region = region;
					setStatus(void 0);
					setGroups([]);
					setFailures([]);
					setFetched([]);
					setEnabledIds([]);
					setImageIds([]);
					/* usage is not region-scoped, but a provider switch resets the readout
					   so a stale window from the other provider never flashes */
					setUsageStats(normalizeSidebarUsage(void 0));
					setCreditsError(void 0);
					setContextBudgets({});
					setSelected(void 0);
					setError(void 0);
				}
				// Render whatever the platform directory already holds, then refresh
				// it; the advisory catalog must not leave the list blank meanwhile.
				if (currentSession !== void 0 && modelDirectories !== void 0) {
					try {
						const snapshot = modelDirectories.directoryFor(currentSession).store.getSnapshot();
						setGroups(snapshot.groups);
						setFailures(snapshot.failures ?? []);
						if (snapshot.current !== null) setSelected(snapshot.current);
					} catch {
						/* an unavailable directory falls through to the loaded state */
					}
				}
				reload(region).catch((err) => {
					if (mounted.current) setError(err instanceof Error ? err.message : copy("requestFailed"));
				});
			}, [
				open,
				region,
				reload,
				currentSession,
				modelDirectories
			]);
			/** Host routes answer with a JSON error body; surface it verbatim. */
			const post = async (path) => {
				const response = await fetch(withWorkBuddyRegion(path, region), {
					method: "POST",
					headers: { accept: "application/json" },
					credentials: "same-origin"
				});
				const body = await response.json().catch(() => void 0);
				if (!response.ok) throw new Error(body?.error ?? `HTTP ${response.status}`);
				return body;
			};
			/** Run one labelled action with its own busy state and error surface. */
			/**
			* Read one region's pool document. The pool route is per-region on the
			* host, so the aggregate below calls it once per provider.
			*/
			const fetchPoolRegion = async (forRegion) => {
				const response = await fetch(`${WORKBUDDY_POOL_CREDITS_PATH}?region=${forRegion}`, {
					headers: {
						accept: "application/json"
					},
					credentials: "same-origin"
				});
				const body = await response.json().catch(() => void 0);
				if (!response.ok) throw new Error(body?.error ?? `HTTP ${response.status}`);
				return body;
			};
			/**
			* Fold both providers' pool documents into one set of maps.
			*
			* Every map is keyed `region\u0000accountId`: the same login can appear
			* in CN and global, and their credits/stats/limits must not collide. The
			* returned account rows carry their own `region` so switching, check-in
			* and add-account can still address the right provider.
			*/
			const mergePoolPayloads = (payloads) => {
				const nextAccounts = [];
				const nextCredits = {};
				const nextStats = {};
				const nextHealth = {};
				const nextModelHealth = {};
				const nextCheckin = {};
				const nextDetails = {};
				const totalsList = [];
				for (const payload of payloads) {
					if (payload === null || typeof payload !== "object") continue;
					const forRegion = payload.region;
					const body = payload.body;
					if (body === null || typeof body !== "object") continue;
					for (const entry of Array.isArray(body.accounts) ? body.accounts : []) {
						if (typeof entry?.id !== "string") continue;
						const key = sidebarPoolKey(forRegion, entry.id);
						nextAccounts.push({
							...entry,
							id: key,
							accountId: entry.id,
							region: forRegion
						});
						nextCredits[key] = typeof entry.credits === "number" && Number.isFinite(entry.credits) ? entry.credits : void 0;
						const packages = Array.isArray(entry.packages) ? entry.packages.filter((pack) => pack !== null && typeof pack === "object") : [];
						const creditsTotal = typeof entry.creditsTotal === "number" && Number.isFinite(entry.creditsTotal) ? entry.creditsTotal : packages.reduce((sum, pack) => sum + (typeof pack.size === "number" && Number.isFinite(pack.size) ? pack.size : 0), 0);
						nextDetails[key] = {
							packages,
							creditsTotal
						};
						if (entry.checkin !== void 0) nextCheckin[key] = entry.checkin;
					}
					for (const [id, value] of Object.entries(normalizeSidebarPoolStats(body.stats))) nextStats[sidebarPoolKey(forRegion, id)] = value;
					for (const [id, value] of Object.entries(body.health !== null && typeof body.health === "object" ? body.health : {})) nextHealth[sidebarPoolKey(forRegion, id)] = value;
					for (const [id, value] of Object.entries(normalizeSidebarPoolModelHealth(body.modelHealth))) nextModelHealth[sidebarPoolKey(forRegion, id)] = value;
					totalsList.push(normalizeSidebarPoolTotals(body.totals));
				}
				return {
					accounts: nextAccounts,
					credits: nextCredits,
					stats: nextStats,
					health: nextHealth,
					modelHealth: nextModelHealth,
					checkin: nextCheckin,
					details: nextDetails,
					totals: mergeSidebarPoolTotals(totalsList)
				};
			};
			/**
			* Read every pooled account of BOTH providers. The pool is one shared
			* surface: the region switch above only changes the model list, never
			* which accounts are counted. A failure in one region still shows the
			* other; a total failure keeps the last good figures.
			*/
			const loadPoolCredits = (0, react.useCallback)(async (options) => {
				const quiet = options?.silent === true;
				try {
					const payloads = await Promise.all(WORKBUDDY_SIDEBAR_REGIONS.map(async (entry) => {
						try {
							return {
								region: entry.id,
								body: await fetchPoolRegion(entry.id)
							};
						} catch {
							return {
								region: entry.id,
								body: void 0
							};
						}
					}));
					if (!mounted.current) return;
					const merged = mergePoolPayloads(payloads);
					if (merged.accounts.length === 0 && payloads.every((payload) => payload.body === void 0)) throw new Error(copy("requestFailed"));
					setAccounts(merged.accounts);
					setPoolCredits(merged.credits);
					setPoolStats(merged.stats);
					setPoolTotals(merged.totals);
					setPoolDetails(merged.details);
					setPoolHealth(merged.health);
					setPoolModelHealth(merged.modelHealth);
					setPoolCheckin(merged.checkin);
					/* remember the last good figures so a remount after a tab switch paints
					   them immediately instead of an empty shell */
					WORKBUDDY_PANEL_CACHE.accounts = merged.accounts;
					WORKBUDDY_PANEL_CACHE.poolCredits = merged.credits;
					WORKBUDDY_PANEL_CACHE.poolStats = merged.stats;
					WORKBUDDY_PANEL_CACHE.poolTotals = merged.totals;
					WORKBUDDY_PANEL_CACHE.poolDetails = merged.details;
					WORKBUDDY_PANEL_CACHE.poolHealth = merged.health;
					WORKBUDDY_PANEL_CACHE.poolModelHealth = merged.modelHealth;
					WORKBUDDY_PANEL_CACHE.poolCheckin = merged.checkin;
					WORKBUDDY_PANEL_CACHE.warm = true;
					if (!quiet) setCreditsError(void 0);
				} catch (err) {
					if (!mounted.current) return;
					/**
					* A quiet tick keeps the last good figures and stays off the alert row:
					* the 30s cadence must never turn a transient upstream hiccup into
					* something the user has to read, and must never disable the controls.
					*/
					if (!quiet) setCreditsError(err instanceof Error ? err.message : copy("requestFailed"));
				}
			}, []);
			/** Memory-only live tick; failures leave the last good stats untouched. */
			const loadPoolStats = (0, react.useCallback)(async () => {
				try {
					const results = await Promise.all(WORKBUDDY_SIDEBAR_REGIONS.map(async (entry) => {
						try {
							const response = await fetch(`${WORKBUDDY_POOL_STATS_PATH}?region=${entry.id}`, {
								headers: {
									accept: "application/json"
								},
								credentials: "same-origin"
							});
							const body = await response.json().catch(() => void 0);
							return response.ok ? {
								region: entry.id,
								body
							} : {
								region: entry.id,
								body: void 0
							};
						} catch {
							return {
								region: entry.id,
								body: void 0
							};
						}
					}));
					if (!mounted.current) return;
					const stats = {};
					const modelHealth = {};
					const totalsList = [];
					for (const result of results) {
						if (result.body === void 0) continue;
						for (const [id, value] of Object.entries(normalizeSidebarPoolStats(result.body.stats))) stats[sidebarPoolKey(result.region, id)] = value;
						for (const [id, value] of Object.entries(normalizeSidebarPoolModelHealth(result.body.modelHealth))) modelHealth[sidebarPoolKey(result.region, id)] = value;
						totalsList.push(normalizeSidebarPoolTotals(result.body.totals));
					}
					setPoolStats(stats);
					setPoolTotals(mergeSidebarPoolTotals(totalsList));
					setPoolModelHealth(modelHealth);
					WORKBUDDY_PANEL_CACHE.poolStats = stats;
					WORKBUDDY_PANEL_CACHE.poolTotals = mergeSidebarPoolTotals(totalsList);
					WORKBUDDY_PANEL_CACHE.poolModelHealth = modelHealth;
					WORKBUDDY_PANEL_CACHE.warm = true;
				} catch {}
			}, []);
			/**
			* Read the aggregated usage window. Kept separate from the pool loaders
			* because it answers a different question and refreshes on its own
			* cadence; a failure surfaces as a row rather than blanking the tables.
			*/
			const loadUsageStats = (0, react.useCallback)(async (range) => {
				setUsageBusy(true);
				try {
					const response = await fetch(`${WORKBUDDY_USAGE_STATS_PATH}?range=${range}`, {
						headers: {
							accept: "application/json"
						},
						credentials: "same-origin"
					});
					const body = await response.json().catch(() => void 0);
					if (!response.ok) throw new Error(body?.error ?? `HTTP ${response.status}`);
					if (!mounted.current) return;
					setUsageStats(normalizeSidebarUsage(body));
					WORKBUDDY_PANEL_CACHE.usageStats = normalizeSidebarUsage(body);
					WORKBUDDY_PANEL_CACHE.warm = true;
					setUsageError(void 0);
				} catch (err) {
					if (mounted.current) setUsageError(err instanceof Error ? err.message : copy("requestFailed"));
				} finally {
					if (mounted.current) setUsageBusy(false);
				}
			}, []);
			/** Manual refresh: same readout, with the panel's busy state for feedback. */
			const refreshCredits = () => run("credits", () => loadPoolCredits());
			/**
			* Check in one named account, or every account in this region at once.
			* The busy flag is per subject, so one row working never freezes the rest.
			*/
			const checkinPool = async (account) => {
				const one = account !== void 0 && typeof account === "object" && typeof account.id === "string" && account.id !== "";
				/* each row knows its own provider: the pool shows both at once */
				const forRegion = one && typeof account.region === "string" ? account.region : "cn";
				const accountId = one ? account.accountId ?? account.id : void 0;
				if (one) setCheckinOneBusy(account.id);
				else setCheckinAllBusy(true);
				try {
					const response = await fetch(`${WORKBUDDY_POOL_CHECKIN_PATH}?region=${forRegion}`, {
						method: "POST",
						headers: {
							accept: "application/json",
							"content-type": "application/json"
						},
						credentials: "same-origin",
						body: JSON.stringify(one ? { accountId } : {})
					});
					const body = await response.json().catch(() => void 0);
					if (!response.ok) throw new Error(body?.error ?? `HTTP ${response.status}`);
					await loadPoolCredits({
						silent: true
					});
					await reload(forRegion).catch(() => {});
				} catch (err) {
					if (mounted.current) setCreditsError(err instanceof Error ? err.message : copy("requestFailed"));
				} finally {
					if (mounted.current) {
						if (one) setCheckinOneBusy("");
						else setCheckinAllBusy(false);
					}
				}
			};
			/**
			* Keep the tab clear of the host's floating composer. The dock is measured
			* from the live DOM and re-measured on resize, because its height changes
			* with the thinking row, the slider and the token readout - a hard-coded
			* clearance that fits today ends up under the input tomorrow.
			*/
			(0, react.useEffect)(() => {
				if (!isView) return void 0;
				const apply = () => {
					const node = document.querySelector(".dsm-wb-view-root");
					if (node === null) return;
					node.style.setProperty("--wb-view-clearance", `${workBuddyDockClearance()}px`);
				};
				apply();
				window.addEventListener("resize", apply);
				const timer = setInterval(apply, 2000);
				return () => {
					window.removeEventListener("resize", apply);
					clearInterval(timer);
				};
			}, [isView]);
			/**
			* Keep the figures fresh on a fixed cadence while the panel is open, and
			* skip the tick entirely when the page is hidden rather than polling blind.
			* The tick is silent on purpose: it must not raise the panel's busy state,
			* disable a button, or flash an error row while the user is working.
			*/
			(0, react.useEffect)(() => {
				if (!open && !isView) return void 0;
				const timer = setInterval(() => {
					if (document.visibilityState === "hidden") return;
					void loadPoolCredits({
						silent: true
					});
				}, CREDITS_REFRESH_MS);
				return () => clearInterval(timer);
			}, [open, isView, loadPoolCredits]);
			/**
			* Keep in-flight and last-success values current without touching the
			* upstream. Four seconds is enough to feel live while staying quiet.
			*/
			(0, react.useEffect)(() => {
				if (!open && !isView) return void 0;
				const timer = setInterval(() => {
					if (document.visibilityState === "hidden") return;
					void loadPoolStats();
				}, POOL_STATS_REFRESH_MS);
				return () => clearInterval(timer);
			}, [open, isView, loadPoolStats]);
			/**
			* Load usage when the usage surface becomes visible, and reload whenever the
			* window changes. Kept off the pool's cadences: this readout only matters
			* while it is on screen.
			*/
			(0, react.useEffect)(() => {
				if ((!open && !isView) || tab !== "usage") return void 0;
				void loadUsageStats(usageRange);
				return void 0;
			}, [open, isView, tab, usageRange, loadUsageStats]);
			/**
			* Make one pooled account the current one for this provider.
			*
			* Written through the same settings key the settings card uses
			* (`accounts[region]`), so both surfaces agree and no second store exists.
			* Only this region's entry is replaced, so the other provider's selection
			* is untouched.
			*/
			const switchAccount = (account) => run("account", async () => {
				if (settingsScope === void 0 || settingsScope.getSnapshot().writable !== true) throw new Error(copy("notWritable"));
				/* the pool aggregates both providers, so the row - not the model
				   region switch - decides which account slot is written */
				const forRegion = typeof account?.region === "string" ? account.region : region;
				const accountId = account?.accountId ?? account?.id;
				const configured = settingsScope.getSnapshot().value ?? {};
				const configuredAccounts = typeof configured.accounts === "object" && configured.accounts !== null ? configured.accounts : {};
				if (configuredAccounts[forRegion] === accountId) return;
				await settingsScope.set("accounts", {
					...configuredAccounts,
					[forRegion]: accountId
				});
			});
			/** Open the add-account form, always in its idle state. */
			const openAdd = () => {
				setAddError(void 0);
				setAddPhase("idle");
				setAddLink(void 0);
				setAddState(void 0);
				setAddName(void 0);
				setAddCopied(false);
				setAddOpen(true);
			};
			/**
			* Close the form. The host keeps its pending state, so re-opening can mint
			* a fresh link; the abandoned one simply expires upstream.
			*/
			const closeAdd = () => {
				setAddOpen(false);
				setAddPhase("idle");
				setAddLink(void 0);
				setAddState(void 0);
				setAddName(void 0);
				setAddCopied(false);
				setAddError(void 0);
			};
			/**
			* Add account, step 1: ask the host for a device-authorization link.
			*
			* The sign-in itself happens in the user's own browser session, so no
			* password or code ever passes through this panel; the host only holds
			* the pending state that step 2 collects the issued token from.
			*/
			const startAdd = async () => {
				setAddPhase("starting");
				setAddError(void 0);
				setAddCopied(false);
				try {
					const response = await fetch(withWorkBuddyRegion(WORKBUDDY_LOGIN_START_PATH, region), {
						method: "POST",
						headers: { accept: "application/json" },
						credentials: "same-origin"
					});
					const body = await response.json().catch(() => void 0);
					if (!response.ok) throw new Error(body?.error ?? `HTTP ${response.status}`);
					if (typeof body?.url !== "string" || typeof body?.state !== "string") throw new Error(`${copy("addErrHttp")}: HTTP ${response.status}`);
					if (!mounted.current) return;
					setAddLink(body.url);
					setAddState(body.state);
					setAddPhase("waiting");
				} catch (err) {
					if (!mounted.current) return;
					setAddPhase("idle");
					setAddError(err instanceof Error ? err.message : copy("requestFailed"));
				}
			};
			/** The link is also plain text, so a blocked popup is never a dead end. */
			const openAddLink = () => {
				if (typeof addLink !== "string") return;
				window.open(addLink, "_blank", "noopener,noreferrer");
			};
			const copyAddLink = async () => {
				if (typeof addLink !== "string") return;
				try {
					await navigator.clipboard.writeText(addLink);
					if (mounted.current) setAddCopied(true);
				} catch {
					if (mounted.current) setAddError(copy("addCopyFailed"));
				}
			};
			/**
			* Add account, step 2: while the link is open, ask the host whether the
			* sign-in finished. The host owns the pending state, so the flow survives
			* a panel reload; the timer stops the moment the account lands.
			*/
			(0, react.useEffect)(() => {
				if (!addOpen || addPhase !== "waiting" || typeof addState !== "string") return void 0;
				let stopped = false;
				const tick = async () => {
					try {
						const response = await fetch(`${WORKBUDDY_LOGIN_POLL_PATH}?region=${region}&state=${encodeURIComponent(addState)}`, {
							headers: { accept: "application/json" },
							credentials: "same-origin"
						});
						const body = await response.json().catch(() => void 0);
						if (!response.ok) throw new Error(body?.error ?? `HTTP ${response.status}`);
						if (stopped || !mounted.current) return;
						if (body?.done !== true) return;
						setAddPhase("done");
						setAddName(typeof body?.account?.accountName === "string" ? body.account.accountName : void 0);
						window.setTimeout(() => {
							if (mounted.current) setAddOpen(false);
						}, 2400);
						await reload(region).catch(() => {});
					} catch (err) {
						if (stopped || !mounted.current) return;
						setAddPhase("idle");
						setAddError(err instanceof Error ? err.message : copy("requestFailed"));
					}
				};
				const timer = window.setInterval(() => {
					void tick();
				}, LOGIN_POLL_MS);
				void tick();
				return () => {
					stopped = true;
					window.clearInterval(timer);
				};
			}, [
				addOpen,
				addPhase,
				addState,
				region,
				reload
			]);
			const run = async (label, action) => {
				setBusy(label);
				setError(void 0);
				try {
					await action();
					await reload(region);
				} catch (err) {
					if (mounted.current) setError(err instanceof Error ? err.message : copy("requestFailed"));
				} finally {
					if (mounted.current) setBusy("");
				}
			};
			const rescan = () => run("rescan", async () => {
				const body = await post(WORKBUDDY_ACCOUNTS_REFRESH_PATH);
				if (!Array.isArray(body?.accounts)) throw new Error(`HTTP 200`);
				if (body.accounts.length === 0) throw new Error(copy("noAccount"));
			});
			const checkin = () => run("checkin", async () => {
				await post(WORKBUDDY_CHECKIN_PATH);
			});
			const refreshModels = () => run("models", async () => {
				const body = await post(WORKBUDDY_MODELS_REFRESH_PATH);
				if (!Array.isArray(body?.models)) throw new Error(`HTTP 200`);
			});
			/**
			* Merge one region's settings patch, preserving every sibling region.
			* Mirrors the settings card so both surfaces write the same shape.
			*/
			const patchRegion = async (patch) => {
				if (settingsScope === void 0 || settingsScope.getSnapshot().writable !== true) throw new Error(copy("notWritable"));
				const configured = settingsScope.getSnapshot().value ?? {};
				const regions = typeof configured.regions === "object" && configured.regions !== null ? configured.regions : {};
				const current = regions[region] ?? {};
				await settingsScope.set("regions", {
					...regions,
					[region]: {
						...current,
						...patch
					}
				});
			};
			/**
			* Toggle one model in this provider's enabled set.
			*
			* Multi-select by design: every checked model stays enabled and callable,
			* so unchecking one never clears the others. Selection is the settings
			* write itself — the host advertises exactly the enabled ids.
			*/
			const toggleModel = (modelId) => run("select", async () => {
				const current = Array.isArray(enabledIds) ? enabledIds : [];
				const next = current.includes(modelId) ? current.filter((id) => id !== modelId) : [...current, modelId];
				await patchRegion({ enabledModelIds: next });
				setEnabledIds(next);
				WORKBUDDY_PANEL_CACHE.enabledIds = next;
				// Keep the session's model routable: if the current session model was
				// just unchecked, fall back to a model that is still enabled.
				const stillEnabled = selected !== void 0 && next.includes(selected.model);
				if (!stillEnabled && next.length > 0 && currentSession !== void 0 && modelDirectories !== void 0) {
					await modelDirectories.directoryFor(currentSession).select({
						provider,
						model: next.includes(selected?.model) ? selected.model : next[0]
					});
				}
			});
			/** Toggle image input for one model (per provider, never shared). */
			const toggleImage = (modelId) => run("image", async () => {
				const current = Array.isArray(imageIds) ? imageIds : [];
				const next = current.includes(modelId) ? current.filter((id) => id !== modelId) : [...current, modelId];
				await patchRegion({ imageModelIds: next });
				setImageIds(next);
				WORKBUDDY_PANEL_CACHE.imageIds = next;
			});
			/**
			* Choose one model's context budget.
			*
			* Only models whose native window exceeds the 200K floor offer the pair,
			* matching the settings card's rule.
			*/
			const setContextBudget = (modelId, budget) => run("context", async () => {
				const next = {
					...contextBudgets,
					[modelId]: budget
				};
				await patchRegion({ contextBudgets: next });
				setContextBudgets(next);
			});
			/** Make one enabled model the session's active model. */
			const activateModel = (modelId) => run("activate", async () => {
				if (currentSession === void 0) throw new Error(copy("noSession"));
				if (modelDirectories === void 0) throw new Error(copy("requestFailed"));
				await modelDirectories.directoryFor(currentSession).select({
					provider,
					model: modelId
				});
			});
			const credits = status !== null && typeof status === "object" ? status.credits : void 0;
			const checkinState = status !== null && typeof status === "object" ? status.checkin : void 0;
			const totalCredit = typeof credits?.total === "number" && Number.isFinite(credits.total) ? credits.total : void 0;
			const checkinCredit = typeof checkinState?.todayCredit === "number" ? checkinState.todayCredit : typeof checkinState?.dailyCredit === "number" ? checkinState.dailyCredit : void 0;
			/** WorkBuddy Global has no daily check-in upstream, so its control is not offered. */
			const supportsCheckin = region === "cn";
			/** Check-in exists on CN only, so "all checked in" only counts CN rows. */
			const checkinCapableAccounts = accounts.filter((account) => account.region === "cn");
			const poolAllCheckedIn = checkinCapableAccounts.length > 0 && checkinCapableAccounts.every((account) => poolCheckin[account.id]?.todayCheckedIn === true);
			const poolCoolingCount = accounts.filter((account) => {
				const until = poolHealth[account.id]?.until;
				return typeof until === "number" && Number.isFinite(until) && until > Date.now();
			}).length;
			const poolAvailableCount = accounts.length - poolCoolingCount;
			const poolCreditSum = accounts.reduce((sum, account) => sum + (typeof poolCredits[account.id] === "number" && Number.isFinite(poolCredits[account.id]) ? poolCredits[account.id] : 0), 0);
			const poolCreditCapacity = accounts.reduce((sum, account) => sum + (typeof poolDetails[account.id]?.creditsTotal === "number" && Number.isFinite(poolDetails[account.id].creditsTotal) ? poolDetails[account.id].creditsTotal : 0), 0);
			/**
			* Credits that expire within the next three days, summed over the pool.
			*
			* The upstream packages carry an absolute expiry; a package with no expiry
			* is not counted. The window is inclusive of the current moment and uses
			* the account's remaining amount, which is what the user can still lose.
			*/
			const poolExpiring3dCutoff = Date.now() + 3 * 864e5;
			const poolExpiring3d = accounts.reduce((sum, account) => {
				const packages = poolDetails[account.id]?.packages;
				if (!Array.isArray(packages)) return sum;
				return sum + packages.reduce((subtotal, pack) => {
					const expiresAtMs = typeof pack?.expiresAtMs === "number" && Number.isFinite(pack.expiresAtMs) ? pack.expiresAtMs : 0;
					if (expiresAtMs <= 0 || expiresAtMs > poolExpiring3dCutoff) return subtotal;
					return subtotal + (typeof pack?.remain === "number" && Number.isFinite(pack.remain) && pack.remain > 0 ? pack.remain : 0);
				}, 0);
			}, 0);
			/**
			* The readout under the pool summary: what this region's own model calls
			* did. A figure only appears once something measured it - the host ships
			* absent, not zero, for a stream that reported nothing.
			*/
			const poolCallLabel = typeof poolTotals.calls === "number" ? String(poolTotals.calls) : "—";
			const poolFirstTokenLabel = formatSidebarLatency(poolTotals.firstTokenMs) ?? "—";
			const poolSpeedLabel = formatSidebarSpeed(poolTotals.tokensPerSecond) ?? "—";
			const poolTokensLabel = formatSidebarTokens(poolTotals.totalTokens) ?? "—";
			/* the model column belongs to the region switch; the pool is shared */
			const selectedPoolAccount = accounts.find((account) => account.region === region && account.selected === true) ?? accounts.find((account) => account.region === region);
			const selectedPoolDetail = selectedPoolAccount === void 0 ? void 0 : poolDetails[selectedPoolAccount.id];
			const selectedPackages = Array.isArray(selectedPoolDetail?.packages) ? [...selectedPoolDetail.packages].sort((left, right) => (Number.isFinite(right?.size) ? right.size : 0) - (Number.isFinite(left?.size) ? left.size : 0)) : [];
			const accountName = typeof status?.accountName === "string" ? status.accountName : typeof status?.nickname === "string" ? status.nickname : void 0;
			const signedIn = status?.status === "signed-in";
			const group = groups.find((entry) => entry.id === provider);
			/**
			* The picker shows what this provider actually fetched, in the upstream's
			* order; the routable catalog is only a fallback for a provider whose
			* status document carried no model list.
			*/
			const models = Array.isArray(fetched) && fetched.length > 0 ? fetched : Array.isArray(group?.models) ? group.models : [];
			/**
			* Checked models lead the list, unchecked follow.
			*
			* `filter` preserves the incoming order, so this is a stable partition: a
			* model only moves when its own checked state changes, the relative order
			* inside each segment stays the provider's order, and repeated renders
			* cannot reshuffle rows. It applies to whichever list is on screen,
			* including the cached one painted before the async load resolves.
			*/
			const enabledSet = new Set(Array.isArray(enabledIds) ? enabledIds : []);
			const orderedModels = models.filter((model) => enabledSet.has(model?.id)).concat(models.filter((model) => !enabledSet.has(model?.id)));
			/**
			* Why this provider shows no models: its own catalog failure if the host
			* reported one, otherwise the generic empty note. Never a blank list.
			*/
			const providerFailure = Array.isArray(failures) ? failures.find((entry) => entry?.id === provider)?.message : void 0;
			/**
			* Credit text shown on the collapsed entry itself. The total leads, with the
			* check-in figure beside it when the provider has one; a missing number
			* renders nothing rather than a placeholder, so the entry never grows a
			* meaningless dash.
			*/
			/**
			* The collapsed entry carries the current provider's TOTAL credits only —
			* one number, never the check-in/total pair (that pair lives in the panel).
			* When the figure is unavailable the pill degrades to a muted dash rather
			* than vanishing, so the row never looks broken or blank.
			*/
			const railCredit = totalCredit === void 0 ? copy("creditUnknown") : String(totalCredit);
			const railCreditKnown = totalCredit !== void 0;
			const trigger = /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "dsm-wb-side-trigger",
				"aria-expanded": open,
				"aria-label": railCredit === void 0 ? copy("entryTooltip") : `${copy("entryTooltip")} · ${copy("creditShort")} ${railCredit}`,
				title: railCredit === void 0 ? copy("entryTooltip") : `${copy("entryTooltip")} · ${copy("creditShort")} ${railCredit}`,
				onClick: () => setOpen((value) => !value),
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
						className: "dsm-wb-side-icon",
						src: WORKBUDDY_PLUGIN_ICON,
						alt: ""
					}),
					wide ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "dsm-wb-side-trigger-label",
						children: copy("entry")
					}) : null,
					/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "dsm-wb-side-credit-badge",
						"data-unknown": railCreditKnown ? void 0 : "true",
						"data-busy": busy !== "" ? "true" : void 0,
						"aria-live": "polite",
						children: railCredit
					}),
					wide ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
						className: "dsm-wb-side-chevron",
						"data-open": open ? "true" : void 0,
						children: "›"
					}) : null
				]
			});
			/**
			* One account overview followed by two detail cards. The provider,
			* credits, and pool blocks share one continuous surface instead of
			* reading as three unrelated cards. The model card owns a fixed grid
			* column, so it cannot inherit the full row width when space gets tight.
			*/
			/** The account-pool surface: provider, credits, pool, then the models column. */
			/** Which surface is showing: the account pool, or the usage readout. */
			const surfaceSwitch = /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: "dsm-wb-side-group dsm-wb-side-group-surfaces",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: "dsm-workbuddy-tabs dsm-wb-side-tabs-inline",
					role: "tablist",
					children: [
						["pool", copy("tabPool")],
						["usage", copy("tabUsage")]
					].map(([id, label]) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						role: "tab",
						className: tab === id ? "dsm-workbuddy-tab dsm-workbuddy-tab-active" : "dsm-workbuddy-tab",
						"aria-selected": tab === id,
						/* remembering this keeps the user on 用量 across a remount too */
						onClick: () => {
							remember("tab", id);
							setTab(id);
						},
						children: label
					}, id))
				})
			});
			/**
			* The usage surface: the four headline figures, an hourly token chart, and
			* the three breakdown tables. Everything is a plain div/table - no chart
			* library - so it stays within the panel's existing dependency set.
			*/
			const usageBody = /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dsm-wb-side-col dsm-wb-side-col-usage",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dsm-wb-side-group dsm-wb-side-group-usage",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dsm-wb-side-row",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "dsm-wb-side-label",
										children: copy("tabUsage")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "dsm-workbuddy-tabs dsm-wb-side-usage-ranges",
										children: [
											/* explicit keys: "all" must not be spelled "usageRangeall" */
											WORKBUDDY_USAGE_RANGES.map((range) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: usageRange === range ? "dsm-workbuddy-tab dsm-workbuddy-tab-active" : "dsm-workbuddy-tab",
												"aria-pressed": usageRange === range,
												onClick: () => {
													remember("usageRange", range);
													setUsageRange(range);
												},
												children: copy(WORKBUDDY_USAGE_RANGE_LABELS[range])
											}, range)),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												type: "button",
												className: "dsm-btn dsm-btn-outline",
												disabled: usageBusy,
												onClick: () => void loadUsageStats(usageRange),
												children: usageBusy ? copy("refreshing") : copy("usageRefresh")
											})
										]
									})
								]
							}),
							usageError === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dsm-wb-side-error",
								role: "alert",
								children: usageError
							}),
							/**
							* Headline figures. Order is deliberate: the four volume numbers
							* first, then 缓存命中, then the derived cost figures, and 失败尝试
							* LAST - a failure count is a footnote to the traffic, not a
							* headline, and putting it mid-row made it read as if the whole
							* window had gone wrong.
							*/
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dsm-wb-side-usage-totals",
								children: [
									[copy("usageRequests"), formatUsageCount(usageStats.totals.calls), false],
									[copy("usageTotalTokens"), formatUsageCount(usageStats.totals.totalTokens), false],
									[copy("usagePrompt"), formatUsageCount(usageStats.totals.promptTokens), false],
									[copy("usageCompletion"), formatUsageCount(usageStats.totals.completionTokens), false],
									/* token count, not a percentage: the share moved around with the
									   window and told the user less than the raw amount did */
									[copy("usageCacheHitRate"), formatUsageCount(usageStats.totals.cacheHitTokens), false],
									[copy("usageAvgLatency"), formatUsageLatency(usageStats.totals.avgLatencyMs), false],
									/* the headline this round was asked for: measured from real bills */
									[copy("usageTokensPerCredit"), formatUsageTokensPerCredit(usageStats.totals.tokensPerCredit), false],
									[copy("usageCreditsSpent"), formatUsageCredits(usageStats.totals.credits), false],
									[copy("usageFailures"), formatUsageCount(usageStats.totals.failures), usageStats.totals.failures > 0]
								].map(([label, value, warn], index) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: warn ? "dsm-wb-side-usage-total dsm-wb-side-usage-total-warn" : "dsm-wb-side-usage-total",
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: value }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: label })
									]
								}, `${label}-${index}`))
							}),
							usageStats.series.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dsm-wb-side-empty",
								children: copy("usageEmpty")
							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dsm-wb-side-chart",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "dsm-wb-side-chart-legend",
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: "dsm-wb-side-chart-prompt", children: copy("usagePrompt") }),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: "dsm-wb-side-chart-completion", children: copy("usageCompletion") })
										]
									}),
									/**
									* The plot: a gridline-and-tick chart, laid out like the reference.
									*
									* Y axis uses five ticks at max/4 steps so the top line IS the peak
									* bucket - a rounded ceiling would leave dead space above the tallest
									* column. Columns keep a fixed narrow width and are spread evenly,
									* so a sparse window reads as gaps rather than one solid block.
									*/
									/* @__PURE__ */ (() => {
										const peak = Math.max(...usageStats.series.map((point) => point.totalTokens), 1);
										const ticks = [0, 0.25, 0.5, 0.75, 1].map((share) => Math.round(peak * share));
										const pad = (value) => String(value).padStart(2, "0");
										let previousDay = "";
										/**
										* Dense windows (a 14-day view can hold 336 hourly buckets) must
										* still fit the panel: the fixed 4px gap alone would total more
										* than the available width and push the whole page sideways
										* (measured: panel 1404px -> 2929px scrollWidth). So the gap
										* collapses when the series is dense, and the x-axis stops
										* labelling every single bucket.
										*/
										const dense = usageStats.series.length > 60;
										const labelEvery = Math.max(1, Math.ceil(usageStats.series.length / 12));
										return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: "dsm-wb-side-chart-plot",
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
													className: "dsm-wb-side-chart-axis",
													children: [...ticks].reverse().map((tick) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
														children: formatUsageCount(tick)
													}, tick))
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
													className: "dsm-wb-side-chart-area",
													children: [
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
															className: "dsm-wb-side-chart-grid",
															"aria-hidden": "true",
															children: [...ticks].reverse().map((tick) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {}, tick))
														}),
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
															className: dense ? "dsm-wb-side-chart-cols dsm-wb-side-chart-cols-dense" : "dsm-wb-side-chart-cols",
															children: usageStats.series.map((point) => {
																const at = new Date(point.hour);
																const day = `${pad(at.getMonth() + 1)}/${pad(at.getDate())}`;
																/* the date is repeated only when the day changes, so a
																   multi-day window stays readable without clutter */
																const label = day === previousDay ? `${pad(at.getHours())}:00` : `${day} ${pad(at.getHours())}:00`;
																previousDay = day;
																const completionHeight = point.totalTokens === 0 ? 0 : point.completionTokens / point.totalTokens * 100;
																/* zero-token buckets get NO bar. The old Math.max(1, …) floor
																   drew a 2px stub that read as real traffic even though
																   nothing was billed that hour. */
																const barHeight = point.totalTokens === 0 ? 0 : Math.max(1, point.totalTokens / peak * 100);
																return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
																	className: "dsm-wb-side-chart-slot",
																	children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
																		className: "dsm-wb-side-chart-bar",
																		style: { height: `${barHeight}%` },
																		title: `${label} · ${formatUsageCount(point.totalTokens)} · ${point.calls} ${copy("usageColRequests")}`,
																		children: [
																			/* completion sits on top, prompt fills the rest below */
																			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																				className: "dsm-wb-side-chart-seg dsm-wb-side-chart-seg-completion",
																				style: { height: `${completionHeight}%` }
																			}),
																			/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																				className: "dsm-wb-side-chart-seg dsm-wb-side-chart-seg-prompt",
																				style: { height: `${100 - completionHeight}%` }
																			})
																		]
																	})
																}, point.hour);
															})
														})
													]
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
													className: "dsm-wb-side-chart-xaxis",
													"aria-hidden": "true",
													children: usageStats.series.map((point, index) => {
														const at = new Date(point.hour);
														/* Time only: "09/18 14:00" does not fit under a 34px column
														   and was being ellipsised to "09/18 ...". The date still
														   lives in each column's tooltip. */
														const isMidnight = at.getHours() === 0;
														/* dense windows label every Nth bucket (and always midnight, which
														   carries the date) so the ticks stay legible instead of
														   collapsing into a smear */
														const showLabel = !dense || isMidnight || index % labelEvery === 0;
														return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
															children: showLabel ? isMidnight ? `${pad(at.getMonth() + 1)}/${pad(at.getDate())}` : `${pad(at.getHours())}:00` : ""
														}, point.hour);
													})
												})
											]
										});
									})()
								]
							})
						]
					}),
					/* the three breakdown tables share one renderer */
					...[
						[copy("usageByAccount"), usageStats.accounts, "accountId"],
						[copy("usageByModel"), usageStats.models, "model"],
						[copy("usageByRegion"), usageStats.regions, "region"]
					].map(([title, rows, key]) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dsm-wb-side-group dsm-wb-side-group-usage-table",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dsm-wb-side-label",
								children: title
							}),
							rows.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dsm-wb-side-empty",
								children: copy("usageEmpty")
							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: "dsm-wb-side-usage-tablewrap",
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("table", {
									className: "dsm-wb-side-usage-table",
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("thead", {
											children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("tr", {
												children: [
													/* the realm table's first column IS the realm, so it must not
													   repeat it in a second column the way the others do */
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: key === "model" ? copy("usageColModel") : key === "region" ? copy("usageColRealm") : copy("account") }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: copy("usageColRequests") }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: copy("usageColPrompt") }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: copy("usageColCompletion") }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: copy("usageColTotal") }),
													/* raw cached-token count, same change as the headline row */
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: copy("usageCacheHitRate") }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: copy("usageColLatency") }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: copy("usageColSpeed") }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: copy("usageTokensPerCredit") }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: copy("usageCreditsSpent") }),
													/* failures last: a footnote, not a headline */
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("th", { children: copy("usageColFailures") })
												]
											})
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("tbody", {
											children: rows.map((row, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("tr", {
												children: [
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", {
														className: "dsm-wb-side-usage-name",
														title: row[key],
														children: row[key] === "" ? copy("acctUnknown") : row[key]
													}),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", { children: formatUsageCount(row.calls) }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", { children: formatUsageCount(row.promptTokens) }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", { children: formatUsageCount(row.completionTokens) }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", { children: formatUsageCount(row.totalTokens) }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", { children: formatUsageCount(row.cacheHitTokens) }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", { children: formatUsageLatency(row.avgLatencyMs) }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", { children: formatUsageSpeed(row.avgTokensPerSecond) }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", { children: formatUsageTokensPerCredit(row.tokensPerCredit) }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", { children: formatUsageCredits(row.credits) }),
													/* @__PURE__ */ (0, react_jsx_runtime.jsx)("td", { className: row.failures > 0 ? "dsm-wb-side-usage-warn" : void 0, children: row.failures === 0 ? "—" : formatUsageCount(row.failures) })
												]
											}, `${row[key]}-${index}`))
										})
									]
								})
							})
						]
					}, title))
				]
			});
			/** The account-pool surface: provider, credits, pool, then the model column. */
			const poolBody = [
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dsm-wb-side-col dsm-wb-side-col-summary",
				children: [
				/* account + rescan */
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "dsm-wb-side-group dsm-wb-side-group-credits",
					children: [
						/* credits header: refresh, and the name-visibility switch */
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dsm-wb-side-row",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dsm-wb-side-label",
									children: copy("poolCreditsLabel")
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: "dsm-wb-side-actions",
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
											className: "dsm-wb-switch",
											title: copy("hideNames"),
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
													type: "checkbox",
													checked: hideNames,
													onChange: (event) => {
														const next = event.target.checked;
														setHideNames(next);
														try {
															window.localStorage.setItem(NAMES_HIDDEN_KEY, next ? "1" : "0");
														} catch {}
													}
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													children: copy("hideNames")
												})
											]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: "dsm-btn dsm-btn-outline",
											disabled: busy !== "",
											onClick: refreshCredits,
											children: busy === "credits" ? copy("refreshingCredits") : copy("refreshCredits")
										})
									]
								})
							]
						}),
						creditsError === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dsm-wb-side-empty",
							children: `${copy("creditsFailed")}: ${creditsError}`
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dsm-wb-side-account",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dsm-wb-side-account-copy",
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
											className: "dsm-wb-side-account-name",
											/* the same name-visibility switch the pool rows honour:
											   hiding names must hide THIS one too, not just the rows */
											children: hideNames ? copy("nameHidden") : accountName ?? (signedIn ? copy("signedIn") : copy("signedOut"))
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: "dsm-wb-side-account-state",
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: "dsm-wb-side-dot",
													"data-state": signedIn ? "ok" : "off"
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													children: signedIn ? copy("signedIn") : copy("signedOut")
												})
											]
										})
									]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: "dsm-btn dsm-btn-outline",
									disabled: busy !== "",
									onClick: rescan,
									children: busy === "rescan" ? copy("rescanning") : copy("rescan")
								})
							]
						}),
						/* credits */
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dsm-wb-side-credits",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dsm-wb-side-credit",
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: "dsm-wb-side-credit-label",
											children: copy("checkinCredit")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", {
											className: "dsm-wb-side-credit-value",
											children: checkinCredit === void 0 ? "—" : String(checkinCredit)
										})
									]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dsm-wb-side-credit",
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: "dsm-wb-side-credit-label",
											children: copy("totalCredit")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", {
											className: "dsm-wb-side-credit-value",
											children: totalCredit === void 0 ? "—" : String(totalCredit)
										})
									]
								})
							]
						}),
						/* check-in (CN only) */
						!supportsCheckin ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "dsm-btn dsm-btn-primary dsm-wb-side-block",
							disabled: busy !== "" || !signedIn,
							onClick: checkin,
							children: busy === "checkin" ? copy("checkingIn") : checkinState?.todayCheckedIn === true ? copy("checkinDone") : copy("checkin")
						})
					]
				}),
				]
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dsm-wb-side-col dsm-wb-side-col-pool",
				children: [
				/* account pool: one row per account, current one marked */
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "dsm-wb-side-group dsm-wb-side-group-pool",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dsm-wb-side-row",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: "dsm-wb-side-label",
									children: [copy("pool"), " ", /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										className: "dsm-wb-side-count",
										children: [String(accounts.length), copy("poolUnit")]
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: "dsm-wb-side-actions",
									children: [
										checkinCapableAccounts.length === 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: "dsm-btn dsm-btn-outline dsm-wb-side-checkall",
											disabled: busy !== "" || checkinAllBusy || poolAllCheckedIn,
											title: copy("checkinAll"),
											onClick: () => checkinPool(),
											children: checkinAllBusy ? copy("checkinAllBusy") : poolAllCheckedIn ? copy("checkinAllDone") : copy("checkinAll")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: "dsm-btn dsm-btn-outline dsm-wb-side-add",
											"aria-expanded": addOpen,
											disabled: busy !== "",
											onClick: () => {
												if (addOpen) closeAdd();
												else openAdd();
											},
											children: copy("addAccount")
										}),
									]
								})
							]
						}),
						!signedIn && accounts.length === 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dsm-wb-side-pool-summary",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dsm-wb-side-pool-stat",
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: copy("poolStatAccounts") }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: String(accounts.length) })
									]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dsm-wb-side-pool-stat",
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: copy("poolStatAvailable") }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: String(poolAvailableCount) })
									]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dsm-wb-side-pool-stat",
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: copy("poolStatCooling") }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: String(poolCoolingCount) })
									]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dsm-wb-side-pool-stat dsm-wb-side-pool-stat-credits",
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: copy("creditShort") }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", {
											children: poolCreditCapacity > 0 ? `${formatSidebarCredits(poolCreditSum)} / ${formatSidebarCredits(poolCreditCapacity)}` : formatSidebarCredits(poolCreditSum)
										})
									]
								}),
								poolExpiring3d === 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dsm-wb-side-pool-stat dsm-wb-side-pool-stat-credits dsm-wb-side-pool-stat-expiring",
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: copy("poolExpiring3d") }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: formatSidebarCredits(poolExpiring3d) })
									]
								})
							]
						}),
						!signedIn && accounts.length === 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dsm-wb-side-pool-metrics",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: "dsm-wb-side-pool-metric",
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: copy("poolStatCalls") }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: poolCallLabel })
									]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: "dsm-wb-side-pool-metric",
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: copy("poolStatFirstToken") }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: poolFirstTokenLabel })
									]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: "dsm-wb-side-pool-metric",
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: copy("poolStatSpeed") }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: poolSpeedLabel })
									]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: "dsm-wb-side-pool-metric",
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: copy("poolStatTokens") }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: poolTokensLabel })
									]
								})
							]
						}),
						!addOpen ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dsm-wb-side-addform",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dsm-wb-side-addhint",
									children: copy("addHint")
								}),
								addPhase === "idle" || addPhase === "starting" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dsm-wb-side-addrow",
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: "dsm-btn dsm-btn-primary",
											disabled: addPhase === "starting",
											onClick: startAdd,
											children: addPhase === "starting" ? copy("addStarting") : copy("addStart")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: "dsm-btn dsm-btn-outline",
											disabled: addPhase === "starting",
											onClick: closeAdd,
											children: copy("addCancel")
										})
									]
								}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: "dsm-wb-side-addlink",
									children: [
										/* the raw URL stays selectable, so a blocked popup is recoverable */
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", {
											className: "dsm-wb-side-addurl",
											title: addLink,
											children: addLink
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: "dsm-wb-side-addrow",
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													type: "button",
													className: "dsm-btn dsm-btn-primary",
													onClick: openAddLink,
													children: copy("addOpen")
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													type: "button",
													className: "dsm-btn dsm-btn-outline",
													onClick: copyAddLink,
													children: addCopied ? copy("addCopied") : copy("addCopy")
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													type: "button",
													className: "dsm-btn dsm-btn-outline",
													onClick: closeAdd,
													children: addPhase === "done" ? copy("addClose") : copy("addCancel")
												})
											]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: addPhase === "done" ? "dsm-wb-side-addstatus dsm-wb-side-addstatus-on" : "dsm-wb-side-addstatus",
											children: addPhase === "done" ? `${copy("addDone")}${addName === void 0 ? "" : ` · ${addName}`}` : copy("addWaiting")
										})
									]
								}),
								addError === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dsm-wb-side-adderr",
									role: "alert",
									children: addError
								})
							]
						}),
						accounts.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dsm-wb-side-empty",
							children: signedIn ? copy("poolEmpty") : copy("signedOut")
						}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dsm-wb-side-accounts",
							children: accounts.map((account) => {
								const isCurrent = account.selected === true;
								const meta = [account.domain, !hideNames && typeof account.accountId === "string" ? account.accountId.slice(0, 8) : void 0].filter((part) => typeof part === "string" && part !== "").join(" \u00b7 ");
								const health = poolHealth[account.id];
								const coolingUntil = formatSidebarCooling(health?.until);
								const cooling = coolingUntil !== void 0;
								const modelLimited = Object.values(poolModelHealth[account.id] ?? {}).some((entry) => typeof entry?.until === "number" && Number.isFinite(entry.until) && entry.until > Date.now());
								const checkedInToday = poolCheckin[account.id]?.todayCheckedIn === true;
								const stats = poolStats[account.id];
								const completedCalls = (stats?.successes ?? 0) + (stats?.failures ?? 0);
								const successRate = completedCalls === 0 ? void 0 : Math.round((stats?.successes ?? 0) / completedCalls * 100);
								const inFlight = stats?.inFlight ?? 0;
								const lastSuccess = formatSidebarLastSuccess(stats?.lastSuccessAt);
								const tokenExpiry = formatSidebarTokenExpiry(account.tokenExpiresAtMs);
								return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: `dsm-wb-side-acct${isCurrent ? " dsm-wb-side-acct-on" : ""}${cooling ? " dsm-wb-side-acct-cool" : ""}`,
									"data-current": isCurrent ? "true" : void 0,
									"data-cooling": cooling ? "true" : void 0,
									"data-model-limited": modelLimited ? "true" : void 0,
									children: [
										/* the row is a container, not a button: an account needs its own
										   check-in control, and a button inside a button is invalid HTML */
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
											type: "button",
											className: "dsm-wb-side-acct-pick",
											"aria-pressed": isCurrent,
											disabled: busy !== "",
											title: isCurrent ? copy("acctCurrent") : copy("acctUse"),
											onClick: () => switchAccount(account),
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: "dsm-wb-side-acct-mark",
													"aria-hidden": "true",
													children: isCurrent ? "\u2713" : ""
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
													className: "dsm-wb-side-acct-copy",
													children: [
														hideNames ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
															className: "dsm-wb-side-acct-name",
															children: account.accountName ?? account.accountId ?? copy("acctUnknown")
														}),
														/* which provider this row belongs to; the pool is shared now */
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
															className: "dsm-wb-side-acct-region",
															children: account.region === "cn" ? "CN" : "AI"
														}),
														meta === "" ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
															className: "dsm-wb-side-acct-meta",
															children: meta
														}),
														tokenExpiry === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
															className: "dsm-wb-side-acct-token",
															children: `${copy("tokenExpires")} ${tokenExpiry}（${copy("tokenAutoRenew")}）`
														}),
														/* Live model-call health stays on the account row, where the
														   user makes the switching decision. */
														/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
															className: "dsm-wb-side-acct-metrics",
															children: [
																/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																	children: `${copy("acctSuccess")} ${successRate === void 0 ? "—" : `${successRate}%`}`
																}),
																/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																	children: completedCalls === 0 ? copy("acctNoCalls") : `${completedCalls} ${copy("acctCalls")}`
																}),
																/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																	children: `${copy("acctLastSuccess")} ${lastSuccess ?? "—"}`
																})
															]
														}),
														cooling ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
															className: "dsm-wb-side-acct-cooling",
															title: typeof health?.reason === "string" ? health.reason : copy("coolingHint"),
															children: [
																health?.kind === "credit" ? copy("totalCredit") : "",
																copy("coolingUntil"),
																" ",
																coolingUntil
															]
														}) : null
													]
												})
											]
										}),
										/* controls sit on their own line when the card is narrow,
										   instead of squeezing the account name to a stub */
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
											className: "dsm-wb-side-acct-side",
											children: [
												inFlight === 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
													className: "dsm-wb-side-status dsm-wb-side-status-live",
													children: [copy("acctInFlight"), " ", String(inFlight)]
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: cooling ? "dsm-wb-side-status dsm-wb-side-status-cool" : modelLimited ? "dsm-wb-side-status dsm-wb-side-status-model" : "dsm-wb-side-status",
													children: cooling ? copy("poolHealthCooling") : modelLimited ? copy("poolHealthModelLimited") : copy("poolHealthOk")
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: "dsm-wb-side-acct-credits",
													/* remaining over the account's own capacity: the same pair the
													   pool summary shows, so the two readouts agree */
													children: poolAccountCreditsLabel(poolCredits[account.id], poolDetails[account.id]?.creditsTotal),
													"data-credits": typeof poolCredits[account.id] === "number" ? String(poolCredits[account.id]) : void 0
												}),
												account.region !== "cn" ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													type: "button",
													className: "dsm-btn dsm-btn-outline dsm-wb-side-acct-check",
													disabled: busy !== "" || checkinOneBusy !== "" || checkedInToday,
													onClick: () => checkinPool(account),
													children: checkinOneBusy === account.id ? copy("checkinOneBusy") : checkedInToday ? copy("checkinOneDone") : copy("checkinOne")
												})
											]
										})
									]
								}, account.id);
							})
						}),
						selectedPackages.length === 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("details", {
							className: "dsm-wb-side-packages",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("summary", {
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: copy("poolPackages") }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: "dsm-wb-side-packages-count", children: String(selectedPackages.length) })
									]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "dsm-wb-side-packages-list",
									children: selectedPackages.map((pack, index) => {
										const expires = formatSidebarPackageDate(pack?.expiresAtMs);
										const cycle = formatSidebarPackageDate(pack?.cycleRefreshMs);
										const dateLabel = cycle === void 0 ? expires === void 0 ? void 0 : `${copy("packageExpires")} ${expires}` : `${copy("packageCycle")} ${cycle}`;
										return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: "dsm-wb-side-package",
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
													className: "dsm-wb-side-package-copy",
													children: [
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
															className: "dsm-wb-side-package-name",
															title: typeof pack?.packageName === "string" ? pack.packageName : void 0,
															children: typeof pack?.packageName === "string" && pack.packageName !== "" ? pack.packageName : copy("creditUnknown")
														}),
														dateLabel === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { className: "dsm-wb-side-package-date", children: dateLabel })
													]
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
													className: "dsm-wb-side-package-amount",
													children: [
														formatSidebarCredits(typeof pack?.remain === "number" ? pack.remain : void 0),
														" / ",
														formatSidebarCredits(typeof pack?.size === "number" ? pack.size : void 0)
													]
												})
											]
										}, `${pack?.packageName ?? "package"}-${index}`);
									})
								})
							]
						})
					]
				}),
				]
			}),
			/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dsm-wb-side-col dsm-wb-side-col-models",
				children: [
				/* models */
				/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: "dsm-wb-side-group dsm-wb-side-group-models",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dsm-wb-side-row",
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dsm-wb-side-label",
									children: copy("model")
								}),
								/* provider switch lives with the model list it changes */
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: "dsm-workbuddy-tabs dsm-wb-side-tabs-inline dsm-wb-side-model-region",
									children: WORKBUDDY_SIDEBAR_REGIONS.map((entry) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: entry.id === region ? "dsm-workbuddy-tab dsm-workbuddy-tab-active" : "dsm-workbuddy-tab",
										"aria-pressed": entry.id === region,
										disabled: busy !== "",
										onClick: () => {
											remember("region", entry.id);
											setRegion(entry.id);
										},
										children: entry.label
									}, entry.id))
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: "dsm-btn dsm-btn-outline",
									disabled: busy !== "",
									onClick: refreshModels,
									children: busy === "models" ? copy("refreshing") : copy("refreshModels")
								})
							]
						}),
						models.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dsm-wb-side-empty",
							children: providerFailure ?? copy("modelEmpty")
						}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: "dsm-wb-side-models",
							children: orderedModels.map((model) => {
								const isEnabled = enabledSet.has(model.id);
								const isActive = selected?.provider === provider && selected.model === model.id;
								const hasImage = (Array.isArray(imageIds) ? imageIds : []).includes(model.id);
								const native = typeof model.nativeContextWindow === "number" ? model.nativeContextWindow : model.contextWindow;
								const budget = contextBudgets[model.id] ?? 2e5;
								const busyNow = busy !== "";
								const reasoningTag = reasoningTagOf(model);
								const reasoningDefault = displayDefaultEffortOf(model);
								const modelHealth = selectedPoolAccount === void 0 ? void 0 : poolModelHealth[selectedPoolAccount.id]?.[model.id];
								const modelLimitUntil = formatSidebarCooling(modelHealth?.until);
								return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: isEnabled ? "dsm-wb-side-model dsm-wb-side-model-on" : "dsm-wb-side-model",
									"data-active": isActive ? "true" : void 0,
									children: [
										/* row head: enable checkbox + name */
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
											className: "dsm-wb-side-model-enabled",
											title: isEnabled ? copy("modelEnabledHint") : copy("modelEnable"),
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
													type: "checkbox",
													checked: isEnabled,
													disabled: busyNow,
													onChange: () => toggleModel(model.id)
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: "dsm-wb-side-model-name",
													children: model.name ?? model.id
												}),
												multiplierLabelOf(model) === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: "dsm-wb-side-model-rate",
													children: multiplierLabelOf(model)
												}),
												modelLimitUntil === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
													className: "dsm-wb-side-model-limit",
													children: copy("poolHealthModelLimited")
												})
											]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: "dsm-wb-side-model-controls",
											children: [
												/* image switch, per provider */
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
													className: "dsm-wb-side-model-image",
													title: copy("modelImage"),
													children: [
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
															type: "checkbox",
															checked: hasImage,
															disabled: busyNow,
															onChange: () => toggleImage(model.id)
														}),
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
															children: copy("modelImage")
														})
													]
												}),
												/* context budget pair, same rule as the card */
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("fieldset", {
													className: "dsm-wb-side-context",
													"aria-label": copy("contextBudget"),
													children: [
														native > 2e5 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
															children: [
																/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
																	type: "radio",
																	name: `ctx-${region}-${model.id}`,
																	checked: budget === 2e5,
																	disabled: busyNow,
																	onChange: () => setContextBudget(model.id, 2e5)
																}),
																/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																	children: copy("context200k")
																})
															]
														}) : null,
														/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
															children: [
																/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
																	type: "radio",
																	name: `ctx-${region}-${model.id}`,
																	checked: !(native > 2e5) || budget === native,
																	disabled: busyNow || !(native > 2e5),
																	onChange: () => setContextBudget(model.id, native)
																}),
																/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																	children: formatSidebarCapacity(native)
																})
															]
														})
													]
												}),
												/* activating one enabled model stays explicit */
												isEnabled ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													type: "button",
													className: isActive ? "dsm-wb-side-model-use dsm-wb-side-model-use-on" : "dsm-wb-side-model-use",
													disabled: busyNow || isActive,
													title: copy("modelUse"),
													onClick: () => activateModel(model.id),
													children: isActive ? "✓" : copy("modelUse")
												}) : null
											]
										}),
										/* Default effort, supported efforts, and output cap stay
										   with the model they describe, on one wrapping line. */
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: "dsm-wb-side-model-meta",
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
													children: [copy("modelDefault"), " ", reasoningDefault ?? "—"]
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
													children: [copy("modelEfforts"), " ", reasoningTag ?? "—"]
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
													children: [copy("modelContext"), " ", typeof model.nativeContextWindow === "number" && Number.isFinite(model.nativeContextWindow) ? formatSidebarCapacity(model.nativeContextWindow) : "—"]
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
													children: [copy("modelOutput"), " ", typeof model.maxTokens === "number" && Number.isFinite(model.maxTokens) ? formatSidebarCapacity(model.maxTokens) : "—"]
												}),
												modelLimitUntil === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
													className: "dsm-wb-side-model-limit-time",
													title: typeof modelHealth?.reason === "string" ? modelHealth.reason : copy("modelLimitHint"),
													children: [copy("modelLimitUntil"), " ", modelLimitUntil]
												})
											]
										})
									]
								}, model.id);
							})
						})
					]
				}),
				]
			}),
				error === void 0 ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: "dsm-wb-side-error",
					role: "alert",
					children: error
				})
			];
			/** The visible surface: the pool, or the usage readout. */
			const body = [
				/* keyed by surface so React remounts rather than reconciling two
				   different trees into each other when the tab flips */
				tab === "usage" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					key: "usage",
					className: "dsm-wb-side-body-usage-slot",
					children: usageBody
				}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					key: "pool",
					className: "dsm-wb-side-body-pool-slot",
					children: poolBody
				})
			];
			if (!open && !isView) {
				return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(WorkBuddySidebarBoundary, {
					label: copy("panelFailed"),
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						ref: layerRef,
						className: wide ? "dsm-wb-side-layer" : "dsm-wb-side-layer dsm-wb-side-rail",
						children: trigger
					})
				});
			}
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				ref: layerRef,
				className: isView ? "dsm-wb-view-root" : wide ? "dsm-wb-side-layer" : "dsm-wb-side-layer dsm-wb-side-rail",
				children: [isView ? null : trigger, /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: isView ? "dsm-wb-side-panel dsm-wb-view-panel" : "dsm-wb-side-panel",
					role: "dialog",
					"aria-label": copy("title"),
					children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dsm-wb-side-head",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
							className: "dsm-wb-side-icon",
							src: WORKBUDDY_PLUGIN_ICON,
							alt: ""
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dsm-wb-side-title",
							children: copy("title")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: "dsm-wb-side-collapse",
							title: copy("collapse"),
							"aria-label": copy("collapse"),
							onClick: () => setOpen(false),
							hidden: isView,
							children: "×"
						})]
					}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(WorkBuddySidebarBoundary, {
						label: copy("panelFailed"),
						children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: "dsm-wb-side-main",
							children: [
								/* the surface switch sits above the page grid: inside it, the
								   pool's own grid-row placement would fight the extra row */
								surfaceSwitch,
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: tab === "usage" ? "dsm-wb-side-body dsm-wb-side-body-usage" : "dsm-wb-side-body",
									children: body
								})
							]
						})
					})]
				})]
			});
		}
		/**
		* The same panel, rendered as a main-area view instead of the sidebar popover.
		* It is the identical component with `mode: "view"`: no trigger, always
		* expanded, sizing left to the view slot. One implementation, two shells -
		* so nothing can drift between them.
		*/
		function WorkBuddyView(props) {
			return react.createElement(WorkBuddySidebar, Object.assign({}, props, {
				mode: "view",
				wide: true
			}));
		}
		//#endregion
