import { FormEvent, useState } from "react";
import { useTranslation } from "react-i18next";
import { TermshLogo } from "@/components/brand/TermshLogo";
import { biometricLabelKey } from "@/lib/vault/biometric";
import { useVaultStore } from "@/stores/vaultStore";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export function VaultSetupModal({ open, onClose, onSuccess }: Props) {
  const { t } = useTranslation(["vault", "common"]);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [useDeviceUnlock, setUseDeviceUnlock] = useState(true);
  const status = useVaultStore((s) => s.status);
  const error = useVaultStore((s) => s.error);
  const setup = useVaultStore((s) => s.setup);
  const keychainAvailable = status?.keychainAvailable ?? false;
  const biometricAvailable = status?.biometricAvailable ?? false;
  const biometricKind = status?.biometricKind ?? "none";
  const clearError = useVaultStore((s) => s.clearError);

  if (!open) return null;

  const unlockOptions = () => ({
    useBiometric: biometricAvailable && useDeviceUnlock,
    rememberInKeychain: !biometricAvailable && keychainAvailable && useDeviceUnlock,
  });

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    clearError();

    if (password !== confirm) {
      useVaultStore.setState({ error: t("setup.passwordMismatch") });
      return;
    }

    setSubmitting(true);
    try {
      await setup(password, unlockOptions());
      setPassword("");
      setConfirm("");
      onSuccess?.();
      onClose();
    } catch {
      // store handles error
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal modal--narrow"
        role="dialog"
        aria-modal="true"
        aria-labelledby="vault-setup-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal__header modal__header--brand">
          <TermshLogo variant="wordmark-mono" size={26} />
          <h2 id="vault-setup-title">{t("setup.title")}</h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label={t("common:actions.close")}>
            ×
          </button>
        </header>

        <form className="modal__body" onSubmit={onSubmit}>
          <p className="vault-card__lead">{t("setup.lead")}</p>

          <label className="vault-field">
            <span>{t("setup.masterPassword")}</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>

          <label className="vault-field">
            <span>{t("setup.confirmPassword")}</span>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
            />
          </label>

          {(biometricAvailable || keychainAvailable) && (
            <label className="vault-field vault-field--checkbox">
              <input
                type="checkbox"
                checked={useDeviceUnlock}
                onChange={(e) => setUseDeviceUnlock(e.target.checked)}
              />
              <span>
                {biometricAvailable
                  ? t("setup.useBiometric", { method: t(biometricLabelKey(biometricKind)) })
                  : t("setup.rememberKeychain")}
              </span>
            </label>
          )}

          {error && <p className="vault-card__error">{error}</p>}

          <footer className="modal__footer">
            <button type="button" className="btn btn--secondary" onClick={onClose}>
              {t("setup.skip")}
            </button>
            <button type="submit" className="btn btn--primary" disabled={submitting}>
              {submitting ? t("setup.creating") : t("setup.createButton")}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
