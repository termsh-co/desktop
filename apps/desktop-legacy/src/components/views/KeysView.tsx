import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { SshKey } from "@termsh/shared";
import { KeyDrawer } from "@/components/keys/KeyDrawer";
import { DrawerPortal } from "@/components/ui/DrawerPortal";
import { useKeyStore } from "@/stores/keyStore";
import { useVaultStore } from "@/stores/vaultStore";

export function KeysView() {
  const { t } = useTranslation(["keys", "common"]);
  const load = useKeyStore((s) => s.load);
  const keys = useKeyStore((s) => s.keys);
  const loading = useKeyStore((s) => s.loading);
  const error = useKeyStore((s) => s.error);
  const save = useKeyStore((s) => s.save);
  const generate = useKeyStore((s) => s.generate);
  const remove = useKeyStore((s) => s.remove);

  const vaultStatus = useVaultStore((s) => s.status);
  const vaultReady = Boolean(vaultStatus?.isSetup && vaultStatus?.isUnlocked);

  const [query, setQuery] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<SshKey | null>(null);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return keys;
    return keys.filter((k) => `${k.name}\n${k.tags.join(",")}`.toLowerCase().includes(q));
  }, [keys, query]);

  const onAdd = () => {
    setEditing(null);
    setDrawerOpen(true);
  };

  const onEdit = (k: SshKey) => {
    setEditing(k);
    setDrawerOpen(true);
  };

  const onDelete = async (id: string) => {
    // eslint-disable-next-line no-alert
    if (!confirm(t("deleteConfirm"))) return;
    await remove(id);
  };

  return (
    <div className="view">
      <header className="view__head view__head--row">
        <div>
          <h1>{t("title")}</h1>
          <p className="view__sub">{t("subtitle")}</p>
        </div>
        <div className="view__head-actions">
          <button type="button" className="btn btn--primary" onClick={onAdd} disabled={!vaultReady}>
            {t("addKey")}
          </button>
        </div>
      </header>

      <div className="view__scroll mac-scrollbar">
        {!vaultReady && <p className="view__empty">{t("vaultLocked")}</p>}

        {error && <p className="view__empty">{error}</p>}

        <input
          className="snippets-search"
          placeholder={t("searchPlaceholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {loading && <p className="view__empty">{t("snippets:loading")}</p>}
        {!loading && filtered.length === 0 && <p className="view__empty">{t("empty")}</p>}

        <ul className="snippets-list">
          {filtered.map((k) => (
            <li key={k.id} className="snippets-row">
              <button type="button" className="snippets-row__main" onClick={() => onEdit(k)} disabled={!vaultReady}>
                <div className="snippets-row__title">{k.name}</div>
                <div className="snippets-row__meta">
                  {k.tags.length > 0 ? k.tags.join(" · ") : t("snippets:noTags")}
                </div>
              </button>
              <div className="snippets-row__actions">
                <button type="button" className="btn btn--ghost" onClick={() => onEdit(k)} disabled={!vaultReady}>
                  {t("common:actions.edit")}
                </button>
                <button type="button" className="btn btn--ghost" onClick={() => void onDelete(k.id)} disabled={!vaultReady}>
                  {t("common:actions.delete")}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <DrawerPortal>
        <KeyDrawer
          open={drawerOpen}
          keyItem={editing}
          onClose={() => setDrawerOpen(false)}
          onSave={(payload) => save(payload)}
          onGenerate={(payload) => generate(payload)}
        />
      </DrawerPortal>
    </div>
  );
}
