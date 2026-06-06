import { useState } from "react";
import { HostDrawer } from "@/components/hosts/HostDrawer";
import { AppHeader } from "@/components/layout/AppHeader";
import { MainContent } from "@/components/layout/MainContent";
import { SessionTabBar } from "@/components/layout/SessionTabBar";
import { Sidebar } from "@/components/layout/Sidebar";
import { StatusBar } from "@/components/layout/StatusBar";
import { TerminalView } from "@/components/views/TerminalView";
import { VaultSetupModal } from "@/components/vault/VaultSetupModal";
import { useAppShortcuts } from "@/hooks/useAppShortcuts";
import { useSshIdleMonitor } from "@/hooks/useSshIdleMonitor";
import { useUpdaterAutoCheck } from "@/hooks/useUpdaterAutoCheck";
import { useTerminalDataRouter } from "@/hooks/useTerminalDataRouter";
import { useHostStore } from "@/stores/hostStore";
import { useNavStore } from "@/stores/navStore";
import { useVaultStore } from "@/stores/vaultStore";
import { startAutoSyncTimer } from "@/stores/syncStore";
import "@/styles/app.css";

export function AppShell() {
  useAppShortcuts();
  useTerminalDataRouter();
  useSshIdleMonitor();
  useUpdaterAutoCheck();
  startAutoSyncTimer();

  const [vaultSetupOpen, setVaultSetupOpen] = useState(false);

  const view = useNavStore((s) => s.view);
  const setView = useNavStore((s) => s.setView);
  const openHostDrawer = useNavStore((s) => s.openHostDrawer);
  const closeHostDrawer = useNavStore((s) => s.closeHostDrawer);
  const hostDrawerOpen = useNavStore((s) => s.hostDrawerOpen);
  const hostDrawerHost = useNavStore((s) => s.hostDrawerHost);
  const saveHost = useHostStore((s) => s.save);

  const vaultStatus = useVaultStore((s) => s.status);
  const lock = useVaultStore((s) => s.lock);
  const vaultReady = Boolean(vaultStatus?.isSetup && vaultStatus?.isUnlocked);

  const [serverSegment, setServerSegment] = useState<"ssh" | "sftp">("ssh");

  const handleSegmentChange = (s: "ssh" | "sftp") => {
    setServerSegment(s);
    setView("hosts");
  };

  const onVault = () => {
    if (vaultReady) void lock();
    else setVaultSetupOpen(true);
  };

  const onNewHost = () => {
    setView("hosts");
    openHostDrawer(null);
  };

  const shellProps = {
    vaultReady,
    onOpenVaultSetup: () => setVaultSetupOpen(true),
    onVault,
    onNewHost,
    serverSegment,
  };

  return (
    <>
      <div className={`app ${hostDrawerOpen ? "app--drawer-open" : ""}`}>
        <AppHeader
          onVault={onVault}
          vaultReady={vaultReady}
          onNewHost={onNewHost}
          onOpenVaultSetup={shellProps.onOpenVaultSetup}
          serverSegment={serverSegment}
          onServerSegmentChange={handleSegmentChange}
        />
        <div className="app__body">
          <Sidebar />
          <div className="app__workspace">
            <SessionTabBar />
            <div
              className={`app__stage ${
                view === "terminal"
                  ? "app__stage--session"
                  : "app__stage--pages"
              }`}
            >
              <div className="app__pages">
                <MainContent {...shellProps} />
              </div>
              <div className="app__session-view" aria-hidden={view !== "terminal"}>
                <TerminalView />
              </div>
            </div>
          </div>
        </div>
        <StatusBar />
      </div>
      <VaultSetupModal open={vaultSetupOpen} onClose={() => setVaultSetupOpen(false)} />
      <HostDrawer
        open={hostDrawerOpen}
        host={hostDrawerHost}
        vaultReady={vaultReady}
        onClose={closeHostDrawer}
        onSave={saveHost}
      />
    </>
  );
}
