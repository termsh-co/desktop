/** Routes that use PageHero (gradient band under navbar). Add new sub-pages here. */
export const PAGE_HERO_PATHS = [
  '/enterprise',
  '/pricing',
  '/terms',
  '/privacy',
  '/about',
  '/blog',
  '/brand',
  '/security',
  '/status',
  '/trust',
  '/changelog',
] as const

export type PageHeroPath = (typeof PAGE_HERO_PATHS)[number]

export function usesPageHero(pathname: string): boolean {
  return (PAGE_HERO_PATHS as readonly string[]).includes(pathname)
}
