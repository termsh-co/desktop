import type { IconName } from "./termsh-icon.component";

/** SVG inner content for each icon (legacy Icon.tsx parity). */
export const ICON_PATHS: Record<IconName, string> = {
  terminal:
    '<rect x="3" y="4" width="18" height="14" rx="2" /><path d="M7 9l3 3-3 3M12 15h5" />',
  dns:
    '<rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />',
  laptop:
    '<rect x="4" y="5" width="16" height="11" rx="1.5" /><path d="M2 18h20" />',
  add: '<path d="M12 5v14M5 12h14" />',
  home: '<path d="M3 11l9-7 9 7" /><path d="M5 10v10h5v-6h4v6h5V10" />',
  lock:
    '<rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 118 0v3" />',
  lock_open:
    '<rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 018 0" />',
  search: '<circle cx="11" cy="11" r="6" /><path d="M16 16l4 4" />',
  chevron_right: '<path d="M9 6l6 6-6 6" />',
  folder: '<path d="M4 6h6l2 2h8v10H4V6z" />',
  settings:
    '<path d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z" /><path d="M19.4 15a1.7 1.7 0 00.33 1.82l.06.06a2 2 0 01-1.41 3.41h-.17a1.7 1.7 0 00-1.48 1l-.03.07a2 2 0 01-3.4 0l-.03-.07a1.7 1.7 0 00-1.48-1h-.17a2 2 0 01-1.41-3.41l.06-.06A1.7 1.7 0 004.6 15a2 2 0 010-3l.06-.06a1.7 1.7 0 00.33-1.82l-.06-.06A2 2 0 016.28 6.63h.17a1.7 1.7 0 001.48-1l.03-.07a2 2 0 013.4 0l.03.07a1.7 1.7 0 001.48 1h.17a2 2 0 011.41 3.41l-.06.06a1.7 1.7 0 00-.33 1.82 2 2 0 010 3z" />',
  close: '<path d="M6 6l12 12M18 6L6 18" />',
  expand:
    '<path d="M8 3H3v5M16 3h5v5M16 21h5v-5M8 21H3v-5" />',
  grid:
    '<rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />',
  split_vertical:
    '<rect x="4" y="5" width="7" height="14" rx="1.5" /><rect x="13" y="5" width="7" height="14" rx="1.5" />',
  split_horizontal:
    '<rect x="4" y="5" width="16" height="6" rx="1.5" /><rect x="4" y="13" width="16" height="6" rx="1.5" />',
  code: '<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M14 4l-4 16" />',
  key:
    '<path d="M14 10a4 4 0 11-8 0 4 4 0 018 0z" /><path d="M14 10l6 6-2 2-2-2-2 2" />',
  visibility:
    '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" />',
  visibility_off:
    '<path d="M3 3l18 18" /><path d="M10.6 10.6a2 2 0 002.8 2.8" /><path d="M9.9 5.1A10.8 10.8 0 0112 5c6.5 0 10 7 10 7a18.2 18.2 0 01-4.9 5.9" /><path d="M6.1 6.1A18.5 18.5 0 002 12s3.5 7 10 7a10.4 10.4 0 004.1-.8" />',
  edit:
    '<path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z" />',
  cloud: '<path d="M7 18h11a4 4 0 100-8 5.5 5.5 0 00-10.9-1.5A3.5 3.5 0 007 18z" />',
  cloud_off:
    '<path d="M7 18h11a4 4 0 100-8 5.5 5.5 0 00-10.9-1.5A3.5 3.5 0 007 18z" /><path d="M3 3l18 18" />',
  bell:
    '<path d="M6 8a6 6 0 1112 0c0 7 3 8 3 8H3s3-1 3-8" /><path d="M10 21h4" />',
  gear:
    '<circle cx="12" cy="12" r="3" /><path d="M12 1v2M12 21v2M1 12h2M21 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />',
  fingerprint:
    '<path d="M12 11c0-1.1.9-2 2-2s2 .9 2 2" /><path d="M8 11c0-3.3 2.7-6 6-6" /><path d="M6 11c0-4.4 3.6-8 8-8" /><path d="M4 11c0-5.5 4.5-10 10-10" /><path d="M12 15v2" /><path d="M10 17c0 2.2 1.8 4 4 4" /><path d="M8 19c0 3.3 2.7 6 6 6" />',
  face:
    '<circle cx="12" cy="12" r="9" /><circle cx="9" cy="10" r="1" fill="currentColor" stroke="none" /><circle cx="15" cy="10" r="1" fill="currentColor" stroke="none" /><path d="M9 15c1 1.5 2.5 2 3 2s2-.5 3-2" />',
};
