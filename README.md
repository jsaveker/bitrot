<p align="center">
  <img src="docs/images/bitrot-banner.svg" alt="Bitrot — break a few bits, learn what survives. A cyberpunk data integrity playground." width="100%" />
</p>

<p align="center">
  <strong>A browser-only terminal playground for data decay and integrity lessons.</strong><br />
  Experiment with disposable files on your own device. Flip bits, shuffle text, and learn what survives.
</p>

<p align="center">
  <a href="https://bitrot.sh"><strong>Visit Bitrot ↗</strong></a> ·
  <a href="https://bitrot.sh/lab">Open the lab</a> ·
  <a href="docs/COMMANDS.md">Command guide</a> ·
  <a href="docs/DEVELOPMENT.md">Developer guide</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61dafb?style=flat-square" alt="React 19" />
  <img src="https://img.shields.io/badge/Cloudflare-Pages-f38020?style=flat-square" alt="Cloudflare Pages" />
  <img src="https://img.shields.io/badge/Status-experimental-a78bfa?style=flat-square" alt="Status: experimental" />
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-Apache--2.0-b7f36b?style=flat-square" alt="Apache 2.0 license" /></a>
</p>

![The Bitrot landing page with a glowing terminal, ASCII lettering, and animated corruption status](docs/images/landing.jpg)

## Inside Bitrot

Bitrot lets you deliberately corrupt local files and learn about checksums and backups through a cyberpunk terminal. File processing happens in a browser worker. **File contents and filenames are not uploaded.**

| Explore                                                 | What you can do                                                                      |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| [Data Decay Lab](https://bitrot.sh/lab)                 | Choose a local file, change its bits or text, darken a PNG, and download the result. |
| [Integrity lessons](docs/COMMANDS.md#learn-and-explore) | Read short introductions to checksums and backups in the terminal.                   |
| [Command guide](docs/COMMANDS.md)                       | Learn the file commands and discover the terminal's Easter eggs.                     |

> **Local files, temporary session:** the lab holds files in memory in your current browser tab. Reloading or closing the page clears them. Keep your original files and download any results you want to save. The old cloud archive is retired and its public file endpoints are closed.

## A closer look

<table>
  <tr>
    <td width="50%"><img src="docs/images/terminal.jpg" alt="The local-only terminal showing its help command and available lab commands" /><br /><strong>A real command interface</strong><br />File experiments, lessons, and a few hidden distractions.</td>
    <td width="50%"><img src="docs/images/checksum-lesson.jpg" alt="The checksum lesson displayed inside the Bitrot terminal" /><br /><strong>Learn while you experiment</strong><br />Short explanations of data integrity and recovery.</td>
  </tr>
</table>

Screenshots show the existing application, captured in September 2026. See [image sources](docs/images/README.md) for capture details and reproducible artwork.

## Try the terminal

Open the [lab](https://bitrot.sh/lab), click inside the terminal, and enter:

```text
help
lessons list
lessons 1-checksums
```

For file experiments, use a small throwaway text file or PNG. The `load` command opens a local file picker and returns an ID; `upload` remains an alias for existing users, but sends nothing to a server. Files must be non-empty and no larger than **5 MiB**.

```text
load
list
rot <file-id> --level 2 --mode ascii-shuffle
view <file-id> 0
```

Replace `<file-id>` with the ID returned by `load`. `rot` generates a download from the untouched original and keeps the latest result in this tab. Levels are **0–10**. The tab holds up to **10 files / 20 MiB of originals**, and each transformation has a five-second time limit. Random transformations can produce different results on each run.

| Decay mode      | Effect                            | Current scope                                                        |
| --------------- | --------------------------------- | -------------------------------------------------------------------- |
| `bit-flip`      | Changes random bits in the file.  | Any bytes; the result may no longer open.                            |
| `ascii-shuffle` | Swaps characters in decoded text. | Plain ASCII text; other encodings are rejected.                      |
| `color-drain`   | Darkens PNG colour channels.      | Browser-decodable PNGs up to 4 million pixels, 4096 pixels per side. |

Downloads use opaque binary blobs; the lab never displays uploaded HTML or SVG as web content. There is no cloud storage or scheduled decay. Your originals stay unchanged until you remove them from the tab with `forget <file-id>`.

## Run locally

Use **Node.js 22** and npm, matching the CI environment.

```bash
git clone https://github.com/jsaveker/bitrot.git
cd bitrot
npm ci
npm run dev
```

Open the URL printed by Vite. This starts the frontend and local file experiments. Lesson discovery still needs the small read-only Cloudflare Functions backend. The [developer guide](docs/DEVELOPMENT.md) covers build checks and local Cloudflare previews.

## How it fits together

![Architecture: local file bytes enter tab memory, a browser worker transforms a copy, and the result downloads directly. File data never goes to cloud storage.](docs/images/architecture.svg)

- **Frontend:** React, Vite, Tailwind CSS, Framer Motion, and xterm.js.
- **File processing:** a dedicated browser worker with bounded work and PNG decoding through browser APIs.
- **Hosting:** Cloudflare Pages, with read-only content indexes and explicit rejection of retired cloud-file routes.

## Contribute

Small, focused contributions are welcome. Useful areas include clearer first-run guidance, accessible terminal interactions, image-format support, and reproducible decay experiments. Open an [issue](https://github.com/jsaveker/bitrot/issues) to discuss larger changes, then include the relevant build checks and screenshots in your pull request.

Start with the [developer guide](docs/DEVELOPMENT.md), [terminal reference](docs/COMMANDS.md).

## License

[Apache License 2.0](LICENSE). Created by [Jim Saveker](https://github.com/jsaveker).
