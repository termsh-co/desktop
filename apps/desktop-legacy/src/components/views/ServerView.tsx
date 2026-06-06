import { HostsPanel } from "@/components/hosts/HostsPanel";
import { RemoteView } from "@/components/views/RemoteView";

type Props = {
  onNewHost: () => void;
  segment: "ssh" | "sftp";
};

export function ServerView({ onNewHost, segment }: Props) {
  return segment === "ssh" ? (
    <HostsPanel onNewHost={onNewHost} />
  ) : (
    <RemoteView />
  );
}
