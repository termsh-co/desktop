import { FormEvent, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { TermshLogo } from "@/components/brand/TermshLogo";
import { Icon } from "@/components/ui/Icon";
import { biometricIcon, biometricLabelKey } from "@/lib/vault/biometric";
import { startDraggingMainWindow } from "@/lib/window";
import { useVaultStore } from "@/stores/vaultStore";

export function UnlockView() {
  const { t } = useTranslation("vault");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [useDeviceUnlock, setUseDeviceUnlock] = useState(true);
  const status = useVaultStore((s) => s.status);
  const error = useVaultStore((s) => s.error);
  const unlock = useVaultStore((s) => s.unlock);
  const unlockWithBiometric = useVaultStore((s) => s.unlockWithBiometric);
  const bootstrap = useVaultStore((s) => s.bootstrap);
  const clearError = useVaultStore((s) => s.clearError);
  const keychainAvailable = status?.keychainAvailable ?? false;
  const biometricAvailable = status?.biometricAvailable ?? false;
  const biometricKind = status?.biometricKind ?? "none";
  const autoTried = useRef(false);

  const unlockOptions = () => ({
    useBiometric: biometricAvailable && useDeviceUnlock,
    rememberInKeychain: !biometricAvailable && keychainAvailable && useDeviceUnlock,
  });

  useEffect(() => {
    if (autoTried.current) return;
    if (!status?.biometricEnabled && !status?.keychainEnabled) return;
    autoTried.current = true;
    setSubmitting(true);
    void bootstrap().finally(() => setSubmitting(false));
  }, [bootstrap, status?.biometricEnabled, status?.keychainEnabled]);

  const onBiometricUnlock = async () => {
    clearError();
    setSubmitting(true);
    try {
      await unlockWithBiometric();
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    clearError();
    setSubmitting(true);
    try {
      await unlock(password, unlockOptions());
      setPassword("");
    } catch {
      // store handles error
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="vault-unlock">
      <div
        className="vault-unlock__drag"
        data-tauri-drag-region
        onMouseDown={(e) => {
          if (e.button !== 0) return;
          void startDraggingMainWindow();
        }}
        aria-hidden
      />
      <div className="vault-unlock__panel">
        <header className="vault-unlock__hero">
          <div className="vault-unlock__app-icon" aria-hidden>
            <TermshLogo variant="mark" size={30} />
          </div>
          <div className="vault-unlock__hero-text">
            <h1 className="vault-unlock__title">{t("unlock.title")}</h1>
            <p className="vault-unlock__subtitle">{t("unlock.subtitle")}</p>
          </div>
        </header>

        {error && (
          <p className="vault-unlock__error" role="alert">
            {error}
          </p>
        )}

        {status?.biometricEnabled && (
          <button
            type="button"
            className="vault-unlock__biometric"
            onClick={() => void onBiometricUnlock()}
            disabled={submitting}
          >
            <Icon name={biometricIcon(biometricKind)} size={22} />
            <span>{t("unlock.biometricButton", { method: t(biometricLabelKey(biometricKind)) })}</span>
          </button>
        )}

        <form className="vault-unlock__form" onSubmit={onSubmit}>
          <div className="vault-unlock__field">
            <label className="vault-unlock__sr-only" htmlFor="vault-master-password">
              {t("unlock.masterPassword")}
            </label>
            <input
              id="vault-master-password"
              className="vault-unlock__input"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              minLength={8}
              required
              placeholder={t("unlock.placeholder")}
              autoFocus={!status?.biometricEnabled}
            />
            <button
              type="button"
              className="vault-unlock__toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? t("unlock.hidePassword") : t("unlock.showPassword")}
            >
              <Icon name={showPassword ? "visibility_off" : "visibility"} size={18} />
            </button>
          </div>

          {(biometricAvailable || keychainAvailable) && (
            <label className="vault-unlock__remember">
              <input
                type="checkbox"
                checked={useDeviceUnlock}
                onChange={(e) => setUseDeviceUnlock(e.target.checked)}
              />
              <span>
                {biometricAvailable
                  ? t("unlock.useBiometric", { method: t(biometricLabelKey(biometricKind)) })
                  : t("unlock.rememberKeychain")}
              </span>
            </label>
          )}

          <button
            type="submit"
            className="vault-unlock__submit"
            disabled={submitting || password.length < 8}
          >
            {submitting ? t("unlock.unlocking") : t("unlock.unlockButton")}
          </button>
        </form>
      </div>

      <p className="vault-unlock__footnote">{t("unlock.footnote")}</p>
    </div>
  );
}
