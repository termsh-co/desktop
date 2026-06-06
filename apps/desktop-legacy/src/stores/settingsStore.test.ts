import { beforeEach, describe, expect, it } from "vitest";
import { resetSettingsStoreForTests, useSettingsStore } from "@/stores/settingsStore";

describe("settingsStore", () => {
  beforeEach(() => {
    resetSettingsStoreForTests();
  });

  it("has default font settings", () => {
    const s = useSettingsStore.getState();
    expect(s.terminalFontFamily).toBe("JetBrains Mono");
    expect(s.terminalFontSize).toBe(13);
  });

  it("has a supported default locale", () => {
    const { locale } = useSettingsStore.getState();
    expect(["en", "zh", "es", "tr", "de"]).toContain(locale);
  });

  it("setLocale updates locale", () => {
    useSettingsStore.getState().setLocale("de");
    expect(useSettingsStore.getState().locale).toBe("de");
  });

  it("defaults ssh idle timeout to 0 (never)", () => {
    expect(useSettingsStore.getState().sshIdleTimeoutMinutes).toBe(0);
  });

  it("defaults cloud sync to disabled", () => {
    expect(useSettingsStore.getState().cloudSyncEnabled).toBe(false);
  });

  it("setTerminalFontFamily updates the font", () => {
    useSettingsStore.getState().setTerminalFontFamily("Fira Code");
    expect(useSettingsStore.getState().terminalFontFamily).toBe("Fira Code");
  });

  it("setTerminalFontSize updates the size", () => {
    useSettingsStore.getState().setTerminalFontSize(16);
    expect(useSettingsStore.getState().terminalFontSize).toBe(16);
  });

  it("setSshIdleTimeoutMinutes updates the timeout", () => {
    useSettingsStore.getState().setSshIdleTimeoutMinutes(30);
    expect(useSettingsStore.getState().sshIdleTimeoutMinutes).toBe(30);
  });

  it("setCloudSyncEnabled toggles sync", () => {
    useSettingsStore.getState().setCloudSyncEnabled(true);
    expect(useSettingsStore.getState().cloudSyncEnabled).toBe(true);
  });

  it("reset sets defaults", () => {
    useSettingsStore.getState().setTerminalFontFamily("Menlo");
    useSettingsStore.getState().setTerminalFontSize(18);
    useSettingsStore.getState().setLocale("zh");
    resetSettingsStoreForTests();
    expect(useSettingsStore.getState().terminalFontFamily).toBe("JetBrains Mono");
    expect(useSettingsStore.getState().terminalFontSize).toBe(13);
    expect(useSettingsStore.getState().locale).toBe("en");
  });
});
