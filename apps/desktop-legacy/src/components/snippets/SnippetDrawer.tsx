import { FormEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Snippet } from "@termsh/shared";
import { Icon } from "@/components/ui/Icon";
import { formatAppError } from "@/lib/errors/appError";

type Props = {
  open: boolean;
  snippet?: Snippet | null;
  onClose: () => void;
  onSave: (payload: { id?: string; title: string; body: string; tags: string[] }) => Promise<unknown>;
};

function toTagList(tags: string): string[] {
  return tags
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 20);
}

export function SnippetDrawer({ open, snippet, onClose, onSave }: Props) {
  const { t } = useTranslation(["snippets", "common"]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tags, setTags] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitle(snippet?.title ?? "");
    setBody(snippet?.body ?? "");
    setTags(snippet?.tags.join(", ") ?? "");
    setSubmitting(false);
    setError(null);
  }, [open, snippet]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError(t("drawer.errors.titleRequired"));
      return;
    }
    if (!body.trim()) {
      setError(t("drawer.errors.bodyRequired"));
      return;
    }

    setSubmitting(true);
    try {
      await onSave({
        id: snippet?.id,
        title: title.trim(),
        body,
        tags: toTagList(tags),
      });
      onClose();
    } catch (err) {
      setError(formatAppError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`drawer-root ${open ? "drawer-root--open" : ""}`} aria-hidden={!open}>
      <button
        type="button"
        className="drawer-root__backdrop"
        aria-label={t("common:actions.close")}
        tabIndex={open ? 0 : -1}
        onClick={onClose}
      />
      <aside
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="snippet-drawer-title"
        aria-hidden={!open}
      >
        <header className="drawer__header">
          <div>
            <h2 id="snippet-drawer-title">
              {snippet ? t("drawer.titleEdit") : t("drawer.titleNew")}
            </h2>
            <p className="drawer__sub">{t("drawer.subtitle")}</p>
          </div>
          <button type="button" className="drawer__close" onClick={onClose} aria-label={t("common:actions.close")}>
            <Icon name="close" size={20} />
          </button>
        </header>

        <form className="drawer__form" onSubmit={onSubmit} autoComplete="off">
          <div className="drawer__body mac-scrollbar">
            <label className="vault-field">
              <span>{t("drawer.titleLabel")}</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("drawer.titlePlaceholder")}
              />
            </label>

            <label className="vault-field">
              <span>{t("drawer.tagsLabel")}</span>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder={t("drawer.tagsPlaceholder")}
              />
            </label>

            <label className="vault-field vault-field--snippet">
              <span>{t("drawer.bodyLabel")}</span>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={t("drawer.bodyPlaceholder")}
                rows={10}
              />
            </label>

            {error && <p className="drawer-error">{error}</p>}
          </div>

          <footer className="drawer__footer">
            <button type="button" className="btn btn--ghost" onClick={onClose} disabled={submitting}>
              {t("common:actions.cancel")}
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={submitting || !title.trim() || !body.trim()}
            >
              {submitting ? t("drawer.saving") : t("common:actions.save")}
            </button>
          </footer>
        </form>
      </aside>
    </div>
  );
}
