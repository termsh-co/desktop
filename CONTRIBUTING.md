# Contributing to termsh clients

Thank you for contributing to termsh.

## Repositories

| Path | GitHub |
|------|--------|
| `clients/` | [termsh-co/clients](https://github.com/termsh-co/clients) |
| `server/` | [termsh-co/server](https://github.com/termsh-co/server) |
| `ios/` | [termsh-co/ios](https://github.com/termsh-co/ios) |
| `android/` | [termsh-co/android](https://github.com/termsh-co/android) |

## License

By contributing, you agree that your contributions are licensed under the  
[GNU Affero General Public License v3.0](LICENSE) (AGPL-3.0), the same license as the rest of this project.

Do not submit code you do not have the right to license under AGPL-3.0.

## Development

```bash
pnpm install
pnpm dev:desktop
pnpm test
pnpm check:i18n
```

## Git hooks (optional)

```bash
git config core.hooksPath .githooks
```
