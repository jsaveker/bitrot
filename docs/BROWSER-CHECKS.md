# Browser regression checks

Build with `npm run build`, then run `npm run preview -- --host 127.0.0.1 --port 43187 --strictPort`. Use the printed URL. A dedicated strict port prevents other local projects from replacing the preview during testing.

Use desktop and 390 px phone viewports. Repeat in Safari and Firefox before making cross-browser compatibility claims. Browser checks complement `npm test`; the Node tests do not prove native chooser or canvas behavior.

## Playable homepage and visual lab

1. Open `/`. Confirm the Earthrise sample loads, the original/result divider moves with pointer and keyboard input, and the intensity slider changes the image. RGB intensity and changed-pixel measurements should update after processing.
2. Open the Scrambled transmission preset. It should select ASCII shuffle, level 7, seed `voyager`, and show 49 changed bytes out of 385 (12.73%) with 174 changed bits for recipe v1.
3. Run the same settings again. Compare the entire displayed result; it must match. Change the seed or level and apply it. Replay the previous timeline entry to restore its result.
4. Select two timeline entries and choose Compare runs. Both are recomputed from the original. Switching files must clear the comparison. Reset returns an unchanged original copy.
5. Inspect Bytes view and its highlighted differences. A PNG damaged by bit flips may no longer decode; it must show a helpful error or byte view without crashing.
6. Copy a sample recipe and reopen it. Verify sample, level, mode, seed, and output. Unsupported versions and invalid sample IDs must produce a recoverable error.

## Local files and downloads

1. Load disposable ASCII, PNG, and binary files. Confirm each stays in the tab and mode constraints produce readable errors. No request may carry the filename or bytes.
2. Load an HTML or SVG containing a harmless script that would change the document title. It must remain escaped text or bytes, never execute, and never enter an iframe or document preview.
3. Select an empty file and a file over 5 MiB. Both must be rejected. Cancel the chooser and continue using the lab.
4. Download a result and compare its bytes against the seeded algorithm. For the transmission preset with bit-flip, level 3, seed `signal`, the result is 385 bytes with 11 changed bits.
5. Remove a loaded file, then reload. Local files, history, and comparisons must disappear. A bundled sample may be loaded automatically after reload. A local file must never enable sample recipe sharing.

## Terminal and lessons

1. Open the terminal. Run `preset 3`; the workbench must select bit-flip, level 3, seed `signal`, and show the new result in history.
2. Exercise help, lesson discovery, command-prefix completion, Up/Down history, Ctrl+C, and Tab/Shift+Tab focus navigation. Close and reopen the terminal; the workbench files must remain.
3. In `/learn`, flip one bit. The original SHA-256 must stay fixed and the working SHA-256 must change.
4. In the backup lesson, save the copy, damage it, then restore it. The hashes must match again. Damage without saving a backup must require restarting rather than pretending recovery is possible.

## Responsive layout and effects

1. Check `/`, `/lab`, and `/learn` at desktop, 390 px, and 320 px widths. Text, selects, comparison controls, and buttons must remain usable without document-level horizontal overflow.
2. Use keyboard-only navigation, visible focus, and the skip link. Image and intensity sliders need accessible names and arrow-key support.
3. Turn effects off. Emulate `prefers-reduced-motion: reduce` and confirm effects stay off even when the saved preference is on. Hide the tab and confirm decorative animations stop. Restore temporary browser emulation after testing.
4. Confirm the homepage does not load terminal/incident chunks. Opening the terminal should fetch its separate chunk; a loading failure should offer recovery.

## Verification record — September 2026 redesign

Checked against the local production build in Chrome and the Codex in-app browser:

- Live PNG processing, text differences, versioned presets, equal-output replay, and two-run comparison.
- Real checksum changes and backup restoration to the original fingerprint.
- Phone layouts at 390 px without document overflow for all three routes, plus the homepage at 320 px.
- Terminal preset dispatch updating visual state.
- Downloaded `transmission_level3.txt` compared byte-for-byte with the expected seeded result: match, 385 bytes.
- Sample recipe copy feedback, invalid-seed feedback, keyboard intensity changes, and reduced-motion effects behavior.
- The existing 12 security tests plus 7 experiment/loading tests pass; production and Functions builds pass.

Chrome extension file selection was unavailable with its current permissions, so the native-file flow was verified in the in-app browser instead: local text transformed successfully; HTML remained inert; empty and oversized files were rejected; local files could not be shared; and reloading left only the automatically loaded bundled sample. No extension permissions were changed. Native chooser cancellation, Safari/Firefox, and physical-device behavior have not been verified.
