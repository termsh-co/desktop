import { randomUUID } from "node:crypto";
import { vaultGetPayload, vaultIsUnlocked, vaultReplacePayload } from "./vault-store";

export type SnippetRecord = {
  id: string;
  title: string;
  body: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type SaveSnippetInput = {
  id?: string;
  title: string;
  body: string;
  tags: string[];
};

export function snippetsList(): SnippetRecord[] {
  if (!vaultIsUnlocked()) return [];
  return vaultGetPayload().snippets.map((s) => ({ ...s }));
}

export function snippetsSave(input: SaveSnippetInput): SnippetRecord {
  const payload = vaultGetPayload();
  const now = new Date().toISOString();
  if (input.id) {
    const idx = payload.snippets.findIndex((s) => s.id === input.id);
    if (idx === -1) throw new Error("Snippet not found");
    const updated: SnippetRecord = {
      ...payload.snippets[idx],
      title: input.title,
      body: input.body,
      tags: input.tags ?? [],
      updatedAt: now,
    };
    payload.snippets[idx] = updated;
    vaultReplacePayload(payload);
    return { ...updated };
  }
  const created: SnippetRecord = {
    id: randomUUID(),
    title: input.title,
    body: input.body,
    tags: input.tags ?? [],
    createdAt: now,
    updatedAt: now,
  };
  payload.snippets.push(created);
  vaultReplacePayload(payload);
  return { ...created };
}

export function snippetsDelete(id: string): void {
  const payload = vaultGetPayload();
  const idx = payload.snippets.findIndex((s) => s.id === id);
  if (idx === -1) throw new Error("Snippet not found");
  payload.snippets.splice(idx, 1);
  vaultReplacePayload(payload);
}
