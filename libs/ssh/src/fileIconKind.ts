import type { RemoteFileEntry } from "@termsh/common";
import { isDirectoryEntry } from "./remote-format";

export type FileIconKind =
  | "folder"
  | "folder_up"
  | "document"
  | "image"
  | "video"
  | "audio"
  | "code"
  | "archive"
  | "database"
  | "config"
  | "text"
  | "spreadsheet"
  | "pdf"
  | "executable"
  | "symlink"
  | "package"
  | "font"
  | "unknown";

const EXT_MAP: Record<string, FileIconKind> = {
  png: "image",
  jpg: "image",
  jpeg: "image",
  gif: "image",
  webp: "image",
  svg: "image",
  ico: "image",
  bmp: "image",
  heic: "image",
  mp4: "video",
  mov: "video",
  avi: "video",
  mkv: "video",
  webm: "video",
  m4v: "video",
  mp3: "audio",
  wav: "audio",
  flac: "audio",
  aac: "audio",
  ogg: "audio",
  m4a: "audio",
  js: "code",
  jsx: "code",
  ts: "code",
  tsx: "code",
  py: "code",
  rs: "code",
  go: "code",
  java: "code",
  c: "code",
  cpp: "code",
  h: "code",
  cs: "code",
  rb: "code",
  php: "code",
  swift: "code",
  kt: "code",
  sh: "executable",
  bash: "executable",
  zsh: "executable",
  zip: "archive",
  tar: "archive",
  gz: "archive",
  tgz: "archive",
  bz2: "archive",
  xz: "archive",
  rar: "archive",
  "7z": "archive",
  sql: "database",
  db: "database",
  sqlite: "database",
  csv: "spreadsheet",
  tsv: "spreadsheet",
  xls: "spreadsheet",
  xlsx: "spreadsheet",
  json: "config",
  yaml: "config",
  yml: "config",
  toml: "config",
  xml: "config",
  html: "code",
  htm: "code",
  css: "code",
  scss: "code",
  env: "config",
  ini: "config",
  plist: "config",
  txt: "text",
  md: "text",
  markdown: "text",
  log: "text",
  rtf: "text",
  pdf: "pdf",
  doc: "document",
  docx: "document",
  dmg: "package",
  pkg: "package",
  deb: "package",
  rpm: "package",
  app: "package",
  exe: "executable",
  msi: "executable",
  ttf: "font",
  otf: "font",
  woff: "font",
  woff2: "font",
};

export function fileIconKind(entry: RemoteFileEntry): FileIconKind {
  if (entry.name === "..") return "folder_up";
  if (isDirectoryEntry(entry)) return "folder";
  if (entry.kind === "symlink") return "symlink";

  const dot = entry.name.lastIndexOf(".");
  if (dot <= 0 || dot >= entry.name.length - 1) {
    return entry.kind === "file" ? "document" : "unknown";
  }

  const ext = entry.name.slice(dot + 1).toLowerCase();
  return EXT_MAP[ext] ?? "document";
}
