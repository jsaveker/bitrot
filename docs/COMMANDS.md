# Terminal guide

[← Back to the README](../README.md)

Open the [lab](https://bitrot.sh/lab), click inside the terminal, type a command, and press **Enter**. Start with `help`. The terminal is a browser interface; it does not provide a shell on your computer.

## Learn and explore

| Command                     | Behaviour                       |
| --------------------------- | ------------------------------- |
| `help`                      | List commands and usage.        |
| `lessons` or `lessons list` | List the two available lessons. |
| `lessons 1-checksums`       | Read the checksum introduction. |
| `lessons 2-backups`         | Read the backup introduction.   |
| `clear`                     | Clear the terminal display.     |
| `exit`                      | Return to the landing page.     |

Lesson discovery requires the backend. With Vite alone, read the lesson files under [`public/lessons`](../public/lessons) instead.

## File experiments

Use a [local lab](DEVELOPMENT.md#run-the-local-lab) with a small disposable sample. The hosted lab is experimental and shared, with no private user workspaces or guaranteed deletion period.

| Command                         | Behaviour                                                                                       |
| ------------------------------- | ----------------------------------------------------------------------------------------------- |
| `upload`                        | Open a file picker and store the original as level 0. Accepts non-empty files up to 5 MiB.      |
| `list`                          | List metadata from the shared archive, including file IDs.                                      |
| `view <id> [level]`             | Retrieve a saved level; defaults to the latest saved level.                                     |
| `rot <id> --level N [--mode M]` | Generate a download by repeatedly transforming the original. Does not save a new archive level. |
| `freeze <id>`                   | Request that scheduled decay stops for a record. Does not create or download a backup.          |

Replace `<id>` with a returned file ID. Start with levels **1–3** and small samples. Available transformations are `bit-flip`, `ascii-shuffle`, and `color-drain`; see [format boundaries](DEVELOPMENT.md#current-boundaries) before choosing one.

Random transformations can differ between runs, and bit-flipping may make a file unreadable. Always retain an untouched original outside the lab.

## A few distractions

Try `cow`, `doge`, `parrot`, `xyzzy`, `id10t`, or `sudo make me a sandwich`. The `matrix` animation stops when you press a key. After 30 seconds without input, the terminal displays a screen-burn animation; typing resumes the session.

## Other views

- [Attack-flow library](https://bitrot.sh/attack/): four detection diagrams.
- [Incident report](https://bitrot.sh/incident): a historical narrative with an interactive event graph.
- [Incident dashboard](https://bitrot.sh/inc): a searchable demonstration using bundled events. See [demo boundaries](../INCIDENT_DEMO.md).
