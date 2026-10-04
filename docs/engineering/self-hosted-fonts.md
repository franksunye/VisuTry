# Self-hosted font provenance

Production layouts use the pinned Fontsource WOFF2 variable-font packages so Next.js builds do not fetch font CSS or binaries from Google Fonts.

| Family | Package | Package version | Upstream source | License |
| --- | --- | --- | --- | --- |
| Inter Variable | `@fontsource-variable/inter` | `5.3.0` | Inter 4.001, distributed by Google Fonts / Fontsource | SIL Open Font License 1.1 |
| Noto Sans Arabic Variable | `@fontsource-variable/noto-sans-arabic` | `5.3.0` | Noto Sans Arabic 2.012, distributed by Google Fonts / Fontsource | SIL Open Font License 1.1 |

Both package versions and npm integrity hashes are pinned in `package-lock.json`. Their `LICENSE` files are shipped in the installed packages. The upstream repositories and license texts are available at:

- [Inter on Google Fonts](https://github.com/google/fonts/tree/main/ofl/inter) · [OFL text](https://github.com/google/fonts/blob/main/ofl/inter/OFL.txt)
- [Noto Sans Arabic on Google Fonts](https://github.com/google/fonts/tree/main/ofl/notosansarabic) · [OFL text](https://github.com/google/fonts/blob/main/ofl/notosansarabic/OFL.txt)
- [Fontsource Inter package details](https://fontsource.org/fonts/inter/about)
- [Fontsource Noto Sans Arabic package details](https://fontsource.org/fonts/noto-sans-arabic/about)

The layouts import the packages' normal variable-weight CSS (`wght.css`), which declares `font-display: swap` and Unicode ranges. This keeps font requests local and allows the browser to fetch only the WOFF2 subset matching the page's characters. `--font-inter` and `--font-arabic` remain the application CSS variables; Arabic font CSS is not preloaded, matching the previous Arabic-only, `preload: false` behavior. Google Tag Manager and Analytics connection hints are independent and remain unchanged.

To upgrade a font package, review the new package's upstream font revision and license, update the pinned dependency/lockfile, then rerun the local font contract, English and Arabic browser smoke checks, and both Next build targets with the Google Fonts mock guard enabled.
