<p align="center">
  <a href="https://github.com/termsh-co/clients/actions/workflows/ci.yml"><img src="https://github.com/termsh-co/clients/actions/workflows/ci.yml/badge.svg" alt="CI" /></a>
</p>

# termsh clients

Open-source client applications for [termsh](https://termsh.co): desktop, web, browser extension, and CLI.

Native mobile apps live in separate repositories: [ios](https://github.com/termsh-co/ios) · [android](https://github.com/termsh-co/android).

## License

Copyright (C) 2026 termsh contributors.

Licensed under the [GNU Affero General Public License v3.0](LICENSE) (AGPL-3.0).  
See [NOTICE](NOTICE) for the copyright notice and [CONTRIBUTING.md](CONTRIBUTING.md) before submitting changes.

## Layout

```
apps/
  desktop/          Electron + Angular (primary desktop)
  desktop-legacy/   Tauri + React (maintenance until parity)
  web/              Marketing site & downloads (termsh.co)
packages/
  core-napi/        Rust core bindings for Electron
  shared/           → migrating to libs/common
libs/               Shared Angular / TypeScript libraries
crates/
  termsh-core/      Vault, crypto, shared Rust logic
```

## Development

```bash
pnpm install
pnpm dev:desktop      # Electron + Angular (recommended)
pnpm dev:legacy       # Tauri legacy shell
pnpm dev:web          # Marketing web app
```

First install downloads the Electron binary (`postinstall` + `pnpm.onlyBuiltDependencies`).

Native core (optional, for `coreVersion` in desktop):

```bash
pnpm build:napi
```

## Stack

See [STACK.md](STACK.md) and [docs/CLIENTS.md](../docs/CLIENTS.md) for architecture and migration notes.
