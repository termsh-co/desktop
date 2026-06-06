import { invoke } from "@tauri-apps/api/core";
import type { Snippet } from "@termsh/shared";

export type SaveSnippetPayload = {
  id?: string;
  title: string;
  body: string;
  tags: string[];
};

export async function listSnippets(): Promise<Snippet[]> {
  return invoke<Snippet[]>("snippets_list");
}

export async function saveSnippet(payload: SaveSnippetPayload): Promise<Snippet> {
  return invoke<Snippet>("snippets_save", { payload });
}

export async function deleteSnippet(id: string): Promise<void> {
  await invoke("snippets_delete", { id });
}

