import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOCALE,
  isAppLocale,
  resolveDeviceLocale,
  resolveInitialLocale,
} from "./locale";

describe("resolveDeviceLocale", () => {
  it("maps supported primary language tags", () => {
    expect(resolveDeviceLocale("en-US")).toBe("en");
    expect(resolveDeviceLocale("tr-TR")).toBe("tr");
    expect(resolveDeviceLocale("de-DE")).toBe("de");
    expect(resolveDeviceLocale("es-MX")).toBe("es");
    expect(resolveDeviceLocale("zh-CN")).toBe("zh");
    expect(resolveDeviceLocale("zh-TW")).toBe("zh");
  });

  it("falls back to English for unsupported languages", () => {
    expect(resolveDeviceLocale("fr-FR")).toBe(DEFAULT_LOCALE);
    expect(resolveDeviceLocale("ja-JP")).toBe(DEFAULT_LOCALE);
    expect(resolveDeviceLocale("")).toBe(DEFAULT_LOCALE);
  });
});

describe("isAppLocale", () => {
  it("accepts supported locale codes", () => {
    expect(isAppLocale("en")).toBe(true);
    expect(isAppLocale("zh")).toBe(true);
    expect(isAppLocale("fr")).toBe(false);
  });
});

describe("resolveInitialLocale", () => {
  it("returns a supported locale", () => {
    const locale = resolveInitialLocale();
    expect(isAppLocale(locale)).toBe(true);
  });
});
