import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { fetchAppInfo } from "@/lib/app/ipc";
import { Icon, type IconName } from "@/components/ui/Icon";
import {
  APP_LOCALES,
  LOCALE_LABELS,
  isAppLocale,
  type AppLocale,
} from "@/i18n/locale";
import { SSH_IDLE_TIMEOUT_VALUES, isSshIdleTimeout } from "@/lib/settings/sshIdle";
import { FONT_OPTIONS, FONT_SIZE_OPTIONS } from "@/lib/settings/terminalFont";
import { THEMES } from "@/lib/themes";
import { isTauriRuntime } from "@/lib/env";
import { useNavStore } from "@/stores/navStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useSyncStore } from "@/stores/syncStore";
import { useThemeStore } from "@/stores/themeStore";
import { checkForUpdatesInteractive } from "@/lib/updater/check";

type Props = {
  onOpenVaultSetup: () => void;
  onVault: () => void;
};

function SectionCard({
  icon,
  title,
  desc,
  children,
}: {
  icon: IconName;
  title: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <section className="settings-card">
      <header className="settings-card__head">
        <span className="settings-card__icon">
          <Icon name={icon} size={18} />
        </span>
        <div>
          <h2 className="settings-card__title">{title}</h2>
          <p className="settings-card__desc">{desc}</p>
        </div>
      </header>
      <div className="settings-card__body">{children}</div>
    </section>
  );
}

export function SettingsView(_props: Props) {
  const { t } = useTranslation("settings");
  const [appVersion, setAppVersion] = useState<string | null>(null);
  const [updateBusy, setUpdateBusy] = useState(false);

  useEffect(() => {
    if (!isTauriRuntime()) return;
    void fetchAppInfo()
      .then((info) => setAppVersion(info.version))
      .catch(() => setAppVersion(null));
  }, []);

  const setView = useNavStore((s) => s.setView);
  const themeId = useThemeStore((s) => s.themeId);
  const setTheme = useThemeStore((s) => s.setTheme);
  const locale = useSettingsStore((s) => s.locale);
  const setLocale = useSettingsStore((s) => s.setLocale);
  const sshIdleTimeoutMinutes = useSettingsStore((s) => s.sshIdleTimeoutMinutes);
  const setSshIdleTimeoutMinutes = useSettingsStore((s) => s.setSshIdleTimeoutMinutes);
  const terminalFontFamily = useSettingsStore((s) => s.terminalFontFamily);
  const setTerminalFontFamily = useSettingsStore((s) => s.setTerminalFontFamily);
  const terminalFontSize = useSettingsStore((s) => s.terminalFontSize);
  const setTerminalFontSize = useSettingsStore((s) => s.setTerminalFontSize);

  const syncServerUrl = useSyncStore((s) => s.serverUrl);
  const setSyncServerUrl = useSyncStore((s) => s.setServerUrl);
  const syncAccessToken = useSyncStore((s) => s.accessToken);
  const setSyncAccessToken = useSyncStore((s) => s.setAccessToken);
  const syncStatus = useSyncStore((s) => s.status);
  const syncError = useSyncStore((s) => s.error);
  const syncSyncing = useSyncStore((s) => s.syncing);
  const checkSyncStatus = useSyncStore((s) => s.checkStatus);
  const triggerPull = useSyncStore((s) => s.triggerPull);
  const triggerPush = useSyncStore((s) => s.triggerPush);
  const autoSync = useSyncStore((s) => s.autoSync);
  const setAutoSync = useSyncStore((s) => s.setAutoSync);

  const onIdleChange = (value: string) => {
    const minutes = Number(value);
    if (isSshIdleTimeout(minutes)) setSshIdleTimeoutMinutes(minutes);
  };

  const onLocaleChange = (value: string) => {
    if (isAppLocale(value)) setLocale(value);
  };

  return (
    <div className="settings-screen">
      <div className="settings-screen__scroll mac-scrollbar">
        <div className="settings-screen__inner">
          <header className="settings-screen__hero">
            <button type="button" className="settings-screen__back" onClick={() => setView("hosts")}>
              <Icon name="chevron_right" size={14} className="settings-screen__back-icon" />
              <span>{t("backToServers")}</span>
            </button>
            <h1 className="settings-screen__title">{t("title")}</h1>
          </header>

          <SectionCard icon="settings" title={t("language.title")} desc={t("language.desc")}>
            <div className="settings-field">
              <label className="settings-field__label" htmlFor="app-locale">
                {t("language.label")}
              </label>
              <select
                id="app-locale"
                className="settings-field__select"
                value={locale}
                onChange={(e) => onLocaleChange(e.target.value)}
              >
                {APP_LOCALES.map((code) => (
                  <option key={code} value={code}>
                    {LOCALE_LABELS[code as AppLocale]}
                  </option>
                ))}
              </select>
            </div>
          </SectionCard>

          <SectionCard icon="dns" title={t("theme.title")} desc={t("theme.desc")}>
            <div className="settings-theme-grid" role="list">
              {THEMES.map((theme) => {
                const active = themeId === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    role="listitem"
                    className={`settings-theme-chip ${active ? "settings-theme-chip--active" : ""}`}
                    onClick={() => setTheme(theme.id)}
                    aria-pressed={active}
                  >
                    <span
                      className="settings-theme-chip__dot"
                      style={{ background: theme.swatch }}
                      aria-hidden
                    />
                    <span className="settings-theme-chip__label">
                      {t(`theme.names.${theme.id}`, { defaultValue: theme.label })}
                    </span>
                  </button>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard icon="lock" title={t("security.title")} desc={t("security.desc")}>
            <div className="settings-field">
              <label className="settings-field__label" htmlFor="ssh-idle-timeout">
                {t("security.idleLabel")}
              </label>
              <select
                id="ssh-idle-timeout"
                className="settings-field__select"
                value={sshIdleTimeoutMinutes}
                onChange={(e) => onIdleChange(e.target.value)}
              >
                {SSH_IDLE_TIMEOUT_VALUES.map((value) => (
                  <option key={value} value={value}>
                    {t(`sshIdle.${value}`)}
                  </option>
                ))}
              </select>
            </div>
          </SectionCard>

          <SectionCard icon="terminal" title={t("terminal.title")} desc={t("terminal.desc")}>
            <div className="settings-field">
              <label className="settings-field__label" htmlFor="terminal-font-family">
                {t("terminal.fontLabel")}
              </label>
              <select
                id="terminal-font-family"
                className="settings-field__select"
                value={terminalFontFamily}
                onChange={(e) => setTerminalFontFamily(e.target.value as typeof terminalFontFamily)}
              >
                {FONT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="settings-field">
              <label className="settings-field__label" htmlFor="terminal-font-size">
                {t("terminal.sizeLabel")}
              </label>
              <select
                id="terminal-font-size"
                className="settings-field__select"
                value={terminalFontSize}
                onChange={(e) => setTerminalFontSize(Number(e.target.value))}
              >
                {FONT_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {t("terminal.sizePx", { size })}
                  </option>
                ))}
              </select>
            </div>
          </SectionCard>

          <SectionCard icon="cloud" title={t("sync.title")} desc={t("sync.desc")}>
            <div className="settings-field">
              <label className="settings-field__label" htmlFor="sync-server-url">
                {t("sync.serverUrl")}
              </label>
              <input
                id="sync-server-url"
                type="url"
                className="settings-field__input"
                value={syncServerUrl}
                onChange={(e) => setSyncServerUrl(e.target.value)}
                placeholder={t("sync.serverUrlPlaceholder")}
              />
            </div>
            <div className="settings-field">
              <label className="settings-field__label" htmlFor="sync-token">
                {t("sync.accessToken")}
              </label>
              <input
                id="sync-token"
                type="password"
                className="settings-field__input"
                value={syncAccessToken}
                onChange={(e) => setSyncAccessToken(e.target.value)}
                placeholder={t("sync.accessTokenPlaceholder")}
              />
            </div>
            {syncStatus && (
              <p className={`settings-sync-status ${syncStatus.connected ? "settings-sync-status--ok" : ""}`}>
                {syncStatus.connected
                  ? t("sync.connectedAs", { email: syncStatus.email })
                  : t("sync.notConnected")}
              </p>
            )}
            {syncError && <p className="settings-sync-error">{syncError}</p>}
            <div className="settings-actions">
              <button
                type="button"
                className="btn btn--secondary"
                disabled={syncSyncing || !syncServerUrl || !syncAccessToken}
                onClick={() => void checkSyncStatus()}
              >
                {t("sync.testConnection")}
              </button>
              {syncStatus?.connected && (
                <>
                  <button
                    type="button"
                    className="btn btn--secondary"
                    disabled={syncSyncing}
                    onClick={() => void triggerPull()}
                  >
                    {t("sync.pull")}
                  </button>
                  <button
                    type="button"
                    className="btn btn--secondary"
                    disabled={syncSyncing}
                    onClick={() => void triggerPush()}
                  >
                    {t("sync.push")}
                  </button>
                </>
              )}
            </div>
            <div className="settings-row">
              <label className="settings-field__label">
                <input type="checkbox" checked={autoSync} onChange={(e) => setAutoSync(e.target.checked)} />
                {" "}
                {t("sync.autoSync")}
              </label>
            </div>
          </SectionCard>

          <SectionCard icon="cloud" title={t("updates.title")} desc={t("updates.desc")}>
            <div className="settings-field">
              <span className="settings-field__label">{t("updates.version")}</span>
              <span className="settings-field__value">{appVersion ?? "—"}</span>
            </div>
            <div className="settings-actions">
              <button
                type="button"
                className="btn btn--secondary"
                disabled={!isTauriRuntime() || updateBusy}
                onClick={() => {
                  setUpdateBusy(true);
                  void checkForUpdatesInteractive().finally(() => setUpdateBusy(false));
                }}
              >
                {updateBusy ? t("updates.checking") : t("updates.checkForUpdates")}
              </button>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
