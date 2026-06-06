import { invoke } from "@tauri-apps/api/core";
import type { RemoteFileEntry } from "@termsh/shared";

export type RemoteAuthType = "password" | "privateKey";
export type RemoteProtocol = "sftp" | "ftp" | "ftps";

export type RemoteConnectionConfig = {
  protocol?: RemoteProtocol;
  host: string;
  port: number;
  username: string;
  authType: RemoteAuthType;
  password?: string;
  /** Unencrypted private key in OpenSSH PEM format. */
  privateKeyPem?: string;
};

export type ListDirPayload = {
  connection: RemoteConnectionConfig;
  path: string;
};

export type HostConnectPayload = {
  hostId: string;
  connectPassword?: string;
  connectPrivateKeyPem?: string;
};

export type ListDirHostPayload = HostConnectPayload & {
  path: string;
};

export async function remoteTestConnection(config: RemoteConnectionConfig): Promise<void> {
  await invoke("remote_test_connection", {
    config: {
      ...config,
      protocol: config.protocol ?? "sftp",
    },
  });
}

export async function remoteTestConnectionHost(payload: HostConnectPayload): Promise<void> {
  await invoke("remote_test_connection_host", { payload });
}

export async function remoteListDir(payload: ListDirPayload): Promise<RemoteFileEntry[]> {
  return invoke<RemoteFileEntry[]>("remote_list_dir", {
    payload: {
      connection: {
        ...payload.connection,
        protocol: payload.connection.protocol ?? "sftp",
      },
      path: payload.path,
    },
  });
}

export async function remoteListDirHost(payload: ListDirHostPayload): Promise<RemoteFileEntry[]> {
  return invoke<RemoteFileEntry[]>("remote_list_dir_host", { payload });
}

export async function remoteDisconnectHost(hostId: string): Promise<void> {
  await invoke("remote_disconnect_host", { hostId });
}

export type RemoteTransferHostPayload = {
  hostId: string;
  remotePath: string;
  localPath: string;
  connectPassword?: string;
  connectPrivateKeyPem?: string;
};

export async function remoteDownloadHost(payload: RemoteTransferHostPayload): Promise<void> {
  await invoke("remote_download_host", { payload });
}

export async function remoteUploadHost(payload: RemoteTransferHostPayload): Promise<void> {
  await invoke("remote_upload_host", { payload });
}

export async function localHomeDir(): Promise<string> {
  return invoke<string>("local_home_dir");
}

export async function localListDir(path: string): Promise<RemoteFileEntry[]> {
  return invoke<RemoteFileEntry[]>("local_list_dir", { path });
}

export async function localCopyInto(destDir: string, paths: string[]): Promise<void> {
  await invoke("local_copy_into", { destDir, paths });
}
