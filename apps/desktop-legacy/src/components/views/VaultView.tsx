import { useTranslation } from "react-i18next";
import { biometricLabelKey } from "@/lib/vault/biometric";
import { useVaultStore } from "@/stores/vaultStore";

type Props = {
  onOpenVaultSetup: () => void;
  onVault: () => void;
};

export function VaultView({ onOpenVaultSetup, onVault }: Props) {
  const { t } = useTranslation("vault");
  const vaultStatus = useVaultStore((s) => s.status);
  const forgetKeychain = useVaultStore((s) => s.forgetKeychain);
  const vaultReady = Boolean(vaultStatus?.isSetup && vaultStatus?.isUnlocked);
  const deviceUnlockEnabled =
    Boolean(vaultStatus?.biometricEnabled) || Boolean(vaultStatus?.keychainEnabled);

  return (
    <div className="view view--vault">
      <header className="view__head">
        <h1>{t("title")}</h1>
        <p className="view__sub">{t("subtitle")}</p>
      </header>

      <div className="view__scroll mac-scrollbar">
        <div className="vault-panel">
          <div className="vault-panel__status-row">
            <span
              className={`vault-panel__dot ${vaultReady ? "vault-panel__dot--ok" : "vault-panel__dot--off"}`}
              aria-hidden
            />
            <span>
              {!vaultStatus?.isSetup
                ? t("status.notSetup")
                : vaultReady
                  ? t("status.unlocked")
                  : t("status.locked")}
            </span>
          </div>

          {vaultStatus?.biometricEnabled && vaultStatus.isSetup && (
            <p className="vault-panel__keychain">
              {t("biometric.enabled", {
                method: t(biometricLabelKey(vaultStatus.biometricKind)),
              })}
            </p>
          )}

          {vaultStatus?.keychainAvailable &&
            vaultStatus.isSetup &&
            !vaultStatus.biometricEnabled && (
              <p className="vault-panel__keychain">
                {vaultStatus.keychainEnabled ? t("keychain.enabled") : t("keychain.disabled")}
              </p>
            )}

          <div className="vault-panel__actions">
            {!vaultStatus?.isSetup ? (
              <button type="button" className="btn btn--primary" onClick={onOpenVaultSetup}>
                {t("actions.setup")}
              </button>
            ) : (
              <>
                <button type="button" className="btn btn--primary" onClick={onVault}>
                  {vaultReady ? t("actions.lock") : t("actions.unlock")}
                </button>
                {deviceUnlockEnabled && (
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={() => void forgetKeychain()}
                  >
                    {t("actions.forgetDeviceUnlock")}
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <section className="view__section">
          <h2>{t("protectsTitle")}</h2>
          <ul className="vault-feature-list">
            <li>{t("protects.passwords")}</li>
            <li>{t("protects.keys")}</li>
            <li>{t("protects.snippets")}</li>
            <li>{t("protects.kdf")}</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
