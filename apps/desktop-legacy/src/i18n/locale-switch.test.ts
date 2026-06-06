import { describe, expect, it } from "vitest";
import { changeAppLanguage, i18n, initI18n } from "@/i18n";
import { APP_LOCALES } from "@/i18n/locale";

describe("locale switch", () => {
  it("loads all supported locales", async () => {
    for (const locale of APP_LOCALES) {
      initI18n(locale);
      expect(i18n.language).toBe(locale);
      expect(i18n.t("common:nav.servers")).toBeTruthy();
      expect(i18n.t("errors:VAULT_LOCKED")).toBeTruthy();
    }
  });

  it("switches strings when language changes", async () => {
    initI18n("en");
    const en = i18n.t("common:nav.servers");
    await changeAppLanguage("tr");
    const tr = i18n.t("common:nav.servers");
    expect(en).not.toBe(tr);
    expect(tr).toBe("Sunucular");
  });
});
