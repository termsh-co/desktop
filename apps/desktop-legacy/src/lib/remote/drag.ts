export const MIME_LOCAL_PATH = "application/x-termsh-local-path";
export const MIME_REMOTE_PATH = "application/x-termsh-remote-path";

export function setLocalDragData(dataTransfer: DataTransfer, path: string) {
  dataTransfer.setData(MIME_LOCAL_PATH, path);
  dataTransfer.setData("text/plain", path);
  dataTransfer.effectAllowed = "copy";
}

export function setRemoteDragData(dataTransfer: DataTransfer, path: string) {
  dataTransfer.setData(MIME_REMOTE_PATH, path);
  dataTransfer.setData("text/plain", path);
  dataTransfer.effectAllowed = "copy";
}

export function readLocalDragPath(dataTransfer: DataTransfer): string | null {
  const raw = dataTransfer.getData(MIME_LOCAL_PATH);
  return raw || null;
}

export function readRemoteDragPath(dataTransfer: DataTransfer): string | null {
  const raw = dataTransfer.getData(MIME_REMOTE_PATH);
  return raw || null;
}

/** Finder / masaüstünden bırakılan dosyalar (Tauri webview path alanı) */
export function readDroppedFilePaths(dataTransfer: DataTransfer): string[] {
  const paths: string[] = [];
  if (dataTransfer.files?.length) {
    for (const file of dataTransfer.files) {
      const withPath = file as File & { path?: string };
      if (withPath.path) paths.push(withPath.path);
    }
  }
  return paths;
}
