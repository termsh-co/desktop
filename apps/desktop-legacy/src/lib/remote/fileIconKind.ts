import type { RemoteFileEntry } from "@termsh/shared";
import { isDirectoryEntry } from "@/lib/remote/entries";

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
  // images
  png: "image",
  jpg: "image",
  jpeg: "image",
  gif: "image",
  webp: "image",
  svg: "image",
  ico: "image",
  bmp: "image",
  heic: "image",
  // video
  mp4: "video",
  mov: "video",
  avi: "video",
  mkv: "video",
  webm: "video",
  m4v: "video",
  // audio
  mp3: "audio",
  wav: "audio",
  flac: "audio",
  aac: "audio",
  ogg: "audio",
  m4a: "audio",
  // code
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
  // archive
  zip: "archive",
  tar: "archive",
  gz: "archive",
  tgz: "archive",
  bz2: "archive",
  xz: "archive",
  rar: "archive",
  "7z": "archive",
  // data
  sql: "database",
  db: "database",
  sqlite: "database",
  csv: "spreadsheet",
  tsv: "spreadsheet",
  xls: "spreadsheet",
  xlsx: "spreadsheet",
  // config / markup
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
  // text
  txt: "text",
  md: "text",
  markdown: "text",
  log: "text",
  rtf: "text",
  // docs
  pdf: "pdf",
  doc: "document",
  docx: "document",
  // packages
  dmg: "package",
  pkg: "package",
  deb: "package",
  rpm: "package",
  app: "package",
  exe: "executable",
  msi: "executable",
  // fonts
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
