import type { Client, ConnectConfig } from "ssh2";

type KeyboardPrompt = { prompt: string; echo: boolean };

/** PAM sunucuları için keyboard-interactive + düz parola (legacy Tauri ile aynı sıra). */
export function applyPasswordAuth(conn: Client, config: ConnectConfig, password: string): void {
  const pwd = password.trim();
  config.password = pwd;
  config.tryKeyboard = true;
  (conn as Client & {
    on(
      event: "keyboard-interactive",
      listener: (
        name: string,
        instructions: string,
        lang: string,
        prompts: KeyboardPrompt[],
        finish: (responses: string[]) => void,
      ) => void,
    ): Client;
  }).on("keyboard-interactive", (_name, _instructions, _lang, prompts, finish) => {
    finish(prompts.map((p) => (p.echo ? "" : pwd)));
  });
}
