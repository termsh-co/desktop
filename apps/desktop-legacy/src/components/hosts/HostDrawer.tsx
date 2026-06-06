import { FormEvent, useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import type { AuthType, Host, HostPlatform, SaveHostPayload } from "@termsh/shared";
import { HOST_PLATFORMS } from "@termsh/shared";
import { HostOsIcon } from "@/components/hosts/HostOsIcon";
import { Icon } from "@/components/ui/Icon";
import { SecretInput } from "@/components/ui/SecretInput";
import { formatAppError } from "@/lib/errors/appError";
import { resolveHostPlatform } from "@/lib/hosts/platform";
import { noAutocapitalize } from "@/lib/noAutocapitalize";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useKeyStore } from "@/stores/keyStore";

const COLORS = ["#001d49", "#248eff", "#5eb0ff", "#1a5fc4", "#69f0ae", "#ffd54f"];

type Props = {
  open: boolean;
  host?: Host | null;
  vaultReady: boolean;
  onClose: () => void;
  onSave: (payload: SaveHostPayload) => Promise<unknown>;
};

export function HostDrawer({ open, host, vaultReady, onClose, onSave }: Props) {
  const { t } = useTranslation(["hosts", "common"]);
  const trapRef = useFocusTrap(open);
  const [name, setName] = useState("");
  const [hostname, setHostname] = useState("");
  const [port, setPort] = useState(22);
  const [username, setUsername] = useState("");
  const [authType, setAuthType] = useState<AuthType>("password");
  const [password, setPassword] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [tags, setTags] = useState("");
  const [group, setGroup] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [platform, setPlatform] = useState<HostPlatform>("linux");
  const [sshKeyId, setSshKeyId] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const keys = useKeyStore((s) => s.keys);
  const loadKeys = useKeyStore((s) => s.load);

  useEffect(() => {
    if (!open) return;
    setName(host?.name ?? "");
    setHostname(host?.hostname ?? "");
    setPort(host?.port ?? 22);
    setUsername(host?.username ?? "");
    setAuthType(host?.authType ?? "password");
    setPassword("");
    setPrivateKey("");
    setTags(host?.tags.join(", ") ?? "");
    setGroup(host?.group ?? "");
    setColor(host?.color ?? COLORS[0]);
    setPlatform(host ? resolveHostPlatform(host) : "linux");
    setSshKeyId("");
    setError(null);
  }, [open, host]);

  useEffect(() => {
    if (!open || !vaultReady) return;
    void loadKeys();
  }, [open, vaultReady, loadKeys]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const hasStoredCredential =
    authType === "password"
      ? Boolean(host?.credentialRef)
      : Boolean(host?.privateKeyRef);

  const needsSecretOnCreate =
    authType === "password"
      ? !host && vaultReady
      : authType === "privateKey"
        ? !host && vaultReady
        : false;

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();

    let savePassword =
      authType === "password" && password.trim() ? password.trim() : undefined;
    let savePrivateKey =
      authType === "privateKey" && privateKey.trim() ? privateKey.trim() : undefined;
    let saveSshKeyId =
      authType === "privateKey" && sshKeyId ? sshKeyId : undefined;

    if (!vaultReady) {
      savePassword = undefined;
      savePrivateKey = undefined;
      saveSshKeyId = undefined;
    }

    if (!host && authType === "password" && vaultReady && !savePassword) {
      setError(t("hosts:drawer.errors.passwordRequired"));
      return;
    }

    if (
      !host &&
      authType === "privateKey" &&
      vaultReady &&
      !savePrivateKey &&
      !saveSshKeyId
    ) {
      setError(t("hosts:drawer.errors.privateKeyRequired"));
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const payload: SaveHostPayload = {
        id: host?.id,
        name: name.trim(),
        hostname: hostname.trim(),
        port: Number(port) || 22,
        username: username.trim(),
        authType,
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        group: group.trim() || undefined,
        color,
        platform,
        sshKeyId: saveSshKeyId,
        password: savePassword,
        privateKey: savePrivateKey,
      };
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(formatAppError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={`drawer-root ${open ? "drawer-root--open" : ""}`}
      aria-hidden={!open}
    >
      <button
        type="button"
        className="drawer-root__backdrop"
        aria-label={t("common:actions.close")}
        tabIndex={open ? 0 : -1}
        onClick={onClose}
      />
      <aside
        ref={trapRef}
        className="drawer drawer--host"
        role="dialog"
        aria-modal="true"
        aria-labelledby="host-drawer-title"
        aria-hidden={!open}
      >
        <header className="drawer__header">
          <div>
            <h2 id="host-drawer-title">{host ? t("drawer.titleEdit") : t("drawer.titleNew")}</h2>
            <p className="drawer__sub">
              {host ? t("drawer.subEdit") : t("drawer.subNew")}
            </p>
          </div>
          <button type="button" className="drawer__close" onClick={onClose} aria-label={t("common:actions.close")}>
            <Icon name="close" size={20} />
          </button>
        </header>

        <form
          id="host-drawer-form"
          className="drawer__body mac-scrollbar"
          aria-describedby={error ? "host-drawer-error" : undefined}
          onSubmit={onSubmit}
          autoComplete="off"
        >
          <label className="vault-field">
            <span>{t("drawer.displayName")}</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder={t("drawer.placeholders.displayName")}
              {...noAutocapitalize}
            />
          </label>
          <label className="vault-field">
            <span>{t("drawer.hostname")}</span>
            <input
              value={hostname}
              onChange={(e) => setHostname(e.target.value)}
              required
              placeholder={t("drawer.placeholders.hostname")}
              autoComplete="off"
              {...noAutocapitalize}
            />
          </label>
          <div className="drawer__row">
            <label className="vault-field">
              <span>{t("drawer.port")}</span>
              <input
                type="number"
                min={1}
                max={65535}
                value={port}
                onChange={(e) => setPort(Number(e.target.value))}
                required
                {...noAutocapitalize}
              />
            </label>
            <label className="vault-field">
              <span>{t("drawer.username")}</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder={t("drawer.placeholders.username")}
                autoComplete="off"
                {...noAutocapitalize}
              />
            </label>
          </div>

          <div className="host-platform-picker">
            <span className="host-platform-picker__label">{t("drawer.platform")}</span>
            <div className="host-platform-picker__grid">
              {HOST_PLATFORMS.map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`host-platform-picker__item ${platform === p ? "host-platform-picker__item--active" : ""}`}
                  title={t(`drawer.platforms.${p}`)}
                  onClick={() => setPlatform(p)}
                >
                  <HostOsIcon platform={p} size={22} />
                </button>
              ))}
            </div>
            <p className="host-platform-picker__hint">{t("drawer.platformHint")}</p>
          </div>

          <fieldset className="modal__fieldset">
            <legend>{t("drawer.authLegend")}</legend>
            <label className="modal__radio">
              <input
                type="radio"
                name="authType"
                checked={authType === "password"}
                onChange={() => setAuthType("password")}
              />
              {t("drawer.authPassword")}
            </label>
            <label className="modal__radio">
              <input
                type="radio"
                name="authType"
                checked={authType === "privateKey"}
                onChange={() => setAuthType("privateKey")}
              />
              {t("drawer.authPrivateKey")}
            </label>
          </fieldset>

          {host && !hasStoredCredential && vaultReady && (
            <p className="host-modal__vault-hint host-modal__vault-hint--warn">
              {t("drawer.noCredentialWarn")}
            </p>
          )}

          {authType === "password" ? (
            <SecretInput
              key={`pwd-${host?.id ?? "new"}-${open}`}
              label={host ? t("drawer.passwordLabel") : t("drawer.passwordLabelNew")}
              value={password}
              onChange={setPassword}
              required={needsSecretOnCreate}
              autoComplete="new-password"
              storedInVault={Boolean(host && hasStoredCredential)}
              placeholder={
                host && hasStoredCredential
                  ? t("drawer.passwordPlaceholderChange")
                  : vaultReady
                    ? undefined
                    : t("drawer.passwordPlaceholderVaultLater")
              }
            />
          ) : (
            <>
              {vaultReady && (
                <label className="vault-field">
                  <span>{t("drawer.savedKey")}</span>
                  <select
                    value={sshKeyId}
                    onChange={(e) => {
                      setSshKeyId(e.target.value);
                      if (e.target.value) setPrivateKey("");
                    }}
                  >
                    <option value="">{t("drawer.savedKeyNone")}</option>
                    {keys.map((k) => (
                      <option key={k.id} value={k.id}>
                        {k.name}
                        {k.tags.length ? ` (${k.tags.join(", ")})` : ""}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <SecretInput
                key={`key-${host?.id ?? "new"}-${open}`}
                label={host ? t("drawer.privateKeyLabel") : t("drawer.privateKeyLabelNew")}
                value={privateKey}
                onChange={(v) => {
                  setPrivateKey(v);
                  if (v.trim()) setSshKeyId("");
                }}
                required={needsSecretOnCreate && !sshKeyId}
                multiline
                rows={5}
                storedInVault={Boolean(host && hasStoredCredential)}
                placeholder={
                  host && hasStoredCredential
                    ? t("drawer.privateKeyPlaceholderChange")
                    : vaultReady
                      ? t("drawer.pemHeaderPlaceholder")
                      : t("drawer.privateKeyPlaceholderVaultLater")
                }
              />
            </>
          )}

          {!vaultReady && (
            <p className="host-modal__vault-hint">
              <Trans i18nKey="drawer.noVaultHint" ns="hosts" components={{ strong: <strong /> }} />
            </p>
          )}

          {host && hasStoredCredential && (
            <p className="host-modal__vault-hint">{t("drawer.keepCredentialHint")}</p>
          )}

          <label className="vault-field">
            <span>{t("drawer.tags")}</span>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder={t("drawer.placeholders.tags")}
              {...noAutocapitalize}
            />
          </label>
          <label className="vault-field">
            <span>{t("drawer.group")}</span>
            <input
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              placeholder={t("drawer.placeholders.group")}
              {...noAutocapitalize}
            />
          </label>

          <div className="modal__colors">
            <span>{t("drawer.colorLabel")}</span>
            <div className="modal__color-row">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`modal__color ${color === c ? "modal__color--active" : ""}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                  aria-label={t("drawer.colorAria", { color: c })}
                />
              ))}
            </div>
          </div>

          {error && <p className="vault-card__error" id="host-drawer-error" role="alert">{error}</p>}

          <footer className="drawer__footer">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              {t("common:actions.cancel")}
            </button>
            <button type="submit" className="btn btn--primary" disabled={submitting}>
              {submitting ? t("drawer.saving") : t("common:actions.save")}
            </button>
          </footer>
        </form>
      </aside>
    </div>
  );
}
