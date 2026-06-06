import { Injectable } from "@angular/core";
import type { TermshDesktopApi } from "./api";
import { getTermshApi } from "./termsh-bridge";

export type { TermshDesktopApi };

@Injectable({ providedIn: "root" })
export class TermshPlatformService {
  private readonly api: TermshDesktopApi = getTermshApi();

  get version() {
    return this.api.version();
  }

  get coreVersion() {
    return this.api.coreVersion();
  }

  get appInfo() {
    return this.api.appInfo();
  }

  get vaultStatus() {
    return this.api.vaultStatus();
  }

  vaultSetup(password: string, options?: Parameters<TermshDesktopApi["vaultSetup"]>[1]) {
    return this.api.vaultSetup(password, options);
  }

  vaultUnlock(password: string, options?: Parameters<TermshDesktopApi["vaultUnlock"]>[1]) {
    return this.api.vaultUnlock(password, options);
  }

  vaultLock() {
    return this.api.vaultLock();
  }

  vaultTryKeychainUnlock() {
    return this.api.vaultTryKeychainUnlock();
  }

  vaultTryBiometricUnlock() {
    return this.api.vaultTryBiometricUnlock();
  }

  vaultForgetKeychain() {
    return this.api.vaultForgetKeychain();
  }

  listHosts() {
    return this.api.listHosts();
  }

  saveHost(payload: Parameters<TermshDesktopApi["saveHost"]>[0]) {
    return this.api.saveHost(payload);
  }

  deleteHost(id: string) {
    return this.api.deleteHost(id);
  }

  ptyAvailable() {
    return this.api.ptyAvailable();
  }

  spawnLocalShell(sessionId: string, cols: number, rows: number) {
    return this.api.spawnLocalShell(sessionId, cols, rows);
  }

  spawnSshShell(
    sessionId: string,
    hostId: string,
    cols: number,
    rows: number,
    password?: string,
  ) {
    return this.api.spawnSshShell(sessionId, hostId, cols, rows, password);
  }

  listSnippets() {
    return this.api.listSnippets();
  }

  saveSnippet(payload: Parameters<TermshDesktopApi["saveSnippet"]>[0]) {
    return this.api.saveSnippet(payload);
  }

  deleteSnippet(id: string) {
    return this.api.deleteSnippet(id);
  }

  listKeys() {
    return this.api.listKeys();
  }

  saveKey(payload: Parameters<TermshDesktopApi["saveKey"]>[0]) {
    return this.api.saveKey(payload);
  }

  generateKey(payload: Parameters<TermshDesktopApi["generateKey"]>[0]) {
    return this.api.generateKey(payload);
  }

  deleteKey(id: string) {
    return this.api.deleteKey(id);
  }

  ptyWrite(sessionId: string, data: string) {
    this.api.ptyWrite(sessionId, data);
  }

  ptyResize(sessionId: string, cols: number, rows: number) {
    this.api.ptyResize(sessionId, cols, rows);
  }

  ptyClose(sessionId: string) {
    return this.api.ptyClose(sessionId);
  }

  onPtyData(handler: Parameters<TermshDesktopApi["onPtyData"]>[0]) {
    return this.api.onPtyData(handler);
  }

  onPtyExit(handler: Parameters<TermshDesktopApi["onPtyExit"]>[0]) {
    return this.api.onPtyExit(handler);
  }

  pingActivity() {
    this.api.pingActivity();
  }

  onVaultLocked(handler: () => void) {
    return this.api.onVaultLocked(handler);
  }

  setAutoLockMinutes(minutes: number) {
    return this.api.setAutoLockMinutes(minutes);
  }

  syncStatus(config: Parameters<TermshDesktopApi["syncStatus"]>[0]) {
    return this.api.syncStatus(config);
  }

  syncPull(config: Parameters<TermshDesktopApi["syncPull"]>[0]) {
    return this.api.syncPull(config);
  }

  syncPush(config: Parameters<TermshDesktopApi["syncPush"]>[0]) {
    return this.api.syncPush(config);
  }

  remoteListDir(hostId: string, path: string, passwordOverride?: string) {
    return this.api.remoteListDir(hostId, path, passwordOverride);
  }

  localHomeDir() {
    return this.api.localHomeDir();
  }

  localListDir(path: string) {
    return this.api.localListDir(path);
  }

  localCopyInto(destDir: string, paths: string[]) {
    return this.api.localCopyInto(destDir, paths);
  }

  remoteUpload(
    hostId: string,
    localPath: string,
    remotePath: string,
    passwordOverride?: string,
  ) {
    return this.api.remoteUpload(hostId, localPath, remotePath, passwordOverride);
  }

  remoteDownload(
    hostId: string,
    remotePath: string,
    localPath: string,
    passwordOverride?: string,
  ) {
    return this.api.remoteDownload(hostId, remotePath, localPath, passwordOverride);
  }

  pickFiles(multiple?: boolean) {
    return this.api.pickFiles(multiple);
  }

  detectHostPlatform(hostId: string, passwordOverride?: string) {
    return this.api.detectHostPlatform(hostId, passwordOverride);
  }

  updaterCheck() {
    return this.api.updaterCheck();
  }

  updaterInstall() {
    return this.api.updaterInstall();
  }

  onUpdaterAvailable(handler: Parameters<TermshDesktopApi["onUpdaterAvailable"]>[0]) {
    return this.api.onUpdaterAvailable(handler);
  }

  onUpdaterNotAvailable(handler: Parameters<TermshDesktopApi["onUpdaterNotAvailable"]>[0]) {
    return this.api.onUpdaterNotAvailable(handler);
  }

  onUpdaterError(handler: Parameters<TermshDesktopApi["onUpdaterError"]>[0]) {
    return this.api.onUpdaterError(handler);
  }
}
