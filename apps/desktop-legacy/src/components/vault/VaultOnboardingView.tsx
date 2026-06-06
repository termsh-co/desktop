import { useState } from "react";
import { useTranslation } from "react-i18next";
import { TermshLogo } from "@/components/brand/TermshLogo";
import { Icon } from "@/components/ui/Icon";
import { VaultSetupModal } from "@/components/vault/VaultSetupModal";
import { startDraggingMainWindow } from "@/lib/window";
import { useSettingsStore } from "@/stores/settingsStore";

export type VaultOnboardingContinue = {
  openSyncSettings?: boolean;
};

type Props = {
  onContinue: (options?: VaultOnboardingContinue) => void;
};

export function VaultOnboardingView({ onContinue }: Props) {
  const { t } = useTranslation(["vault", "common"]);
  const dismissVaultOnboarding = useSettingsStore((s) => s.dismissVaultOnboarding);
  const [setupOpen, setSetupOpen] = useState(false);
  const [afterVault, setAfterVault] = useState<"local" | "cloud">("local");

  const skip = () => {
    dismissVaultOnboarding();
    onContinue();
  };

  const openSetup = (path: "local" | "cloud") => {
    setAfterVault(path);
    setSetupOpen(true);
  };

  const finish = (openSyncSettings: boolean) => {
    dismissVaultOnboarding();
    onContinue(openSyncSettings ? { openSyncSettings: true } : undefined);
  };

  return (
    <>
      <div className="vault-onboard">
        <div
          className="vault-onboard__drag"
          data-tauri-drag-region
          onMouseDown={(e) => {
            if (e.button !== 0) return;
            void startDraggingMainWindow();
          }}
          aria-hidden
        />

        <div className="vault-onboard__panel">
          <header className="vault-onboard__hero">
            <div className="vault-onboard__app-icon" aria-hidden>
              <TermshLogo variant="mark" size={30} />
            </div>
            <div className="vault-onboard__hero-text">
              <h1 className="vault-onboard__title">{t("onboarding.title")}</h1>
              <p className="vault-onboard__subtitle">{t("onboarding.chooseSubtitle")}</p>
            </div>
          </header>

          <div className="vault-onboard__list-panel">
            <section className="vault-onboard__item">
              <div className="vault-onboard__item-head">
                <span className="vault-onboard__item-icon" aria-hidden>
                  <Icon name="lock" size={18} />
                </span>
                <div className="vault-onboard__item-copy">
                  <h2 className="vault-onboard__item-title">{t("onboarding.localTitle")}</h2>
                  <p className="vault-onboard__item-lead">{t("onboarding.localLead")}</p>
                </div>
              </div>
              <ul className="vault-onboard__bullets">
                <li>{t("protects.passwords")}</li>
                <li>{t("protects.keys")}</li>
                <li>{t("protects.snippets")}</li>
              </ul>
              <button
                type="button"
                className="btn btn--primary vault-onboard__item-btn"
                onClick={() => openSetup("local")}
              >
                {t("onboarding.setupButton")}
              </button>
            </section>

            <section className="vault-onboard__item">
              <div className="vault-onboard__item-head">
                <span className="vault-onboard__item-icon" aria-hidden>
                  <Icon name="cloud" size={18} />
                </span>
                <div className="vault-onboard__item-copy">
                  <h2 className="vault-onboard__item-title">{t("onboarding.cloudTitle")}</h2>
                  <p className="vault-onboard__item-lead">{t("onboarding.cloudLead")}</p>
                  <p className="vault-onboard__note">{t("onboarding.cloudRequiresVault")}</p>
                </div>
              </div>
              <button
                type="button"
                className="btn btn--secondary vault-onboard__item-btn"
                onClick={() => openSetup("cloud")}
              >
                {t("onboarding.cloudSetupButton")}
              </button>
            </section>
          </div>

          <p className="vault-onboard__skip">
            <button type="button" className="vault-onboard__skip-link" onClick={skip}>
              {t("onboarding.skipButton")}
            </button>
          </p>
        </div>
      </div>

      <VaultSetupModal
        open={setupOpen}
        onClose={() => setSetupOpen(false)}
        onSuccess={() => {
          setSetupOpen(false);
          finish(afterVault === "cloud");
        }}
      />
    </>
  );
}
