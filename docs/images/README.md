# README screenshots and artwork

[Back to the README](../../README.md)

## Current utility screenshots

Captured from the live [bitrot.sh](https://bitrot.sh) site on **14 September 2026**, at application revision [`1dffdad`](https://github.com/jsaveker/bitrot/commit/1dffdad14ca7f914170606e06f7197ba19913378). These are unmodified browser screenshots: no generated interfaces, composited results, or edited application content. Captures use bundled samples and the built-in lesson message, with no personal files loaded.

| File | Viewport | Page and captured state |
| --- | --- | --- |
| [`utility-overview.jpg`](utility-overview.jpg) | 1440 × 1000 | `/`: Earthrise at colour-drain level 4, with 67.34% mean RGB intensity retained. The sample directory and original/result divider are visible. |
| [`utility-workbench.jpg`](utility-workbench.jpg) | 1440 × 1000 | `/lab?v=1&sample=transmission&mode=ascii-shuffle&level=7&seed=voyager`: original/result text, 49 changed bytes, and 174 changed bits. |
| [`utility-comparison.jpg`](utility-comparison.jpg) | 1440 × 1000 | The same workbench after running ASCII shuffle at levels 7 and 6 with seed `voyager`, then choosing **Compare runs**. Scrolled to show history and both results. |
| [`utility-checksums.jpg`](utility-checksums.jpg) | 1440 × 1050 | `/learn`: after **Flip one bit**, with changed message and SHA-256 fingerprints. |
| [`utility-backups.jpg`](utility-backups.jpg) | 1440 × 1050 | `/learn?lesson=backup`: after saving, damaging, and restoring the message. Both hashes match. |
| [`utility-terminal.jpg`](utility-terminal.jpg) | 1440 × 560 | The workbench terminal, scrolled into view after running `lessons list`. |
| [`utility-mobile.jpg`](utility-mobile.jpg) | 390 × 1100 | `/`: the phone layout, with compact controls above the Earthrise comparison at colour-drain level 4. This is viewport emulation, not a physical-device photograph. |

The [GitHub profile](https://github.com/jsaveker) uses a byte-for-byte copy of `utility-overview.jpg` as `assets/bitrot-utility.jpg` in [jsaveker/jsaveker](https://github.com/jsaveker/jsaveker). Keep the visible screenshot, alt text, description, and profile asset provenance aligned when refreshing it.

### Refresh the captures

1. Confirm the live deployment matches the application revision being documented.
2. Set the viewport from the table and open the listed page. Use only bundled samples or explicitly disposable data.
3. Wait for processing and hash calculations to finish. Reproduce the controls and scroll position described above.
4. Save a native browser screenshot without changing page content or compositing results.
5. Review each image, update this table, and verify the rendered repository README and profile after publishing.

## Historical assets

The following files document the earlier interface and are no longer embedded in the project README:

| File | Original source |
| --- | --- |
| `landing.jpg` | Live homepage on 13 September 2026, at 1280 × 720. |
| `terminal.jpg` | Earlier local-only `/lab` preview displaying `help`, at 1280 × 720. |
| `checksum-lesson.jpg` | Earlier local-only terminal displaying `lessons 1-checksums`, at 1280 × 720. |
| `bitrot-banner.svg` | Original documentation artwork for the earlier neon design. |
| `architecture.svg` | Original diagram of the browser-only file flow. |

The SVG files are illustrations, not application screenshots. `node scripts/readme-art.mjs` regenerates those historical illustrations; it does not capture or update the current screenshots.
