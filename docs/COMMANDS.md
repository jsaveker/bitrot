# Terminal guide

[← Back to the README](../README.md)

Open the [lab](https://bitrot.sh/lab), click inside the terminal, and press **Enter** after each command. Files stay in memory in this tab. Reloading or closing the page clears them.

## Learn and explore

| Command                     | Behaviour                       |
| --------------------------- | ------------------------------- |
| `help`                      | List commands and usage.        |
| `lessons` or `lessons list` | List the two available lessons. |
| `lessons 1-checksums`       | Read the checksum introduction. |
| `lessons 2-backups`         | Read the backup introduction.   |
| `clear`                     | Clear the terminal display.     |
| `exit`                      | Return to the landing page.     |

## Local file experiments

| Command                         | Behaviour                                                                                            |
| ------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `load`                          | Choose a local file. Its bytes and filename are not uploaded.                                        |
| `upload`                        | Compatibility alias for `load`; no cloud upload occurs.                                              |
| `list`                          | List only files held in this tab.                                                                    |
| `view <id> [level]`             | Download the original (level 0) or the latest generated result.                                      |
| `rot <id> --level N [--mode M]` | Transform a copy of the original locally, retain the latest result, and download it.                 |
| `freeze <id>`                   | Explain that local files never decay automatically.                                                  |
| `forget <id>`                   | Remove the file and its latest result from tab memory. Leaves the original on your device unchanged. |

Replace `<id>` with a returned file ID. Decay levels are **0–10**. Modes are `bit-flip`, `ascii-shuffle`, and `color-drain`. Text shuffling requires ASCII; colour drain requires a browser-decodable PNG. Downloads are opaque bytes and are never rendered as HTML in the lab.

Limits: **5 MiB per file**, **10 files**, **20 MiB total original data**, **5 seconds per transformation**, and **one transformation at a time**. PNGs must be at most 4 million pixels and 4096 pixels per side. Only the original and latest result are kept; download results you want to save.

The public cloud-file archive has been retired. Old file IDs cannot be opened through the website. No migration or deletion of previously stored cloud files occurs when you use the local lab.

## A few distractions

Try `cow`, `doge`, `parrot`, `xyzzy`, `id10t`, or `sudo make me a sandwich`. The `matrix` animation stops when you press a key. After 30 seconds without input, the terminal displays a screen-burn animation; typing resumes the session.
