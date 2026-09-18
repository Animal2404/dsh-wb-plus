//#region src/bin.d.ts
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
/** Execute one boot-free command. */
declare function run(argv: readonly string[]): Promise<number>;
//#endregion
export { run };