# Stack & migration

| Layer | Technology |
|-------|------------|
| Language | TypeScript |
| UI | Angular 19+ (target 21) |
| Monorepo | Nx + pnpm workspaces |
| Desktop (target) | Electron + Angular (`apps/desktop`) |
| Desktop (legacy) | Tauri + React (`apps/desktop-legacy`) |
| Web (marketing) | Angular SPA (`apps/web`) |
| Native / crypto | `termsh-core` + NAPI (`@termsh/core-napi`) |
| Shared libs | `libs/*` (`@termsh/common`, `@termsh/components`, …) |

```bash
pnpm dev:legacy      # Tauri MVP
pnpm dev:desktop     # Electron + Angular shell
pnpm dev:web         # Marketing site
```

Detaylı plan: maintainer workspace `termsh/docs/CLIENTS.md` (local, push edilmez).
