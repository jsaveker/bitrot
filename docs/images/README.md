# README image sources

[← Back to the README](../../README.md)

All screenshots were captured on 13 September 2026 at a 1280 × 720 browser viewport. They are actual browser captures, with no compositing or changes to application content.

| File                  | Source                                                        |
| --------------------- | ------------------------------------------------------------- |
| `landing.jpg`         | Live `https://bitrot.sh/` after the entrance animation.       |
| `terminal.jpg`        | Local-only release preview at `/lab`, displaying `help`.      |
| `checksum-lesson.jpg` | Local-only release preview, displaying `lessons 1-checksums`. |

Lab captures use a local-only session and do not upload files or retrieve cloud-file contents.

`bitrot-banner.svg` and `architecture.svg` are original vector illustrations for the documentation. They describe the project and its architecture; they are not application screenshots.

Regenerate the SVG assets from the repository root:

```bash
node scripts/readme-art.mjs
```

The script uses only Node.js built-ins. When replacing screenshots, keep captions and this provenance table aligned with the captured version.
