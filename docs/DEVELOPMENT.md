# Developer guide

[← Back to the README](../README.md)

Bitrot's file lab runs entirely in the browser. Cloudflare hosts static assets and read-only content indexes; it does not receive file data.

## Run the local lab

Use Node.js 22 and npm:

```bash
npm ci
npm run dev
```

Open the Vite URL. Samples, local file selection, processing, and lessons work without Cloudflare or storage credentials. To also serve the compatibility endpoints and existing read-only content routes:

```bash
npm run build
npx wrangler pages dev dist
```

No KV or R2 bindings are needed. `wrangler.jsonc` describes the existing Pages project; there is no scheduled decay job in this deployment.

## Verify changes

```bash
npm audit --audit-level=moderate
npm run typecheck
npm test
npm run build:functions
npm run build
```

CI runs these checks on pull requests and pushes to main. TypeScript is pinned; JSX files are not covered by its current configuration. Browser smoke checks should also exercise file selection, worker processing, downloads, errors, and reload behaviour.

## File security model

- `src/lib/local-files.ts` holds originals and latest results in tab memory. It uses no persistent browser storage or cloud API.
- `src/lib/decay.worker.ts` transforms a copy in a dedicated worker. A five-second timeout terminates stalled work.
- `src/lib/local-decay.ts` validates levels, sizes, PNG dimensions, and mode names. Processing has a bounded operation count.
- User-controlled labels have terminal controls stripped. Download names retain their extensions and remove unsafe filename characters.
- Downloads use `application/octet-stream` blobs and the browser's download action. User content is never interpreted as markup. Text previews are escaped React text nodes. Validated PNGs are decoded into canvases; HTML/SVG documents are never embedded or executed.
- `server/retired-files.ts` returns a fixed, non-cacheable 410 response for the old cloud-file API. `functions/_middleware.ts` also covers bare and nested legacy paths.
- `/upload`, `/list`, `/view`, `/rot`, and `/freeze` reject all HTTP methods before reading bodies or accessing storage. The old scheduled export is inert.

The source no longer requires KV/R2 bindings. Existing Cloudflare objects are not deleted or migrated by this change. Account owners can inventory or clean up those resources separately through their administrative access. Do not reintroduce public access to legacy file IDs.

## Limits and behaviour

The tab accepts 10 files and 20 MiB of originals, with a 5 MiB limit per input/output. It keeps each original and at most one result; temporary worker copies also consume memory. PNG processing is capped at 4 million pixels and 4096 pixels per side. Files disappear when the page reloads or closes.

Levels 0–10 control bounded transformation intensity. Level 0 returns an unchanged copy. Byte modes use a versioned seeded generator. Repeated recipes reproduce byte changes exactly. Colour drain uses intensity only; PNG encoders may produce different file bytes across browsers. ASCII shuffle rejects non-ASCII bytes rather than silently damaging an unsupported encoding. PNG colour drain uses browser decoding and normalises pixels through a canvas.

## Experiment and content architecture

`local-files.ts` is the shared tab store and worker API. `commands.ts` parses terminal commands and calls that same API. `useFiles` subscribes with `useSyncExternalStore`, so commands, file selection, and visual controls update one state. The terminal is loaded only when opened; legacy incident routes and lessons have separate chunks.

The last 12 history entries per file contain recipes and measured statistics, not file buffers. Comparing two runs temporarily recomputes two bounded results. Shared URLs carry only a supported sample ID, recipe version, mode, level, and validated seed. They cannot resolve local files. Preserve v1 sample bytes and the seeded algorithm; introduce a new recipe version for incompatible changes.

`content/lessons/*.json` is the content source. `npm run lessons:build` generates `src/generated/lessons.json` and the compatibility text files in `public/lessons`. Development and build lifecycle scripts run the generator automatically. The browser imports generated content; the read-only `/lessons` endpoint serves an index from the same source. No content API is required for the lab or lessons.

Only the visual-effects preference is stored in localStorage. File bytes, names, seeds, history, and lesson backups are not persisted. Effects stop when the page is hidden, when the user turns them off, or when reduced motion is requested.

See [Browser checks](BROWSER-CHECKS.md) for interaction regression coverage. Unit tests cover deterministic fixtures, recipe validation, actual SHA-256 results, store limits, content consistency, and the retired-route security policy.

## Hosting and legacy content

The existing Cloudflare Pages Git integration automatically deploys `main`. Automatic branch previews are paused so stale branches cannot republish the retired cloud-file implementation. Use local previews for pull requests and keep new branches based on the secured main branch. Re-enabling Cloudflare branch previews requires an explicit hosting configuration change.

Review CI before merging, then verify the production deployment and confirm legacy file routes return 410 with `X-Bitrot-File-Policy: local-only-v1`. Historical deployments that retained file-storage bindings have been retired; stored objects themselves are preserved.

Other pre-existing routes (`/attack`, `/incident`, `/inc`) remain in the repository. They are separate security-content demonstrations and are not featured as part of the data-decay lab. See [incident demo notes](../INCIDENT_DEMO.md) for their limitations.

## Documentation artwork

```bash
node scripts/readme-art.mjs
```

Screenshot provenance is recorded in [images/README.md](images/README.md).
