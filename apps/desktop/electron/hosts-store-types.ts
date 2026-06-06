export type HostRecord = {
  id: string;
  name: string;
  hostname: string;
  port: number;
  username: string;
  authType: "password" | "privateKey";
  credentialRef?: string;
  privateKeyRef?: string;
  tags: string[];
  group?: string;
  color?: string;
  platform?: string;
  lastConnectedAt?: string;
};

export type SaveHostInput = {
  id?: string;
  name: string;
  hostname: string;
  port: number;
  username: string;
  authType: "password" | "privateKey";
  tags: string[];
  group?: string;
  color?: string;
  platform?: string;
  password?: string;
  privateKey?: string;
  sshKeyId?: string;
};
