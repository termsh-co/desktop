import type { ReactNode } from "react";
import { KeysView } from "@/components/views/KeysView";
import { ServerView } from "@/components/views/ServerView";
import { SettingsView } from "@/components/views/SettingsView";
import { SnippetsView } from "@/components/views/SnippetsView";
import { VaultView } from "@/components/views/VaultView";
import { useNavStore, type AppView } from "@/stores/navStore";

type Props = {
  vaultReady: boolean;
  onOpenVaultSetup: () => void;
  onVault: () => void;
  onNewHost: () => void;
  serverSegment: "ssh" | "sftp";
};

type PaneConfig = {
  id: AppView;
  render: (props: Props) => ReactNode;
};

const PANES: PaneConfig[] = [
  { id: "hosts", render: (p) => <ServerView onNewHost={p.onNewHost} segment={p.serverSegment} /> },
  { id: "remote", render: (p) => <ServerView onNewHost={p.onNewHost} segment={p.serverSegment} /> },
  { id: "snippets", render: () => <SnippetsView /> },
  {
    id: "vault",
    render: (p) => (
      <VaultView onOpenVaultSetup={p.onOpenVaultSetup} onVault={p.onVault} />
    ),
  },
  { id: "keys", render: () => <KeysView /> },
  {
    id: "settings",
    render: (p) => (
      <SettingsView
        onOpenVaultSetup={p.onOpenVaultSetup}
        onVault={p.onVault}
      />
    ),
  },
];

export function MainContent(props: Props) {
  const view = useNavStore((s) => s.view);

  return (
    <div className="main-content">
      {PANES.map((pane) => {
        const active = view === pane.id;
        return (
          <div
            key={pane.id}
            className={`main-content__pane ${active ? "main-content__pane--active" : ""}`}
            aria-hidden={!active}
          >
            {pane.render(props)}
          </div>
        );
      })}
    </div>
  );
}
