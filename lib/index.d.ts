import z from "@deepseek-ai/schemastery";
import { PiAiAdapter } from "@deepseek-ai/dsh-llm-pi-ai";
import { Context } from "@deepseek-ai/cordis";
import { SettingsNamespace } from "@deepseek-ai/dsh-settings";
import { AttachmentStore } from "@deepseek-ai/dsh-attachment";
//#region src/auth.d.ts
/** Normalized WorkBuddy credential, timestamps in epoch milliseconds. */
interface WorkBuddyCredential {
  accessToken: string;
  refreshToken: string;
  expiresAtMs: number;
  refreshExpiresAtMs?: number;
  domain: string;
  uid: string;
  enterpriseId?: string;
  nickname?: string;
  uin?: string;
  /** Which auth file this came from; refreshes are always `dsh`. */
  source: 'desktop' | 'dsh';
  /** Absolute path of the auth file this credential was read from. */
  filePath: string;
  /**
   * Epoch ms the upstream last issued this token (`auth.lastRefreshTime`).
   *
   * This is the ONLY trustworthy freshness signal. `expiresAtMs` cannot be
   * used for ranking: when the upstream revokes a token it leaves the stored
   * `expiresAt` untouched, so a long-dead backup can claim a LATER expiry than
   * the live sign-in (observed on a real machine — a 2026-07-08 backup claimed
   * 2027-07-06 while the live file expired 2026-11-14, and only the live file
   * was accepted). Undefined when the document omits the field.
   */
  lastRefreshAtMs?: number;
}
/** Read-only sign-in summary for status and doctor output. */
interface WorkBuddyAuthStatus {
  state: 'signed-in' | 'signed-out';
  expiresAtMs?: number;
  refreshExpiresAtMs?: number;
  nickname?: string;
  domain?: string;
  source?: 'desktop' | 'dsh';
}
/** Constructor options; only {@link refresh} is required. */
interface WorkBuddyStoreOptions {
  /** Explicit desktop auth-file path, overriding env and platform defaults. */
  desktopPath?: string;
  /**
   * Explicit plugin-owned copy path, overriding the per-region default.
   * Injectable so the copy/refresh cycle is testable without a real machine.
   */
  ownPath?: string;
  /**
   * Region this store serves. When set, only credentials whose login domain
   * maps to this region are discovered, selected, or refreshed — the two
   * regions' stores run side by side without seeing each other's accounts.
   */
  region?: WorkBuddyRegion;
  /**
   * Legacy single-copy path read as a migration source; defaults to the
   * pre-dual-provider location. Injectable for tests.
   */
  legacyOwnPath?: string;
  /**
   * Auth directories to scan, overriding the platform defaults. Injectable so
   * the multi-account scan is testable without touching a real machine.
   */
  authDirs?: readonly string[];
  /** Performs the upstream token refresh. */
  refresh: (credential: WorkBuddyCredential) => Promise<WorkBuddyRefreshOutcome>;
  /** Refresh this long before actual expiry; default five minutes. */
  refreshMarginMs?: number;
}
/** One selectable local account, token-free. */
interface WorkBuddyAccountChoice {
  /** Stable id derived from `uin` (or `uid` when uin is absent). */
  id: string;
  accountName: string;
  uin?: string;
  domain: string;
  source: 'desktop' | 'dsh';
  tokenExpiresAtMs: number;
  /** The auth file this account was read from; newest is preferred. */
  filePath: string;
  selected: boolean;
}
/** Legacy single-copy basename (pre-dual-provider); kept as migration source. */
declare const WORKBUDDY_AUTH_FILENAME = ".workbuddy-auth.json";
/** Env variable that overrides the desktop auth-file location. */
declare const WORKBUDDY_AUTH_FILE_ENV = "WORKBUDDY_AUTH_FILE";
/**
 * Plugin-owned copy path for one region inside the Harness home. Each
 * region's store refreshes into its own file so two simultaneously signed-in
 * regions never overwrite each other's refreshed token.
 */
declare function workbuddyOwnAuthPath(region: WorkBuddyRegion): string;
/**
 * Pre-dual-provider single-copy path. Still read as a migration source (a
 * legacy credential serves the region it belongs to until that region's own
 * first refresh writes the per-region file), and removed by `logout`.
 */
declare function legacyWorkbuddyOwnAuthPath(): string;
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
declare function defaultDesktopAuthDirs(platform?: NodeJS.Platform, home?: string, env?: NodeJS.ProcessEnv): string[];
/** The live auth file's platform candidates, in probe order. */
declare function defaultDesktopAuthCandidates(): string[];
/** First platform-default candidate; see {@link defaultDesktopAuthCandidates}. */
declare function defaultDesktopAuthPath(): string | undefined;
/**
 * Parse a WorkBuddy auth document in either on-disk shape: the plugin OAuth
 * nested form `{"auth":{...},"account":{...}}` and the flat panel form.
 * Returns undefined when the document carries no access token.
 */
declare function parseWorkBuddyAuth(text: string, filePath: string): WorkBuddyCredential | undefined;
/**
 * Filename of a path regardless of the host separator: Windows paths use `\`
 * and this helper must keep working when a Windows path is compared on a
 * POSIX host (e.g. tests injecting a Windows-style auth dir).
 */
declare function authFileName(path: string): string;
/**
 * Stable account id. `uin` is the billing identity the upstream keys on and
 * survives across re-login; `uid` is the fallback for documents without one.
 */
declare function workbuddyAccountId(credential: Pick<WorkBuddyCredential, 'uin' | 'uid' | 'nickname'>): string;
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
declare class WorkBuddyCredentialStore {
  private readonly refresh;
  private readonly refreshMarginMs;
  private readonly region;
  private readonly ownPathExplicit;
  private readonly legacyOwnPath;
  private readonly legacyOwnPathExplicit;
  private readonly authDirs;
  private desktopPathOverride;
  private accountId;
  private inflight;
  constructor(options: WorkBuddyStoreOptions);
  /** Whether a credential's login domain belongs to this store's region. */
  private matchesRegion;
  /**
   * The path this store refreshes into: the per-region file for a
   * region-scoped store, the legacy single file otherwise, or an explicitly
   * injected path in tests.
   */
  ownAuthPath(): string;
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
  private ownCandidates;
  /** Repoint the desktop file or directory; applies on the next read. */
  setDesktopPath(path: string | undefined): void;
  /** Select an account by id; tokens stay outside settings. */
  selectAccount(accountId: string | undefined): void;
  /** Selected account id, for diagnostics and route assembly. */
  selectedAccountId(): string | undefined;
  /** The auth-file path candidates, in probe order. */
  private resolveDesktopCandidates;
  /** The resolved desktop auth-file path, for diagnostics. */
  desktopAuthPath(): string | undefined;
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
  private candidateFiles;
  /** Timestamped siblings of one auth file, newest first by filename. */
  private backupsBeside;
  /**
   * Read every local credential, deduplicated by account id. Files are
   * probed newest-first, so the first entry for an account is its freshest.
   *
   * A region-scoped store sees only its own region's credentials: the other
   * region's accounts are invisible to selection, refresh, and status alike,
   * which is what keeps the two regions' providers from cross-billing.
   */
  private readAll;
  /**
   * Default when no account is explicitly selected: the live sign-in, else the
   * freshest credential. Following the app's current sign-in is the documented
   * default behaviour; the backups exist so the user can switch explicitly.
   * This is NOT credit-seeking — it never reorders accounts to find one with
   * remaining credit.
   */
  private preferred;
  /** Token-free account list for the plugin card. */
  accounts(): Promise<WorkBuddyAccountChoice[]>;
  /** The freshest stored credential for the current selection, no refresh. */
  current(): Promise<WorkBuddyCredential | undefined>;
  /** The credential to send upstream: {@link current}, refreshed on demand. */
  resolve(): Promise<WorkBuddyCredential>;
  /** Read-only sign-in summary; never refreshes and never throws. */
  status(): Promise<WorkBuddyAuthStatus>;
  /**
   * Remove every plugin-owned copy this store could read (per-region file,
   * legacy single file, and their lock siblings); the desktop files are
   * untouched. A region store's logout therefore also clears the legacy
   * migration source — deliberate: `logout` is the user's "forget what the
   * plugin stored" action, not a per-account toggle.
   */
  logout(): Promise<void>;
  private needsRefresh;
  private refreshNow;
  private saveOwn;
  /**
   * Every readable plugin-owned copy, in candidate order; absent or corrupt
   * files are skipped rather than propagated.
   */
  private readOwns;
  /** Whether any candidate file exists as a regular file; diagnostics only. */
  desktopFilePresent(): Promise<boolean>;
}
//#endregion
//#region src/upstream.d.ts
/** WorkBuddy region selected by the credential's login domain. */
type WorkBuddyRegion = 'cn' | 'global';
/** Upstream failure classes the shim maps onto distinct HTTP answers. */
type UpstreamErrorKind = 'hard_credit' | 'soft_rate' | 'session_dead' | 'not_found' | 'server' | 'client';
/** Reasoning capability as the upstream catalog declares it. */
interface WorkBuddyReasoning {
  supportedEfforts?: readonly string[];
  defaultEffort?: string;
  canDisableThinking?: boolean;
}
/** One CLI-usable model, carrying everything the plugin card displays. */
interface WorkBuddyUpstreamModel {
  id: string;
  name: string;
  contextWindow: number;
  maxTokens: number;
  /** Credit multiplier parsed from the upstream `credits` string. */
  creditMultiplier?: number;
  /**
   * Image-input support decided by the user's explicit selection (imageModelIds),
   * not inferred from the upstream `supportsImages`/`disabledMultimodal` flags,
   * which proved insufficiently reliable. See `catalog.ts` / `index.ts`.
   */
  multimodal?: boolean;
  reasoning?: WorkBuddyReasoning;
  descriptionZh?: string;
  descriptionEn?: string;
  supportsToolCall?: boolean;
}
/** One billing package and its remaining credit, already aggregated. */
/** One billing package as the upstream returns it, dates already parsed. */
interface WorkBuddyCreditPackage {
  packageName: string;
  remain: number;
  size: number;
  /** CapacityType 4: refreshed every cycle and never expires. */
  monthly: boolean;
  /** Next cycle start (the monthly refresh point); only on monthly packages. */
  refreshAtMs?: number;
  /** One-off expiry; the package disappears from the account at this time. */
  expiresAtMs?: number;
}
/** Aggregated credit answer for one credential. */
interface WorkBuddyCredits {
  total: number;
  packages: readonly WorkBuddyCreditPackage[];
  /** Credits expiring within 3 days across every package. */
  expiringSoon: number;
  /** When the nearest package expires, in ms. */
  nearestExpiryMs?: number;
}
/** Daily check-in activity state. */
interface WorkBuddyCheckinStatus {
  active: boolean;
  todayCheckedIn: boolean;
  streakDays: number;
  dailyCredit: number;
  todayCredit: number;
  isStreakDay: boolean;
  nextStreakDay: number;
  streakBonusDays: number;
  streakBonusCredit: number;
  claimButtonText?: string;
}
/** Daily check-in claim result. */
interface WorkBuddyCheckinClaim {
  credit: number;
  streakDays: number;
  isStreakDay: boolean;
}
/** Token refresh answer; fields the upstream omits stay absent. */
interface WorkBuddyRefreshOutcome {
  accessToken: string;
  refreshToken?: string;
  expiresInSec?: number;
  domain?: string;
}
/** Chat answer: either a live SSE response or a classified failure. */
type WorkBuddyChatResult = {
  ok: true;
  response: Response;
} | {
  ok: false;
  status: number;
  kind: UpstreamErrorKind;
  message: string;
};
/** Classify an upstream failure from its HTTP status and body excerpt. */
declare function classifyUpstreamError(status: number, body: string): UpstreamErrorKind;
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
declare function regionOf(domain: string): WorkBuddyRegion;
/**
 * Normalize an OpenAI chat-completions body for the WorkBuddy upstream:
 * force `stream: true` (the upstream rejects non-streaming) and flatten
 * `tool_choice` (the upstream's field is a string; object forms return 400).
 */
declare function prepareChatBody(source: string): string;
/**
 * Parse the upstream's `credits` string into a multiplier.
 *
 * Observed forms: `"x0.79 credits"`, `"x0.05"`, `"x0.00 credits"`,
 * and absent. Unparsable values yield undefined rather than a guess — the
 * card simply omits the rate instead of displaying a fabricated one.
 */
declare function parseCreditMultiplier(value: unknown): number | undefined;
/** Parse the upstream's `reasoning` object; unknown shapes degrade to `{}`. */
declare function parseReasoning(value: unknown): WorkBuddyReasoning | undefined;
/** Parse one catalog entry; entries without usable token limits are dropped. */
declare function parseUpstreamModel(value: unknown): WorkBuddyUpstreamModel | undefined;
/**
 * Upstream HTTP client. One instance serves the whole plugin; requests take
 * the credential explicitly so token refreshes apply on the next call.
 */
declare class WorkBuddyUpstreamClient {
  /** POST the chat endpoint; a successful answer is the raw SSE response. */
  chatStream(credential: WorkBuddyCredential, bodyJson: string, signal?: AbortSignal): Promise<WorkBuddyChatResult>;
  /** POST the token-refresh endpoint; the caller merges the outcome. */
  refreshToken(credential: WorkBuddyCredential): Promise<WorkBuddyRefreshOutcome>;
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
  fetchModels(credential: WorkBuddyCredential, signal?: AbortSignal): Promise<readonly WorkBuddyUpstreamModel[]>;
  /** Query today's check-in status without changing account state. */
  fetchCheckinStatus(credential: WorkBuddyCredential): Promise<WorkBuddyCheckinStatus>;
  /** Claim today's check-in reward. The browser route guards this mutation. */
  claimDailyCheckin(credential: WorkBuddyCredential): Promise<WorkBuddyCheckinClaim>;
  /**
   * POST the billing endpoint for the remaining credit, keeping every package
   * separate: the card groups monthly-cycle packages itself and lists the
   * nearest-expiring one-off packages, so aggregation here would lose the
   * dates it needs.
   */
  fetchCredits(credential: WorkBuddyCredential): Promise<WorkBuddyCredits>;
}
//#endregion
//#region src/catalog.d.ts
/** One model entry the adapter exposes. */
type WorkBuddyModelInfo = WorkBuddyUpstreamModel;
/**
 * Static CLI models captured from the CN endpoint (2026-08-30). The upstream
 * refresh replaces this list at startup; it exists so the provider registers
 * with a usable catalog even while the first fetch is in flight or offline.
 */
declare const FALLBACK_WORKBUDDY_MODELS: readonly WorkBuddyModelInfo[];
/**
 * Static CLI models captured from the INTERNATIONAL gateway's desktop-channel
 * product config (`www.workbuddy.ai/v3/config`, 2026-09-11). The two regions
 * expose different rosters — the CN list has no `gpt-*`/`gemini-*` entries —
 * so a global account must never be seeded with the CN list. Like the CN
 * fallback this is replaced by the live refresh; it only keeps the provider
 * usable before the first fetch lands. Order and rates mirror the upstream.
 */
declare const FALLBACK_WORKBUDDY_MODELS_GLOBAL: readonly WorkBuddyModelInfo[];
/**
 * Static fallback directory for a region. Each region keeps its own model
 * slot in settings; the fallback must match the region so an account never
 * shows the other region's roster.
 */
declare function fallbackModelsFor(region: 'cn' | 'global'): readonly WorkBuddyModelInfo[];
/**
 * Derive the runtime catalog from the last-refreshed directory plus the
 * user's selection. This is the single source of truth for what DSH exposes,
 * so saving only the selection is enough to rebuild it after a restart.
 *
 * An empty selection falls back to the whole directory: a plugin that has
 * never been configured must still serve models rather than nothing.
 */
type WorkBuddyContextBudget = number;
declare function deriveCatalog(catalog: readonly WorkBuddyModelInfo[], enabled: ReadonlySet<string>, budgets?: Readonly<Record<string, WorkBuddyContextBudget | undefined>>): WorkBuddyModelInfo[];
/** Mutable catalog shared by the shim's `/v1/models` and the adapter. */
declare class WorkBuddyCatalog {
  private models;
  /**
   * @param region Seeds the static fallback for this region; each region's
   * provider must never serve the other region's roster before its first
   * live refresh lands.
   */
  constructor(region?: 'cn' | 'global');
  /** Current entries; the fallback list until the upstream answer lands. */
  current(): readonly WorkBuddyModelInfo[];
  /** Replace the list; callers invalidate their adapter snapshot after this. */
  set(models: readonly WorkBuddyModelInfo[]): void;
}
//#endregion
//#region src/shim.d.ts
/** Minimal logger surface the plugin context already provides. */
interface ShimLogger {
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
}
/** What the plugin needs from a running shim. */
interface WorkBuddyShim {
  /** Resolves once the listener is up; rejects if listening failed. */
  ready: Promise<void>;
  /** The shim origin, e.g. `http://127.0.0.1:39271`; valid after ready. */
  baseUrl(): string;
  /**
   * The per-process shared secret the plugin's own client must carry as
   * `Authorization: Bearer <token>`. Lives only in memory; the adapter
   * resolves this instead of the upstream access token, because the shim
   * resolves the real credential itself via the store.
   */
  token(): string;
  /** Stop serving and destroy open connections. */
  close(): Promise<void>;
}
/** Constructor dependencies. */
interface WorkBuddyShimOptions {
  store: WorkBuddyCredentialStore;
  client: Pick<WorkBuddyUpstreamClient, 'chatStream'>;
  catalog: WorkBuddyCatalog;
  logger?: ShimLogger;
}
/**
 * Start the loopback endpoint. Requests must carry the shim's shared secret;
 * the loopback bind alone is not a trust boundary.
 */
declare function createWorkBuddyShim(options: WorkBuddyShimOptions): WorkBuddyShim;
//#endregion
//#region src/adapter.d.ts
/** Provider route this bundle owns for the domestic (CN) gateway. */
declare const WORKBUDDY_PROVIDER = "workbuddy";
/** Provider route this bundle owns for the international gateway. */
declare const WORKBUDDY_GLOBAL_PROVIDER = "workbuddy-global";
/** The provider id each region registers as. */
declare const WORKBUDDY_PROVIDERS: Readonly<Record<WorkBuddyRegion, string>>;
/** Region a provider route id belongs to. */
declare function regionOfProvider(provider: string): WorkBuddyRegion | undefined;
/** Human-readable provider name, shown in the DSH model picker. */
declare const WORKBUDDY_PROVIDER_DISPLAY_NAMES: Readonly<Record<WorkBuddyRegion, string>>;
/** Provider idle ceiling while one stream read is outstanding. */
declare const WORKBUDDY_STREAM_IDLE_TIMEOUT_MS = 300000;
/** Constructor dependencies. */
interface WorkBuddyAdapterOptions {
  shim: WorkBuddyShim;
  store: WorkBuddyCredentialStore;
  catalog: WorkBuddyCatalog;
  /** Provider route id this instance serves; defaults to the CN route. */
  provider?: string;
  /** pi-ai provider name and profile display name; defaults to the CN name. */
  displayName?: string;
  /** Resolve the durable attachment service at request time, when present. */
  resolveAttachments?: () => AttachmentStore | undefined;
}
/** What {@link createWorkBuddyAdapter} hands back. */
interface WorkBuddyAdapter {
  adapter: PiAiAdapter;
  /** Rebuild the adapter's provider snapshot; call after a catalog update. */
  invalidate: () => void;
}
declare const THINKING_LEVELS: readonly ["minimal", "low", "medium", "high", "xhigh", "max"];
type WorkBuddyThinkingLevel = typeof THINKING_LEVELS[number];
type WorkBuddyThinkingLevelMap = Partial<Record<'off' | WorkBuddyThinkingLevel, string | null>>;
/** pi-ai input modalities: images only when WorkBuddy advertises them. */
declare function workBuddyModelInput(info: WorkBuddyModelInfo): ('text' | 'image')[];
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
declare function workBuddyDisplayName(info: WorkBuddyModelInfo): string;
/** Map only levels advertised by WorkBuddy; undeclared DSH levels stay unavailable. */
declare function workBuddyThinkingLevelMap(info: WorkBuddyModelInfo): WorkBuddyThinkingLevelMap | undefined;
/**
 * Assemble the adapter. The provider's `getModels` reads the live catalog,
 * and every model's `baseUrl` is re-resolved per read so the shim's
 * ephemeral port applies from the first snapshot after startup.
 */
declare function createWorkBuddyAdapter(options: WorkBuddyAdapterOptions): WorkBuddyAdapter;
//#endregion
//#region src/host-heartbeat.d.ts
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
declare const WORKBUDDY_HOST_HEARTBEAT_FILENAME = ".workbuddy-host-heartbeat.json";
/** Current on-disk heartbeat format; readers reject others. */
declare const HEARTBEAT_FORMAT_VERSION = 1;
/** On-disk shape of the heartbeat. */
interface WorkBuddyHostHeartbeat {
  version: typeof HEARTBEAT_FORMAT_VERSION;
  package: 'dsh-connect-workbuddy';
  pluginVersion: string;
  /** Epoch milliseconds when the host registered the provider. */
  registeredAt: number;
  /** Host process PID, to distinguish a stale heartbeat after a crash. */
  pid: number;
}
/** Absolute path of the host heartbeat file. */
declare function workbuddyHostHeartbeatPath(): string;
/**
 * Process start time in epoch milliseconds; undefined when unavailable.
 *
 * POSIX reads `ps -o lstart=`; Windows has no such command, so the creation
 * time is taken from PowerShell's `Get-Process` StartTime, emitted as UTC ISO
 * 8601 so `Date.parse` understands it without locale assumptions. Absent or
 * unqueryable processes (other users' processes) degrade to undefined.
 */
declare function processStartTimeMs(pid: number): number | undefined;
/**
 * Whether the recorded host process still matches the heartbeat's PID.
 *
 * A PID can be reused after a crash, so the recorded start time is compared
 * against the live process: a different start time means a different process.
 */
declare function isHeartbeatProcessAlive(heartbeat: WorkBuddyHostHeartbeat): boolean;
/** Read the heartbeat; absent or unparsable files report undefined. */
declare function readHostHeartbeat(): Promise<WorkBuddyHostHeartbeat | undefined>;
/** Write the heartbeat for the current process. */
declare function writeHostHeartbeat(): Promise<void>;
/** Remove the heartbeat; called when the plugin is disposed. */
declare function clearHostHeartbeat(): Promise<void>;
//#endregion
//#region src/version.d.ts
/**
 * Package version, injected at build time by `tsdown.config.ts`.
 *
 * 参考：corrinehu/dsh-workbuddy-connect（MIT）— 版本由构建期 define 注入，
 *   而非运行时读 package.json（发布包只含 lib/，不含 package.json 的
 *   可解析路径）。沿用该做法。
 *
 * @module dsh-connect-workbuddy/version
 */
/** The npm package version this build was produced from. */
declare const WORKBUDDY_CONNECT_VERSION: string;
//#endregion
//#region src/status-paths.d.ts
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
declare const WORKBUDDY_USAGE_PATH = "/plugins/dsh-connect-workbuddy/usage";
/** Plugin-owned live model refresh endpoint. */
declare const WORKBUDDY_MODELS_REFRESH_PATH = "/plugins/dsh-connect-workbuddy/models/refresh";
/** Plugin-owned local account rescan endpoint. */
declare const WORKBUDDY_ACCOUNTS_REFRESH_PATH = "/plugins/dsh-connect-workbuddy/accounts/refresh";
/** Plugin-owned daily check-in action endpoint. */
declare const WORKBUDDY_CHECKIN_PATH = "/plugins/dsh-connect-workbuddy/checkin";
/** Query parameter naming the region a card request addresses. */
declare const WORKBUDDY_REGION_PARAM = "region";
/** Every region, in card tab order. */
declare const WORKBUDDY_REGIONS: readonly WorkBuddyWebRegion[];
/**
 * Address one region's status route. The two regions are separate provider
 * stacks; every card request carries the region whose tab the user is on.
 */
declare function withWorkBuddyRegion(path: string, region: WorkBuddyWebRegion): string;
/**
 * Read the region parameter off a status-route URL. Absent means the domestic
 * tab (`cn`); a present-but-unknown value returns undefined so the route can
 * answer 400 instead of guessing.
 */
declare function regionOfStatusUrl(url: string): WorkBuddyWebRegion | undefined;
/** One credit package as the upstream returns it, node-free. */
interface WorkBuddyWebCreditPackage {
  packageName: string;
  remain: number;
  size: number;
  /** CapacityType 4: refreshed every cycle and never expires. */
  monthly: boolean;
  /** Next cycle start (the monthly refresh point) in ms; only on monthly packages. */
  cycleRefreshMs?: number;
  /** One-off expiry in ms; the package disappears from the account then. */
  expiresAtMs?: number;
}
/** Aggregated credit answer rendered by the plugin card. */
interface WorkBuddyWebCredits {
  total: number;
  packages: readonly WorkBuddyWebCreditPackage[];
  /** Credits expiring within 3 days across every package. */
  expiringSoon: number;
  /** When the nearest package expires, in ms. */
  nearestExpiryMs?: number;
}
/** Daily check-in state rendered below total remaining credits. */
interface WorkBuddyWebCheckin {
  active: boolean;
  todayCheckedIn: boolean;
  streakDays: number;
  dailyCredit: number;
  todayCredit: number;
  isStreakDay: boolean;
  nextStreakDay: number;
  streakBonusDays: number;
  streakBonusCredit: number;
  claimButtonText?: string;
}
/** Editable WorkBuddy model row rendered by the plugin-owned settings card. */
interface WorkBuddyWebModel {
  id: string;
  name: string;
  /** Effective DSH context after applying the saved local budget. */
  contextWindow: number;
  /** Native maximum advertised by WorkBuddy; models above 200K expose 200K/max. */
  nativeContextWindow: number;
  maxTokens: number;
  creditMultiplier?: number;
  multimodal?: boolean;
  reasoning?: {
    supportedEfforts?: readonly string[];
    defaultEffort?: string;
  };
  description?: string;
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
declare function toPersistedWorkBuddyModel(model: WorkBuddyWebModel): Omit<WorkBuddyWebModel, 'nativeContextWindow' | 'multimodal'>;
/** One selectable local account, token-free. */
interface WorkBuddyWebAccount {
  id: string;
  accountName: string;
  uin?: string;
  domain: string;
  source: 'desktop' | 'dsh';
  tokenExpiresAtMs: number;
  selected: boolean;
}
type WorkBuddyWebPackage = WorkBuddyWebCreditPackage;
/**
 * Region of the signed-in credential: the CN app (`codebuddy.cn` /
 * `workbuddy.cn`) or the international WorkBuddy AI app (`workbuddy.ai`).
 * The card uses this to read and write the matching per-region model slot.
 */
type WorkBuddyWebRegion = 'cn' | 'global';
/** The JSON document the plugin card renders. */
type WorkBuddyWebUsage = {
  status: 'signed-out';
  accounts: readonly WorkBuddyWebAccount[];
  message?: string;
} | {
  status: 'signed-in';
  accountId: string;
  accountName: string;
  uin?: string;
  domain?: string;
  /** Which per-region model directory and selection this account owns. */
  region: WorkBuddyWebRegion;
  source?: 'desktop' | 'dsh';
  tokenExpiresAtMs: number;
  accounts: readonly WorkBuddyWebAccount[];
  models: readonly WorkBuddyWebModel[];
  enabledModelIds: readonly string[];
  imageModelIds: readonly string[];
  credits?: WorkBuddyWebCredits;
  creditsError?: string;
  checkin?: WorkBuddyWebCheckin;
  checkinError?: string;
} | {
  status: 'error';
  message: string;
};
//#endregion
//#region src/web-status.d.ts
/** Constructor dependencies. */
interface WorkBuddyStatusRouteOptions {
  /** The region-scoped credential store backing each region's requests. */
  store(region: WorkBuddyRegion): WorkBuddyCredentialStore;
  client: Pick<WorkBuddyUpstreamClient, 'fetchCredits' | 'fetchCheckinStatus' | 'claimDailyCheckin'>;
  /**
   * The requested region's last-refreshed model directory (unfiltered) for
   * card display. Region-scoped because the CN and international apps expose
   * different rosters; showing one region's directory on the other account is
   * the bug this parameter exists to prevent.
   */
  displayModels(region: WorkBuddyRegion): readonly WorkBuddyModelInfo[];
  /** The requested region's selection, stored as model ids. */
  enabledModelIds(region: WorkBuddyRegion): readonly string[];
  /** Model ids the user opted into image input, for the requested region. */
  imageModelIds(region: WorkBuddyRegion): readonly string[];
  /** Saved local DSH context budgets by model id, for the requested region. */
  contextBudgets(region: WorkBuddyRegion): Readonly<Record<string, number | undefined>>;
  /** Re-read the live catalog of one region from the upstream. */
  discoverModels?(region: WorkBuddyRegion, signal?: AbortSignal): Promise<readonly WorkBuddyModelInfo[]>;
}
/**
 * Assemble one region's card document. `region` is the tab the card is on;
 * the region-scoped store already answers with only that region's accounts,
 * so the document's model slots and account list are that region's by
 * construction. Sign-in state is read-only; credit is a live billing answer
 * whose failure degrades to `creditsError` rather than failing the document.
 */
declare function workBuddyWebStatus(deps: WorkBuddyStatusRouteOptions, region: WorkBuddyRegion): Promise<WorkBuddyWebUsage>;
/**
 * Mount the read-only routes on a context where `webServer` is available.
 * The caller uses `ctx.inject(['webServer'], ...)`, so Desktop startup order
 * cannot make this registration disappear.
 */
declare function registerWorkBuddyStatusRoute(ctx: Context, deps: WorkBuddyStatusRouteOptions): void;
//#endregion
//#region src/index.d.ts
/** Stable Cordis plugin name. */
declare const name = "dsh-connect-workbuddy";
/** The model registry required before the provider can register. */
declare const inject: string[];
/** Settings namespace for the plugin configuration card. */
declare const WORKBUDDY_SETTINGS_NS: SettingsNamespace;
/** One region's model directory and the user's selection within it. */
interface WorkBuddyRegionState {
  /** The last-refreshed directory for this region; what the card displays. */
  lastCatalog?: WorkBuddyModelInfo[];
  /** The user's selection in this region, as model ids. */
  enabledModelIds?: string[];
  /** Model ids the user explicitly opted into image input. */
  imageModelIds?: string[];
  /** Local DSH context budget per model in this region. */
  contextBudgets?: Record<string, WorkBuddyContextBudget>;
}
/** Plugin configuration. */
interface Config {
  /** Explicit WorkBuddy desktop auth-file path, overriding env and platform defaults. */
  authFile?: string;
  /**
   * @deprecated Legacy single-slot account selector from before the dual
   * provider split. It is attributed to whichever region the account actually
   * belongs to (resolved once at startup from the local account scan); new
   * writes go to {@link Config.accounts}.
   */
  accountId?: string;
  /**
   * Per-region account selections, keyed `cn` | `global`. Each region's tab
   * writes its own slot; tokens remain outside settings.
   */
  accounts?: Partial<Record<WorkBuddyRegion, string>>;
  /**
   * Per-region model state, keyed `cn` | `global`. The CN app and the
   * international WorkBuddy AI app expose different rosters, so each keeps its
   * own directory and selection and switching accounts never drops the other
   * region's picks.
   */
  regions?: Partial<Record<WorkBuddyRegion, WorkBuddyRegionState>>;
  /**
   * @deprecated Legacy single-slot fields from before the region split. They
   * predate international support and are read as the CN region's state when
   * `regions.cn` is absent; new writes go to `regions`.
   */
  lastCatalog?: WorkBuddyModelInfo[];
  /** @deprecated See {@link Config.lastCatalog}. */
  enabledModelIds?: string[];
  /** @deprecated See {@link Config.lastCatalog}. */
  imageModelIds?: string[];
  /** @deprecated See {@link Config.lastCatalog}. */
  contextBudgets?: Record<string, WorkBuddyContextBudget>;
}
declare const Config: z<Config>;
/**
 * One region's saved model state. A config written before the region split has
 * only the flat fields: those were always captured from the CN endpoint (the
 * plugin had no international support), so they are read as the CN state and
 * only when no explicit CN slot exists. The global region never inherits them —
 * that inheritance is exactly the bug where a stale CN directory was
 * intersected with the international catalog and silently dropped the user's
 * picks.
 */
declare function regionStateOf(config: Config, region: WorkBuddyRegion): WorkBuddyRegionState;
/**
 * Start both regions' loopback endpoints, register the `workbuddy` (CN) and
 * `workbuddy-global` (international) providers, and refresh each region's
 * model catalog from the upstream once that region's credentials allow it.
 * The static fallback catalogs serve from the first moment, so an offline
 * upstream never leaves a provider empty.
 */
declare function apply(ctx: Context, config: Config): void;
//#endregion
export { Config, FALLBACK_WORKBUDDY_MODELS, FALLBACK_WORKBUDDY_MODELS_GLOBAL, type UpstreamErrorKind, WORKBUDDY_ACCOUNTS_REFRESH_PATH, WORKBUDDY_AUTH_FILENAME, WORKBUDDY_AUTH_FILE_ENV, WORKBUDDY_CHECKIN_PATH, WORKBUDDY_CONNECT_VERSION, WORKBUDDY_GLOBAL_PROVIDER, WORKBUDDY_HOST_HEARTBEAT_FILENAME, WORKBUDDY_MODELS_REFRESH_PATH, WORKBUDDY_PROVIDER, WORKBUDDY_PROVIDERS, WORKBUDDY_PROVIDER_DISPLAY_NAMES, WORKBUDDY_REGIONS, WORKBUDDY_REGION_PARAM, WORKBUDDY_SETTINGS_NS, WORKBUDDY_STREAM_IDLE_TIMEOUT_MS, WORKBUDDY_USAGE_PATH, type WorkBuddyAccountChoice, type WorkBuddyAdapter, type WorkBuddyAuthStatus, WorkBuddyCatalog, type WorkBuddyChatResult, type WorkBuddyCredential, WorkBuddyCredentialStore, type WorkBuddyCreditPackage, type WorkBuddyCredits, type WorkBuddyHostHeartbeat, type WorkBuddyModelInfo, type WorkBuddyReasoning, type WorkBuddyRefreshOutcome, WorkBuddyRegionState, type WorkBuddyShim, type WorkBuddyStatusRouteOptions, type WorkBuddyStoreOptions, WorkBuddyUpstreamClient, type WorkBuddyUpstreamModel, type WorkBuddyWebAccount, type WorkBuddyWebCheckin, type WorkBuddyWebCredits, type WorkBuddyWebModel, type WorkBuddyWebPackage, type WorkBuddyWebRegion, type WorkBuddyWebUsage, apply, authFileName, classifyUpstreamError, clearHostHeartbeat, createWorkBuddyAdapter, createWorkBuddyShim, defaultDesktopAuthCandidates, defaultDesktopAuthDirs, defaultDesktopAuthPath, deriveCatalog, fallbackModelsFor, inject, isHeartbeatProcessAlive, legacyWorkbuddyOwnAuthPath, name, parseCreditMultiplier, parseReasoning, parseUpstreamModel, parseWorkBuddyAuth, prepareChatBody, processStartTimeMs, readHostHeartbeat, regionOf, regionOfProvider, regionOfStatusUrl, regionStateOf, registerWorkBuddyStatusRoute, toPersistedWorkBuddyModel, withWorkBuddyRegion, workBuddyDisplayName, workBuddyModelInput, workBuddyThinkingLevelMap, workBuddyWebStatus, workbuddyAccountId, workbuddyHostHeartbeatPath, workbuddyOwnAuthPath, writeHostHeartbeat };