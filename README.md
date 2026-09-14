<p align="center">
  <img src="docs/images/bitrot-banner.svg" alt="Bitrot — break a few bits, learn what survives." width="100%" />
</p>

# Bitrot

**Break a few bits. See what survives.** A local-only playground for data decay, checksums, and recovery, built with React, TypeScript, Vite, and Cloudflare Pages.

[Visit Bitrot](https://bitrot.sh) · [Data Decay Lab](https://bitrot.sh/lab) · [Interactive lessons](https://bitrot.sh/learn) · [Command guide](docs/COMMANDS.md) · [Developer guide](docs/DEVELOPMENT.md)

## Explore

- **Playable homepage:** drag across the NASA Earthrise photograph, adjust intensity, and see actual measurements from the transformed copy.
- **Visual workbench:** compare decoded PNGs, inspect highlighted text changes or hex bytes, and see a full-file byte-change map. Choose a bundled sample or a local file.
- **Repeatable experiments:** use a seed, replay the last 12 runs, compare two runs, or copy a link to a bundled-sample recipe. Presets include Fading photograph, Scrambled transmission, and One noisy channel.
- **Interactive lessons:** flip one bit and compare real SHA-256 fingerprints, then save, damage, and restore a tiny working message.
- **Terminal:** open the terminal inside the lab. Its commands and the visual controls operate on the same files and experiment engine. Command history, completion, and the original Easter eggs are available.

## Local files, temporary session

File contents and filenames are not uploaded. Processing runs in a dedicated browser worker. Files and experiment history live only in the current tab and disappear on reload or close. The effects preference is the only persisted browser setting.

Your original stays intact. Each transformation starts from that original; replay history stores settings and measurements, not additional file buffers. Download results you want to keep. Sharing is restricted to bundled sample identifiers and validated settings—never local-file names, IDs, or contents.

Limits: **5 MiB per file**, **10 files / 20 MiB of originals**, **levels 0–10**, and **five seconds per transformation**. PNGs must be browser-decodable, at most 4 million pixels, and no more than 4096 pixels per side. Temporary worker and comparison buffers also consume memory.

| Mode | Effect | Supported input |
| --- | --- | --- |
| `bit-flip` | Flips selected bits with a reproducible seed. The result may stop opening. | Any bytes |
| `ascii-shuffle` | Swaps characters using the seed. | Plain ASCII text |
| `color-drain` | Darkens RGB channels according to intensity. | PNG |

Image previews use decoded PNG pixels on a canvas. Text is escaped. HTML and SVG are never executed or embedded as documents. Downloads remain opaque binary blobs.

RGB intensity is measured from mean channel values. PNG encoding changes can affect many file bytes even when the picture looks similar, so the interface labels pixel measurements separately from the encoded-byte map. Byte modes reproduce exactly for the same original, recipe version, seed, mode, and level. PNG pixel processing is repeatable within the browser; encoded PNG bytes can differ across browser implementations.

The old cloud archive is retired. Its public file routes still return 410, and no scheduled decay runs. Existing stored objects are neither migrated nor deleted by this application.

## Run locally

Use Node.js 22 and npm, matching CI:

```bash
npm ci
npm run dev
```

Open the printed URL. Samples, lessons, visual experiments, and terminal commands work with Vite alone. Lesson content is generated from `content/lessons` before development and production builds.

```bash
npm run typecheck
npm test
npm run build:functions
npm run build
```

See the [browser regression checklist](docs/BROWSER-CHECKS.md) for interactive verification and the [developer guide](docs/DEVELOPMENT.md) for hosting constraints. Automatic branch deployments remain paused; implementation does not change hosting policy.

## Assets and contributions

The Earthrise sample is credited to NASA / Bill Anders. See [sample provenance](public/samples/README.md). Older screenshots in `docs/images` document the original terminal-first interface; they are not screenshots of the redesigned workbench.

Issues and focused pull requests are welcome. Recipe v1 is a compatibility contract: changes to its byte algorithm or bundled sample bytes require a versioning decision and updated fixtures.

Apache 2.0. Created by [Jim Saveker](https://github.com/jsaveker).
