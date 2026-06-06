import { FormEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { SshKey } from "@termsh/shared";
import { formatAppError } from "@/lib/errors/appError";
import type { GenerateKeyResult } from "@/lib/keys/ipc";
import { Icon } from "@/components/ui/Icon";

type AddMode = "import" | "generate";

type Props = {
  open: boolean;
  keyItem?: SshKey | null;
  onClose: () => void;
  onSave: (payload: { id?: string; name: string; privateKeyPem?: string; tags: string[] }) => Promise<unknown>;
  onGenerate?: (payload: {
    name: string;
    algorithm: "ed25519" | "rsa";
    tags: string[];
  }) => Promise<GenerateKeyResult>;
};

function toTagList(tags: string): string[] {
  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 20);
}

export function KeyDrawer({ open, keyItem, onClose, onSave, onGenerate }: Props) {
  const { t } = useTranslation(["keys", "common"]);
  const [addMode, setAddMode] = useState<AddMode>("generate");
  const [name, setName] = useState("");
  const [privateKeyPem, setPrivateKeyPem] = useState("");
  const [algorithm, setAlgorithm] = useState<"ed25519" | "rsa">("ed25519");
  const [tags, setTags] = useState("");
  const [generatedPublicKey, setGeneratedPublicKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setAddMode("generate");
    setName(keyItem?.name ?? "");
    setPrivateKeyPem("");
    setAlgorithm("ed25519");
    setTags(keyItem?.tags.join(", ") ?? "");
    setGeneratedPublicKey(null);
    setSubmitting(false);
    setError(null);
  }, [open, keyItem]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const copyPublicKey = async () => {
    if (!generatedPublicKey) return;
    try {
      await navigator.clipboard.writeText(generatedPublicKey);
    } catch {
      setError(t("drawer.errors.copyFailed"));
    }
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError(t("drawer.errors.nameRequired"));
      return;
    }

    if (keyItem) {
      setSubmitting(true);
      try {
        await onSave({
          id: keyItem.id,
          name: name.trim(),
          privateKeyPem: privateKeyPem.trim() ? privateKeyPem.trim() : undefined,
          tags: toTagList(tags),
        });
        onClose();
      } catch (err) {
        setError(formatAppError(err));
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (addMode === "generate") {
      if (!onGenerate) {
        setError(t("drawer.errors.generateUnavailable"));
        return;
      }
      setSubmitting(true);
      try {
        const result = await onGenerate({
          name: name.trim(),
          algorithm,
          tags: toTagList(tags),
        });
        setGeneratedPublicKey(result.publicKeyPem);
      } catch (err) {
        setError(formatAppError(err));
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!privateKeyPem.trim()) {
      setError(t("drawer.errors.privateKeyRequired"));
      return;
    }

    setSubmitting(true);
    try {
      await onSave({
        name: name.trim(),
        privateKeyPem: privateKeyPem.trim(),
        tags: toTagList(tags),
      });
      onClose();
    } catch (err) {
      setError(formatAppError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const title = keyItem
    ? t("drawer.titleEdit")
    : generatedPublicKey
      ? t("drawer.titleCreated")
      : t("drawer.titleAdd");

  return (
    <div className={`drawer-root ${open ? "drawer-root--open" : ""}`} aria-hidden={!open}>
      <button
        type="button"
        className="drawer-root__backdrop"
        aria-label={t("common:actions.close")}
        tabIndex={open ? 0 : -1}
        onClick={onClose}
      />
      <aside className="drawer" role="dialog" aria-modal="true" aria-labelledby="key-drawer-title" aria-hidden={!open}>
        <header className="drawer__header">
          <div>
            <h2 id="key-drawer-title">{title}</h2>
            <p className="drawer__sub">
              {generatedPublicKey ? t("drawer.subtitleCreated") : t("drawer.subtitleStored")}
            </p>
          </div>
          <button type="button" className="drawer__close" onClick={onClose} aria-label={t("common:actions.close")}>
            <Icon name="close" size={20} />
          </button>
        </header>

        {generatedPublicKey ? (
          <div className="drawer__body mac-scrollbar">
            <label className="vault-field">
              <span>{t("drawer.publicKeyLabel")}</span>
              <textarea value={generatedPublicKey} readOnly rows={4} />
            </label>
            {error && <p className="drawer-error">{error}</p>}
            <footer className="drawer__footer">
              <button type="button" className="btn btn--ghost" onClick={() => void copyPublicKey()}>
                {t("common:actions.copy")}
              </button>
              <button type="button" className="btn btn--primary" onClick={onClose}>
                {t("drawer.done")}
              </button>
            </footer>
          </div>
        ) : (
          <form className="drawer__body mac-scrollbar" onSubmit={onSubmit} autoComplete="off">
            {!keyItem && (
              <div className="drawer__row" role="tablist" aria-label={t("drawer.modeAria")}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={addMode === "generate"}
                  className={`btn ${addMode === "generate" ? "btn--primary" : "btn--ghost"}`}
                  onClick={() => setAddMode("generate")}
                >
                  {t("drawer.generate")}
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={addMode === "import"}
                  className={`btn ${addMode === "import" ? "btn--primary" : "btn--ghost"}`}
                  onClick={() => setAddMode("import")}
                >
                  {t("drawer.import")}
                </button>
              </div>
            )}

            <label className="vault-field">
              <span>{t("drawer.nameLabel")}</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("drawer.namePlaceholder")} />
            </label>

            <label className="vault-field">
              <span>{t("drawer.tagsLabel")}</span>
              <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder={t("drawer.tagsPlaceholder")} />
            </label>

            {!keyItem && addMode === "generate" && (
              <label className="vault-field">
                <span>{t("drawer.algorithmLabel")}</span>
                <select value={algorithm} onChange={(e) => setAlgorithm(e.target.value as "ed25519" | "rsa")}>
                  <option value="ed25519">{t("drawer.algorithmEd25519")}</option>
                  <option value="rsa">{t("drawer.algorithmRsa")}</option>
                </select>
              </label>
            )}

            {(!keyItem && addMode === "import") || keyItem ? (
              <label className="vault-field">
                <span>{t("drawer.privateKeyLabel")}</span>
                <textarea
                  value={privateKeyPem}
                  onChange={(e) => setPrivateKeyPem(e.target.value)}
                  placeholder={
                    keyItem ? t("drawer.privateKeyPlaceholderRotate") : t("drawer.privateKeyPlaceholderNew")
                  }
                  rows={10}
                />
              </label>
            ) : null}

            {error && <p className="drawer-error">{error}</p>}

            <footer className="drawer__footer">
              <button type="button" className="btn btn--ghost" onClick={onClose} disabled={submitting}>
                {t("common:actions.cancel")}
              </button>
              <button type="submit" className="btn btn--primary" disabled={submitting || !name.trim()}>
                {submitting
                  ? keyItem || addMode === "import"
                    ? t("drawer.saving")
                    : t("drawer.generating")
                  : keyItem
                    ? t("common:actions.save")
                    : addMode === "generate"
                      ? t("drawer.generate")
                      : t("common:actions.save")}
              </button>
            </footer>
          </form>
        )}
      </aside>
    </div>
  );
}
