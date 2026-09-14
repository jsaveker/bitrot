# README image sources

[← Back to the README](../../README.md)

All screenshots were captured on 13 September 2026 at a 1280 × 720 browser viewport. They are actual browser captures, with no compositing or changes to application content.

| File                     | Source                                                                               |
| ------------------------ | ------------------------------------------------------------------------------------ |
| `landing.jpg`            | Live `https://bitrot.sh/` after the entrance animation.                              |
| `terminal.jpg`           | Live `https://bitrot.sh/lab`, displaying `help`.                                     |
| `checksum-lesson.jpg`    | Live lab, displaying `lessons 1-checksums`.                                          |
| `attack-flow.jpg`        | Live `/attack/browser_remote_debugging_flow_simple`.                                 |
| `incident-dashboard.jpg` | Local `/inc` at source commit `f26d458`, displaying the bundled historical incident. |

The screenshot session did not upload files or retrieve user-uploaded content. The incident example was already included in the public repository.

`bitrot-banner.svg` and `architecture.svg` are original vector illustrations for the documentation. They describe the project and its architecture; they are not application screenshots.

Regenerate the SVG assets from the repository root:

```bash
node scripts/readme-art.mjs
```

The script uses only Node.js built-ins. When replacing screenshots, keep captions and this provenance table aligned with the captured version.
