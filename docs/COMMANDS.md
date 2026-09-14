# Terminal guide

[Back to the README](../README.md)

Open the lab, choose **Open terminal**, and press Enter after each command. Commands update the same files, previews, and history as the visual controls. Files stay in this tab and disappear on reload or close.

## File experiments

| Command | Behavior |
| --- | --- |
| `load` | Choose a local file. Nothing is uploaded. |
| `upload` | Compatibility alias for `load`. |
| `list` | Show this tab's file IDs, names, sizes, and levels. |
| `select <id>` | Select a file in the visual workbench. |
| `rot <id> --level N [--mode M] [--seed S]` | Transform a copy and update the workbench. |
| `view <id> [level]` | Download the original (level 0) or latest result. |
| `forget <id>` | Remove the file and its history from the tab. |
| `freeze <id>` | Explain that local files never decay automatically. This does not make a backup. |
| `sample lunar` / `sample transmission` | Select a bundled PNG or ASCII sample. |
| `preset <1\|2\|3>` | Run Fading photograph, Scrambled transmission, or One noisy channel. |
| `replay <id> <run-number>` | Recompute a run from the file's current timeline. |
| `recipe <id>` | Print a share link for the latest bundled-sample run. |

Levels are 0–10. Modes are `bit-flip`, `ascii-shuffle`, and `color-drain`. Seeds contain 1–32 ASCII letters, digits, hyphens, or underscores; the terminal default is `bitrot`. Colour drain uses intensity rather than randomness.

`rot` now updates the preview instead of automatically downloading. Use `view` or the Download button to save the result. Only original and latest result buffers are retained. The last 12 runs retain metadata for replay, starting from the original each time.

```text
sample transmission
list
rot <id> --level 5 --mode ascii-shuffle --seed voyager
view <id>
replay <id> 1
recipe <id>
```

Limits: 5 MiB per file, 10 files, 20 MiB of originals, five seconds per transformation, and one transformation at a time. PNGs must be at most 4 million pixels and 4096 pixels per side. Files selected locally cannot be shared through recipes.

## Learn and explore

`help` lists commands. `lessons list`, `lessons 1-checksums`, and `lessons 2-backups` read the generated lesson content locally. Open `/learn` for the interactive versions. `clear` clears the display and `exit` returns home without reloading the app.

Use Up/Down for command history, Tab to complete a command prefix, and Ctrl+C to discard the current input. Tab from an empty prompt and Shift+Tab leave the terminal. Ctrl+C does not cancel a running worker; its five-second timeout still applies.

Try `cow`, `doge`, `parrot`, `xyzzy`, `id10t`, or `sudo make me a sandwich`. `matrix` stops on any key, when effects turn off, when the tab becomes hidden, or when the terminal closes. Reduced-motion preferences are respected. The old idle overlay has been removed so it no longer obscures results.
