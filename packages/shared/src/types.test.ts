import { describe, expect, it } from "vitest";
import type { Host, Session } from "./types";

describe("shared types", () => {
  it("Host shape accepts required fields", () => {
    const host: Host = {
      id: "h1",
      name: "Prod",
      hostname: "prod.example.com",
      port: 22,
      username: "deploy",
      authType: "privateKey",
      credentialRef: "cred-1",
      privateKeyRef: "key-1",
      tags: ["prod"],
      group: "servers",
      color: "#22c55e",
    };
    expect(host.port).toBe(22);
    expect(host.tags).toContain("prod");
  });

  it("Session shape supports local and ssh kinds", () => {
    const local: Session = { id: "s1", kind: "local", title: "Local" };
    const ssh: Session = {
      id: "s2",
      kind: "ssh",
      title: "Prod",
      hostId: "h1",
    };
    expect(local.kind).toBe("local");
    expect(ssh.hostId).toBe("h1");
  });
});
