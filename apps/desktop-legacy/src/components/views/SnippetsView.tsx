import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Snippet } from "@termsh/shared";
import { SnippetDrawer } from "@/components/snippets/SnippetDrawer";
import { SnippetLibrary } from "@/components/snippets/SnippetLibrary";
import { DrawerPortal } from "@/components/ui/DrawerPortal";
import { terminalWrite } from "@/lib/terminal/ipc";
import { useNavStore } from "@/stores/navStore";
import { useSessionStore } from "@/stores/sessionStore";
import { useSnippetStore } from "@/stores/snippetStore";

export function SnippetsView() {
  const { t } = useTranslation(["snippets", "common"]);
  const load = useSnippetStore((s) => s.load);
  const loading = useSnippetStore((s) => s.loading);
  const error = useSnippetStore((s) => s.error);
  const snippets = useSnippetStore((s) => s.snippets);
  const save = useSnippetStore((s) => s.save);
  const remove = useSnippetStore((s) => s.remove);

  const setView = useNavStore((s) => s.setView);
  const sessions = useSessionStore((s) => s.sessions);
  const activeSessionId = useSessionStore((s) => s.activeSessionId);

  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Snippet | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return snippets;
    return snippets.filter((s) => {
      const hay = `${s.title}\n${s.body}\n${s.tags.join(",")}`.toLowerCase();
      return hay.includes(q);
    });
  }, [query, snippets]);

  const canSend = Boolean(activeSessionId) && sessions.length > 0;

  const onSend = (snippet: Snippet) => {
    if (!activeSessionId) {
      setView("terminal");
      return;
    }
    terminalWrite(activeSessionId, snippet.body.endsWith("\n") ? snippet.body : `${snippet.body}\n`);
    setView("terminal");
  };

  const onEdit = (snippet: Snippet) => {
    setEditing(snippet);
    setDrawerOpen(true);
  };

  const onNew = () => {
    setEditing(null);
    setDrawerOpen(true);
  };

  const onDelete = async (id: string) => {
    // eslint-disable-next-line no-alert
    if (!confirm(t("deleteConfirm"))) return;
    await remove(id);
  };

  const empty = !loading && filtered.length === 0;

  return (
    <div className="view">
      <header className="view__head view__head--row">
        <div>
          <h1>{t("title")}</h1>
          <p className="view__sub">{t("subtitle")}</p>
        </div>
        <div className="view__head-actions">
          <button type="button" className="btn btn--secondary" onClick={() => setLibraryOpen(true)}>
            {t("library")}
          </button>
          <button type="button" className="btn btn--primary" onClick={onNew}>
            {t("addSnippet")}
          </button>
        </div>
      </header>

      <div className="view__scroll mac-scrollbar">
        {error && <p className="view__empty">{error}</p>}

        <input
          className="snippets-search"
          placeholder={t("searchPlaceholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {loading && <p className="view__empty">{t("loading")}</p>}
        {empty && <p className="view__empty">{t("empty")}</p>}

        <ul className="snippets-list">
          {filtered.map((s) => (
            <li key={s.id} className="snippets-row">
              <button type="button" className="snippets-row__main" onClick={() => onEdit(s)}>
                <div className="snippets-row__title">{s.title}</div>
                <div className="snippets-row__body">{s.body}</div>
                <div className="snippets-row__meta">
                  {s.tags.length > 0 ? s.tags.join(" · ") : t("noTags")}
                </div>
              </button>
              <div className="snippets-row__actions">
                <button
                  type="button"
                  className="btn btn--ghost"
                  disabled={!canSend}
                  onClick={() => onSend(s)}
                  title={canSend ? t("sendTitle") : t("sendDisabledTitle")}
                >
                  {t("send")}
                </button>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => onEdit(s)}
                  title={t("common:actions.edit")}
                >
                  {t("common:actions.edit")}
                </button>
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => void onDelete(s.id)}
                  title={t("common:actions.delete")}
                >
                  {t("common:actions.delete")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <DrawerPortal>
        <SnippetDrawer
          open={drawerOpen}
          snippet={editing}
          onClose={() => setDrawerOpen(false)}
          onSave={(payload) => save(payload)}
        />
      </DrawerPortal>
      <DrawerPortal>
        <SnippetLibrary
          open={libraryOpen}
          onClose={() => setLibraryOpen(false)}
          onAdd={async (payload) => { await save(payload); }}
        />
      </DrawerPortal>
    </div>
  );
}
