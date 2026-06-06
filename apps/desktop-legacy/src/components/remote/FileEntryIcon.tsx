import type { ReactNode } from "react";
import type { RemoteFileEntry } from "@termsh/shared";
import { fileIconKind, type FileIconKind } from "@/lib/remote/fileIconKind";

type Props = {
  entry: RemoteFileEntry;
  size?: number;
  className?: string;
};

/** macOS tarzı dolu dosya ve klasör ikonları */
export function FileEntryIcon({ entry, size = 16, className = "" }: Props) {
  const kind = fileIconKind(entry);
  return (
    <svg
      className={`fe-entry-icon fe-entry-icon--${kind} ${className}`.trim()}
      width={size}
      height={size}
      viewBox="0 0 16 16"
      aria-hidden
    >
      {ICON_PATHS[kind]}
    </svg>
  );
}

const ICON_PATHS: Record<FileIconKind, ReactNode> = {
  folder: (
    <>
      <path
        fill="currentColor"
        d="M1.75 3.5A1.25 1.25 0 013 2.25h3.1c.33 0 .65.13.88.36l.62.62H13A1.25 1.25 0 0114.25 4.5v8.25A1.25 1.25 0 0113 14H3a1.25 1.25 0 01-1.25-1.25V3.5z"
      />
    </>
  ),
  folder_up: (
    <>
      <path
        fill="currentColor"
        opacity="0.7"
        d="M1.75 3.5A1.25 1.25 0 013 2.25h3.1c.33 0 .65.13.88.36l.62.62H13A1.25 1.25 0 0114.25 4.5v8.25A1.25 1.25 0 0113 14H3a1.25 1.25 0 01-1.25-1.25V3.5z"
      />
      <path
        fill="none"
        stroke="#fff"
        strokeWidth="1.4"
        strokeLinecap="round"
        d="M9 7.5H6.5M6.5 7.5L8 6M6.5 7.5L8 9"
      />
    </>
  ),
  document: (
    <>
      <path fill="var(--fe-icon-doc)" d="M3 1.5h5.5L12 5v8.5a1 1 0 01-1 1H3a1 1 0 01-1-1V2.5a1 1 0 011-1z" />
      <path fill="var(--fe-icon-doc-fold)" d="M8.5 1.5V5H12" />
    </>
  ),
  image: (
    <>
      <path fill="var(--fe-icon-doc)" d="M3 1.5h5.5L12 5v8.5a1 1 0 01-1 1H3a1 1 0 01-1-1V2.5a1 1 0 011-1z" />
      <path fill="var(--fe-icon-doc-fold)" d="M8.5 1.5V5H12" />
      <circle cx="6" cy="7.5" r="1.1" fill="var(--fe-icon-accent-image)" />
      <path
        fill="var(--fe-icon-accent-image)"
        d="M4.5 11l2.2-2.2 1.3 1.3L10 8l1.5 3H4.5z"
      />
    </>
  ),
  video: (
    <>
      <path fill="var(--fe-icon-doc)" d="M3 1.5h5.5L12 5v8.5a1 1 0 01-1 1H3a1 1 0 01-1-1V2.5a1 1 0 011-1z" />
      <path fill="var(--fe-icon-doc-fold)" d="M8.5 1.5V5H12" />
      <path fill="var(--fe-icon-accent-video)" d="M6 7.5l4 2.5-4 2.5V7.5z" />
    </>
  ),
  audio: (
    <>
      <path fill="var(--fe-icon-doc)" d="M3 1.5h5.5L12 5v8.5a1 1 0 01-1 1H3a1 1 0 01-1-1V2.5a1 1 0 011-1z" />
      <path fill="var(--fe-icon-doc-fold)" d="M8.5 1.5V5H12" />
      <path
        fill="var(--fe-icon-accent-audio)"
        d="M7 6.5v4.2a1.2 1.2 0 102.4 0V7.5h1.1v3.2a2.3 2.3 0 11-4.6 0V6.5H7z"
      />
    </>
  ),
  code: (
    <>
      <path fill="var(--fe-icon-doc)" d="M3 1.5h5.5L12 5v8.5a1 1 0 01-1 1H3a1 1 0 01-1-1V2.5a1 1 0 011-1z" />
      <path fill="var(--fe-icon-doc-fold)" d="M8.5 1.5V5H12" />
      <path
        fill="var(--fe-icon-accent-code)"
        d="M5.2 6.8L4 8l1.2 1.2 1-1L6 8l.2-.2-1-1zm4.6 0L11 8l-1.2 1.2-1-1L10 8l.2-.2 1-1z"
      />
    </>
  ),
  archive: (
    <>
      <path fill="var(--fe-icon-doc)" d="M3 1.5h5.5L12 5v8.5a1 1 0 01-1 1H3a1 1 0 01-1-1V2.5a1 1 0 011-1z" />
      <path fill="var(--fe-icon-doc-fold)" d="M8.5 1.5V5H12" />
      <rect x="5" y="7" width="6" height="1.2" rx="0.3" fill="var(--fe-icon-accent-archive)" />
      <rect x="5" y="9" width="6" height="1.2" rx="0.3" fill="var(--fe-icon-accent-archive)" />
      <rect x="5" y="11" width="6" height="1.2" rx="0.3" fill="var(--fe-icon-accent-archive)" />
    </>
  ),
  database: (
    <>
      <ellipse cx="8" cy="4.5" rx="4.5" ry="1.8" fill="var(--fe-icon-accent-db)" />
      <path
        fill="var(--fe-icon-accent-db)"
        d="M3.5 4.5v7c0 1 .9 1.8 2 1.8h5c1.1 0 2-.8 2-1.8v-7"
      />
      <ellipse cx="8" cy="11.5" rx="4.5" ry="1.8" fill="var(--fe-icon-accent-db)" opacity="0.7" />
    </>
  ),
  config: (
    <>
      <path fill="var(--fe-icon-doc)" d="M3 1.5h5.5L12 5v8.5a1 1 0 01-1 1H3a1 1 0 01-1-1V2.5a1 1 0 011-1z" />
      <path fill="var(--fe-icon-doc-fold)" d="M8.5 1.5V5H12" />
      <circle cx="8" cy="9" r="2.2" fill="none" stroke="var(--fe-icon-accent-config)" strokeWidth="1.2" />
      <path fill="var(--fe-icon-accent-config)" d="M8 5.8v1.2M8 11v1.2M5.1 6.5l1 .9M9.9 10.5l1 .9M5.1 11.5l1-.9M9.9 7.5l1-.9" />
    </>
  ),
  text: (
    <>
      <path fill="var(--fe-icon-doc)" d="M3 1.5h5.5L12 5v8.5a1 1 0 01-1 1H3a1 1 0 01-1-1V2.5a1 1 0 011-1z" />
      <path fill="var(--fe-icon-doc-fold)" d="M8.5 1.5V5H12" />
      <path fill="var(--fe-icon-accent-text)" d="M5 7h6v1H5V7zm0 2.5h4.5v1H5v-1z" />
    </>
  ),
  spreadsheet: (
    <>
      <path fill="var(--fe-icon-doc)" d="M3 1.5h5.5L12 5v8.5a1 1 0 01-1 1H3a1 1 0 01-1-1V2.5a1 1 0 011-1z" />
      <path fill="var(--fe-icon-doc-fold)" d="M8.5 1.5V5H12" />
      <path
        fill="var(--fe-icon-accent-sheet)"
        d="M5 6.5h6v5H5v-5zm0 1.7h6v1H5v-1zm0 2h6v1H5v-1z"
      />
    </>
  ),
  pdf: (
    <>
      <path fill="var(--fe-icon-doc)" d="M3 1.5h5.5L12 5v8.5a1 1 0 01-1 1H3a1 1 0 01-1-1V2.5a1 1 0 011-1z" />
      <path fill="var(--fe-icon-doc-fold)" d="M8.5 1.5V5H12" />
      <path
        fill="var(--fe-icon-accent-pdf)"
        d="M5.5 9.5h1.1v2.5c.9-.2 1.5-.7 1.8-1.4.3-.8.3-1.7 0-2.6-.4-1-1.2-1.5-2.4-1.5H5.5v5h1V9.5zm1 0v3.2c.6 0 1-.2 1.2-.5.5-.6.5-1.6 0-2.2-.2-.3-.6-.5-1.2-.5z"
      />
    </>
  ),
  executable: (
    <>
      <path fill="var(--fe-icon-doc)" d="M3 1.5h5.5L12 5v8.5a1 1 0 01-1 1H3a1 1 0 01-1-1V2.5a1 1 0 011-1z" />
      <path fill="var(--fe-icon-doc-fold)" d="M8.5 1.5V5H12" />
      <path fill="var(--fe-icon-accent-exec)" d="M6.5 7.2l3.5 1.8-3.5 1.8V7.2z" />
    </>
  ),
  symlink: (
    <>
      <path
        fill="none"
        stroke="var(--fe-icon-accent-link)"
        strokeWidth="1.3"
        strokeLinecap="round"
        d="M6 10.5l1.5 1.5M9.5 7L11 5.5M7.5 5.5l3 3M5.5 7.5l3 3"
      />
    </>
  ),
  package: (
    <>
      <path fill="var(--fe-icon-accent-package)" d="M8 2L2.5 5v6L8 14l5.5-3V5L8 2z" />
      <path fill="rgba(255,255,255,0.25)" d="M8 2v6l5.5-3V5L8 2z" />
    </>
  ),
  font: (
    <>
      <path fill="var(--fe-icon-doc)" d="M3 1.5h5.5L12 5v8.5a1 1 0 01-1 1H3a1 1 0 01-1-1V2.5a1 1 0 011-1z" />
      <path fill="var(--fe-icon-doc-fold)" d="M8.5 1.5V5H12" />
      <path fill="var(--fe-icon-accent-font)" d="M6 11V6.5h1.2l2.3 4.5H8.2l-.4-.9H6.8l-.4.9H5L6 6.5z" />
    </>
  ),
  unknown: (
    <>
      <path fill="var(--fe-icon-doc)" d="M3 1.5h5.5L12 5v8.5a1 1 0 01-1 1H3a1 1 0 01-1-1V2.5a1 1 0 011-1z" />
      <path fill="var(--fe-icon-doc-fold)" d="M8.5 1.5V5H12" />
      <circle cx="8" cy="9.5" r="1.2" fill="var(--fe-icon-accent-unknown)" />
    </>
  ),
};
