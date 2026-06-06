import { useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { AppShell } from "@/components/layout/AppShell";
import { UnlockView } from "@/components/vault/UnlockView";
import {
  VaultOnboardingView,
  type VaultOnboardingContinue,
} from "@/components/vault/VaultOnboardingView";
import { useHostStore } from "@/stores/hostStore";
import { useNavStore } from "@/stores/navStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useVaultStore } from "@/stores/vaultStore";

function canUseApp(status: { isSetup: boolean; isUnlocked: boolean } | null): boolean {
  if (!status) return false;
  return !status.isSetup || status.isUnlocked;
}

export function VaultGate() {
  const { t } = useTranslation(["vault", "common"]);
  const status = useVaultStore((s) => s.status);
  const loading = useVaultStore((s) => s.loading);
  const error = useVaultStore((s) => s.error);
  const bootstrap = useVaultStore((s) => s.bootstrap);
  const loadHosts = useHostStore((s) => s.load);
  const vaultOnboardingDismissed = useSettingsStore((s) => s.vaultOnboardingDismissed);
  const [onboardingDone, setOnboardingDone] = useState(false);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    if (canUseApp(status)) {
      void loadHosts();
    }
  }, [status, loadHosts]);

  if (error && !status) {
    return (
      <div className="vault-screen">
        <div className="vault-card vault-screen__error">
          <h1>{t("gate.initFailed")}</h1>
          <p className="vault-screen__muted">{error}</p>
          <p className="vault-screen__hint">
            <Trans i18nKey="gate.devHint" ns="vault" components={{ code: <code /> }} />
          </p>
          <button type="button" className="btn btn--primary" onClick={() => void bootstrap()}>
            {t("common:actions.retry")}
          </button>
        </div>
      </div>
    );
  }

  if (loading || !status) {
    return (
      <div className="vault-screen">
        <p className="vault-screen__muted">{t("gate.loading")}</p>
      </div>
    );
  }

  if (status.isSetup && !status.isUnlocked) {
    return <UnlockView />;
  }

  const showOnboarding =
    !status.isSetup && !vaultOnboardingDismissed && !onboardingDone;

  if (showOnboarding) {
    const onOnboardingContinue = (options?: VaultOnboardingContinue) => {
      setOnboardingDone(true);
      if (options?.openSyncSettings) {
        useSettingsStore.getState().setCloudSyncEnabled(true);
        useNavStore.getState().setView("settings");
      }
    };
    return <VaultOnboardingView onContinue={onOnboardingContinue} />;
  }

  return <AppShell />;
}
