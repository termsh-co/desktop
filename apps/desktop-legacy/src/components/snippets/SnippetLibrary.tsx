import { useTranslation } from "react-i18next";
import { Icon } from "@/components/ui/Icon";
import type { SaveSnippetPayload } from "@/lib/snippets/ipc";

const TEMPLATE_IDS = [
  "systemInfo",
  "diskUsage",
  "listeningPorts",
  "dockerContainers",
  "dockerCleanup",
  "gitLog",
  "topProcesses",
  "nginxReload",
  "sslCertCheck",
  "journalErrors",
] as const;

type TemplateId = (typeof TEMPLATE_IDS)[number];

function templatePayload(
  id: TemplateId,
  t: (key: string) => string,
): SaveSnippetPayload {
  const tagsRaw = t(`templates.${id}.tags`);
  return {
    title: t(`templates.${id}.title`),
    body: t(`templates.${id}.body`),
    tags: tagsRaw
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
  };
}

type Props = {
  open: boolean;
  onClose: () => void;
  onAdd: (payload: SaveSnippetPayload) => Promise<void>;
};

export function SnippetLibrary({ open, onClose, onAdd }: Props) {
  const { t } = useTranslation(["snippets", "common"]);

  if (!open) return null;

  return (
    <div className="drawer-root drawer-root--open">
      <button
        type="button"
        className="drawer-root__backdrop"
        tabIndex={open ? 0 : -1}
        onClick={onClose}
      />
      <aside className="drawer drawer--snippets" role="dialog" aria-modal="true" aria-labelledby="snippet-lib-title">
        <header className="drawer__header">
          <div>
            <h2 id="snippet-lib-title">{t("libraryDrawer.title")}</h2>
            <p className="drawer__sub">{t("libraryDrawer.subtitle")}</p>
          </div>
          <button type="button" className="drawer__close" onClick={onClose} aria-label={t("common:actions.close")}>
            <Icon name="close" size={18} />
          </button>
        </header>

        <div className="drawer__body mac-scrollbar">
          <ul className="snippets-list" style={{ border: "none", borderRadius: 0, background: "transparent" }}>
            {TEMPLATE_IDS.map((id) => {
              const tpl = templatePayload(id, t);
              return (
                <li key={id} className="snippets-row">
                  <div className="snippets-row__main" style={{ cursor: "default" }}>
                    <div className="snippets-row__title">{tpl.title}</div>
                    <div className="snippets-row__body">{tpl.body}</div>
                    <div className="snippets-row__meta">{tpl.tags.join(" · ")}</div>
                  </div>
                  <div className="snippets-row__actions">
                    <button
                      type="button"
                      className="btn btn--primary"
                      onClick={() => void onAdd(tpl)}
                    >
                      {t("libraryDrawer.add")}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
    </div>
  );
}
