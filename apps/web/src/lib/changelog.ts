export type ChangelogSection = Record<string, string[]>

export type ChangelogRelease = {
  version: string
  date: string | null
  unreleased: boolean
  sections: ChangelogSection
}

export type ChangelogData = {
  generatedAt: string
  appVersion: string
  latestRelease: string | null
  releases: ChangelogRelease[]
}

const SECTION_ORDER = [
  'Added',
  'Changed',
  'Deprecated',
  'Removed',
  'Fixed',
  'Security',
] as const

/** User-facing section titles on the marketing site */
export const SECTION_LABELS: Record<string, string> = {
  Added: "What's new",
  Changed: 'Improvements',
  Deprecated: 'Deprecated',
  Removed: 'Removed',
  Fixed: 'Bug fixes',
  Security: 'Security',
}

export function sectionLabel(name: string): string {
  return SECTION_LABELS[name] ?? name
}

export function orderedSectionEntries(sections: ChangelogSection): [string, string[]][] {
  const seen = new Set<string>()
  const entries: [string, string[]][] = []

  for (const key of SECTION_ORDER) {
    const items = sections[key]
    if (items?.length) {
      entries.push([key, items])
      seen.add(key)
    }
  }

  for (const [key, items] of Object.entries(sections)) {
    if (!seen.has(key) && items.length > 0) entries.push([key, items])
  }

  return entries
}

export function formatReleaseLabel(release: ChangelogRelease): string {
  if (release.unreleased) return 'Unreleased'
  return release.date ? `v${release.version} · ${release.date}` : `v${release.version}`
}

export async function fetchChangelog(): Promise<ChangelogData> {
  const res = await fetch('/changelog.json', { cache: 'no-store' })
  if (!res.ok) throw new Error('Could not load release notes')
  return res.json() as Promise<ChangelogData>
}
