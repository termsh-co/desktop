import { listen } from "@tauri-apps/api/event";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Host, Session } from "@termsh/shared";
import { Icon } from "@/components/ui/Icon";
import { SecretInput } from "@/components/ui/SecretInput";
import { formatAppError } from "@/lib/errors/appError";
import { spawnSshShell } from "@/lib/terminal/ipc";
import { useHostStore } from "@/stores/hostStore";
import { useNavStore } from "@/stores/navStore";
import { useSessionStore } from "@/stores/sessionStore";
import { useVaultStore } from "@/stores/vaultStore";

type SshSessionStateEvent = {
  sessionId: string;
  state: string;
  error?: string;
};

const CONNECT_TIMEOUT_MS = 20_000;

type Props = {
  session: Session;
  active: boolean;
};

export function SshConnectScreen({ session, active }: Props) {
  const { t } = useTranslation(["terminal", "common"]);
  const host = useHostStore((s) => s.hosts.find((h) => h.id === session.hostId));
  const vaultStatus = useVaultStore((s) => s.status);
  const vaultReady = Boolean(vaultStatus?.isSetup && vaultStatus?.isUnlocked);
  const markSshConnecting = useSessionStore((s) => s.markSshConnecting);
  const markSshReady = useSessionStore((s) => s.markSshReady);
  const markSshFailed = useSessionStore((s) => s.markSshFailed);
  const closeSession = useSessionStore((s) => s.closeSession);
  const openHostDrawer = useNavStore((s) => s.openHostDrawer);
  const setView = useNavStore((s) => s.setView);

  const [connectPassword, setConnectPassword] = useState("");
  const [connecting, setConnecting] = useState(false);
  const autoStartedRef = useRef(false);

  const phase = session.sshPhase ?? "connecting";
  const isFailed = phase === "failed";
  const isPasswordHost = host?.authType === "password";
  const hasStoredPassword = Boolean(host?.credentialRef);
  const needsPasswordInput = isPasswordHost && !hasStoredPassword;
  const canAutoConnect = Boolean(host) && (!isPasswordHost || (vaultReady && !needsPasswordInput));

  const showPasswordForm = isPasswordHost && (needsPasswordInput || isFailed);

  const preflightError = useCallback(
    (h: Host): string | null => {
      const needsVault = Boolean(h.credentialRef || h.privateKeyRef);
      if (needsVault && !vaultReady) {
        return t("connect.vaultLocked");
      }
      return null;
    },
    [t, vaultReady],
  );

  const errorMessage = session.sshError
    ? formatAppError(session.sshError)
    : t("connect.defaultError");

  const runConnect = useCallback(
    async (passwordOverride?: string) => {
      if (!host) return;

      const preflight = preflightError(host);
      if (preflight) {
        markSshFailed(session.id, preflight);
        setConnecting(false);
        return;
      }

      const pwd =
        passwordOverride?.trim() ||
        (showPasswordForm ? connectPassword.trim() : "") ||
        undefined;

      if (needsPasswordInput && !pwd) {
        markSshFailed(session.id, t("connect.passwordRequired"));
        setConnecting(false);
        return;
      }

      setConnecting(true);
      markSshConnecting(session.id);

      try {
        await spawnSshShell(session.id, host.id, 120, 32, pwd);
      } catch (err) {
        markSshFailed(session.id, formatAppError(err));
        setConnecting(false);
      }
    },
    [
      host,
      preflightError,
      session.id,
      showPasswordForm,
      connectPassword,
      needsPasswordInput,
      markSshConnecting,
      markSshFailed,
      t,
    ],
  );

  useEffect(() => {
    if (!active || !host || phase !== "connecting") return;
    if (autoStartedRef.current) return;
    if (!canAutoConnect) return;

    autoStartedRef.current = true;
    void runConnect();
  }, [active, host, phase, canAutoConnect, runConnect]);

  useEffect(() => {
    if (!active || !connecting) return;

    const timer = window.setTimeout(() => {
      if (useSessionStore.getState().sessions.find((s) => s.id === session.id)?.sshPhase === "connecting") {
        markSshFailed(session.id, t("connect.timeout"));
        setConnecting(false);
        autoStartedRef.current = false;
      }
    }, CONNECT_TIMEOUT_MS);

    return () => window.clearTimeout(timer);
  }, [active, connecting, session.id, markSshFailed, t]);

  useEffect(() => {
    if (!active) return;

    const unlisten = listen<SshSessionStateEvent>("ssh-session-state", (event) => {
      if (event.payload.sessionId !== session.id) return;
      if (event.payload.state === "connected") {
        setConnecting(false);
        markSshReady(session.id);
      } else if (event.payload.state === "failed") {
        setConnecting(false);
        autoStartedRef.current = false;
        markSshFailed(session.id, event.payload.error ?? t("connect.failed"));
      }
    });

    return () => {
      void unlisten.then((fn) => fn());
    };
  }, [active, session.id, markSshReady, markSshFailed, t]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    autoStartedRef.current = true;
    void runConnect(connectPassword);
  };

  if (!host) {
    return (
      <div className="connect-overlay connect-overlay--active">
        <div className="connect-center">
          <p className="connect-center__error">{t("connect.hostNotFound")}</p>
          <button type="button" className="btn btn--ghost" onClick={() => void closeSession(session.id)}>
            {t("common:actions.close")}
          </button>
        </div>
      </div>
    );
  }

  const sshLabel = `${host.hostname}:${host.port}`;
  const busy = connecting || (phase === "connecting" && canAutoConnect);

  if (busy && !showPasswordForm && !isFailed) {
    return (
      <div className="connect-overlay connect-overlay--active">
        <div className="connect-center">
          <div className="connect-center__host">{host.name}</div>
          <div className="connect-center__addr">{sshLabel}</div>
          <div className="connect-center__dots" aria-hidden>
            <span />
            <span />
            <span />
          </div>
          <p className="connect-center__label">{t("connect.connecting")}</p>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => void closeSession(session.id)}
          >
            {t("common:actions.cancel")}
          </button>
        </div>
      </div>
    );
  }

  if (isFailed) {
    return (
      <div className="connect-overlay connect-overlay--active">
        <div className="connect-center">
          <div className="connect-center__host">{host.name}</div>
          <div className="connect-center__addr">{sshLabel}</div>
          <p className="connect-center__fail-title">{t("connect.failed")}</p>
          <p className="connect-center__fail-msg">{errorMessage}</p>
          <div className="connect-center__actions">
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => {
                autoStartedRef.current = false;
                markSshConnecting(session.id);
                void runConnect();
              }}
            >
              {t("connect.retry")}
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => {
                openHostDrawer(host);
                setView("hosts");
              }}
            >
              {t("connect.editHost")}
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => void closeSession(session.id)}
            >
              {t("common:actions.close")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="connect-overlay connect-overlay--active">
      <div className="connect-card">
        <header className="connect-card__head">
          <div
            className="connect-card__avatar"
            style={host.color ? { backgroundColor: host.color } : undefined}
          >
            <Icon name="dns" size={22} />
          </div>
          <div className="connect-card__meta">
            <h2 className="connect-card__name">{host.name}</h2>
            <p className="connect-card__addr">{sshLabel}</p>
            <p className="connect-card__user">{host.username}</p>
          </div>
        </header>

        {busy && (
          <div className="connect-card__dots" aria-hidden>
            <span />
            <span />
            <span />
          </div>
        )}

        <form className="connect-card__form" onSubmit={onSubmit}>
          <SecretInput
            label={t("connect.passwordLabel")}
            value={connectPassword}
            onChange={setConnectPassword}
            autoComplete="current-password"
            storedInVault={hasStoredPassword}
            placeholder={
              hasStoredPassword ? t("connect.passwordPlaceholderStored") : t("connect.passwordPlaceholderEnter")
            }
            disabled={busy}
          />
          <button type="submit" className="btn btn--primary connect-card__submit" disabled={busy}>
            {busy ? t("connect.connectingButton") : t("connect.connectButton")}
          </button>
        </form>

        {!busy && <p className="connect-card__hint">{t("connect.hint")}</p>}

        <footer className="connect-card__footer">
          <button type="button" className="btn btn--ghost" onClick={() => void closeSession(session.id)}>
            {t("common:actions.close")}
          </button>
        </footer>
      </div>
    </div>
  );
}
