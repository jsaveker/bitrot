# Developer guide

[← Back to the README](../README.md)

Bitrot's file lab runs entirely in the browser. Cloudflare hosts static assets and read-only content indexes; it does not receive file data.

## Run the local lab

Use Node.js 22 and npm:

```bash
npm ci
npm run dev
```

Open the Vite URL. Local file selection and processing work without Cloudflare or storage credentials. To also serve lesson discovery and the existing read-only content routes:

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
- Downloads use `application/octet-stream` blobs and the browser's download action. User content is never inserted into the DOM or previewed as HTML/SVG.
- `server/retired-files.ts` returns a fixed, non-cacheable 410 response for the old cloud-file API. `functions/_middleware.ts` also covers bare and nested legacy paths.
- `/upload`, `/list`, `/view`, `/rot`, and `/freeze` reject all HTTP methods before reading bodies or accessing storage. The old scheduled export is inert.

The source no longer requires KV/R2 bindings. Existing Cloudflare objects are not deleted or migrated by this change. Account owners can inventory or clean up those resources separately through their administrative access. Do not reintroduce public access to legacy file IDs.

## Limits and behaviour

The tab accepts 10 files and 20 MiB of originals, with a 5 MiB limit per input/output. It keeps each original and at most one result; temporary worker copies also consume memory. PNG processing is capped at 4 million pixels and 4096 pixels per side. Files disappear when the page reloads or closes.

Levels 0–10 control bounded transformation intensity. Level 0 returns an unchanged copy. Random changes are not reproducible; repeated commands can differ. ASCII shuffle rejects non-ASCII bytes rather than silently damaging an unsupported encoding. PNG colour drain uses browser decoding and normalises pixels through a canvas.

## Hosting and legacy content

The existing Cloudflare Pages Git integration automatically deploys `main`. Automatic branch previews are paused so stale branches cannot republish the retired cloud-file implementation. Use local previews for pull requests and keep new branches based on the secured main branch. Re-enabling Cloudflare branch previews requires an explicit hosting configuration change.

Review CI before merging, then verify the production deployment and confirm legacy file routes return 410 with `X-Bitrot-File-Policy: local-only-v1`. Historical deployments that retained file-storage bindings have been retired; stored objects themselves are preserved.

Other pre-existing routes (`/attack`, `/incident`, `/inc`) remain in the repository. They are separate security-content demonstrations and are not featured as part of the data-decay lab. See [incident demo notes](../INCIDENT_DEMO.md) for their limitations.

## Documentation artwork

```bash
node scripts/readme-art.mjs
```

Screenshot provenance is recorded in [images/README.md](images/README.md).
