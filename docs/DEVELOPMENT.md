# Developer guide

[← Back to the README](../README.md)

Bitrot has a React frontend, TypeScript Pages Functions, and bundled educational content. Vite serves the frontend; Wrangler supplies the local Functions runtime and storage bindings.

## Frontend development

Use Node.js 22, matching `.github/workflows/ci.yml`.

```bash
npm ci
npm run dev
```

Vite prints the local URL. The landing page, `/inc`, and `/incident` use bundled assets. `/lab` file commands, lesson discovery, and the `/attack` index require backend routes.

To build and preview static assets:

```bash
npm run build
npm run preview
```

`preview` does not start the backend.

## Run the local lab

Build the frontend, then start Pages with local KV and R2 bindings:

```bash
npm run build
npx wrangler@4.131.1 pages dev dist --kv BITROT_KV --r2 BITROT_R2
```

Use the URL Wrangler prints. Keep this in local mode, with disposable files. Do not add remote storage settings or reuse production bindings for experiments. Local Pages development does not schedule the separate decay handler.

The repository has both `wrangler.toml` and `wrangler.jsonc`, representing different hosting approaches. Wrangler may warn that the JSON configuration lacks `pages_build_output_dir`. Explicit CLI bindings are provided above for the local lab; reconcile the configuration before a production deployment.

## Repository map

| Path                                    | Purpose                                                                |
| --------------------------------------- | ---------------------------------------------------------------------- |
| `src/App.jsx`                           | Landing page and route definitions.                                    |
| `src/components/Terminal.tsx`           | Browser terminal, command parsing, and API calls.                      |
| `src/components/IncidentReport.jsx`     | Historical incident narrative and React Flow graph.                    |
| `src/components/ModernIncidentView.jsx` | Dashboard demonstration with hardcoded event data.                     |
| `functions/`                            | Upload, list, retrieve, transform, freeze, and content-index handlers. |
| `functions/decay.ts`                    | Bit flipping, text shuffling, PNG colour drain, and JPEG placeholder.  |
| `functions/cron-decay.ts`               | Scheduled handler; requires explicit Worker/Cron wiring.               |
| `public/`                               | Lessons, detection diagrams, ASCII art, and incident Markdown.         |
| `scripts/readme-art.mjs`                | Reproducible README illustrations.                                     |

## Request and storage model

The browser calls same-origin routes:

| Route                      | Method | Purpose                                              |
| -------------------------- | ------ | ---------------------------------------------------- |
| `/upload`                  | POST   | Accept multipart `file`; store level 0 and metadata. |
| `/list`                    | GET    | Return archive metadata.                             |
| `/view/<id>[/<level>]`     | GET    | Retrieve a stored level, defaulting to the latest.   |
| `/rot?id=…&level=…&mode=…` | GET    | Transform the original and return a download.        |
| `/freeze?id=…`             | POST   | Set the next scheduled decay time to null.           |
| `/lessons`                 | GET    | List lesson IDs and titles.                          |
| `/attack-flows`            | GET    | List four bundled HTML detection diagrams.           |

`BITROT_KV` stores JSON metadata under each file ID: filename, MIME type, size, creation time, mode, current level, and next decay time. `BITROT_R2` stores file bytes at `<id>/level_<n>`. On-demand `rot` results are returned directly and do not advance the saved level.

## Current boundaries

- The lab is experimental and shared; it does not implement private user workspaces, a backup service, or a guaranteed deletion period.
- Bit-flipping can corrupt headers and make outputs unreadable. Text shuffling works best with simple ASCII input.
- PNG colour drain currently assumes 8-bit RGBA pixels. Other formats can return unchanged data. JPEG glitch returns the original unchanged.
- Decay uses random choices without a stored seed, so runs are not reproducible.
- A `scheduled` export in a Pages Functions file is not automatically registered as a Cron Trigger. The generated Pages Worker contains request handlers, while scheduled work needs an explicitly deployed Worker. See [Cloudflare Cron Triggers](https://developers.cloudflare.com/workers/configuration/cron-triggers/).
- The incident dashboard has working search, filters, and expansion controls, but no live response integrations. See [incident demo notes](../INCIDENT_DEMO.md).

## Build and verification

The existing CI runs:

```bash
npm ci --include=dev
npm audit --audit-level=moderate
npm run build
```

At the September 2026 documentation refresh, the frontend and Functions compiled, but the locked dependency audit reported advisories. A successful build is not a clean security audit. Review the current audit result before deployment.

Compile the Pages Functions separately:

```bash
npx wrangler@4.131.1 pages functions build functions --outdir /tmp/bitrot-functions-build
```

The project does not currently pin TypeScript or provide a test script. TypeScript 5.9.3 can check the existing configuration:

```bash
npx --package=typescript@5.9.3 tsc --noEmit --project tsconfig.json
```

Most UI files are JSX and are outside this check because `allowJs` is false. A future compiler upgrade also needs the legacy `moduleResolution` setting reviewed.

## Hosting

The source targets Cloudflare Pages Functions with KV and R2. The checked-in JSON configuration instead describes static Worker assets, while the TOML contains older Pages-era settings and a cron declaration. Neither should be treated as a verified, complete production recipe.

Before deploying, establish one authoritative configuration, separate development and production storage, verify the Functions bindings, and deploy scheduled work explicitly if required. Follow the current [Pages configuration documentation](https://developers.cloudflare.com/pages/functions/wrangler-configuration/).

The repository CI builds and audits; Cloudflare deployment configuration is managed separately. This documentation refresh does not change the live hosting configuration.

## Contributions and graphics

Keep changes focused and describe the behaviour you verified. UI pull requests should include desktop and narrow-screen screenshots. Backend changes should exercise storage errors, input limits, and the relevant file lifecycle.

Regenerate documentation artwork with:

```bash
node scripts/readme-art.mjs
```

Screenshot provenance is recorded in [`docs/images/README.md`](images/README.md).
