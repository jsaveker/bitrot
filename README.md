# Bit Rot Laboratory (bitrot.sh)

Welcome to the Bit Rot Laboratory! This is a tongue-in-cheek, cyberpunk-themed single-page application where files and text are deliberately exposed to simulated bit-rot.

Upload your data and watch it corrode bit-by-bit, either in real-time (eventually!) or on a schedule. Learn a little about why real-world data decays and how to defend against it through educational blurbs and interactive commands.

**Status:** Core functionality (upload, scheduled decay, listing, viewing levels, freezing) is implemented. Further decay algorithms, API, and advanced features are planned.

## Lab Features

Interact with the lab using a terminal interface:

*   **`help`**: Shows the list of available commands.
*   **`upload`**: Initiates a file upload via a dialog box. Uploaded files begin their decay journey.
*   **`list`**: Displays a list of your files currently submitted to the lab, showing their ID, name, size, and creation date.
*   **`view <id> [level]`**: Downloads a specific decay level of a file. If `[level]` is omitted, downloads the latest generated level.
*   **`rot <id> --level N [--mode M]`**: Generates and downloads a specific decay level (`N`) on-demand, optionally overriding the file's default decay mode (`M`). Available modes: `bit-flip`, `ascii-shuffle`, `color-drain`.
*   **`freeze <id>`**: Halts the scheduled decay process for the specified file (equivalent to making a backup).
*   **`lessons [list | <id>]`**: Displays mini-tutorials on data integrity concepts. Use `lessons list` to see topics or `lessons <id>` (e.g., `lessons 1-checksums`) to read one.
*   **`exit`**: Returns to the landing page.

### Easter Eggs

Try these commands for fun:

*   `sudo make me a sandwich`
*   `xyzzy`
*   `id10t`
*   `cow`
*   `doge`
*   `parrot`
*   `matrix` (Press any key to exit)
*   *Idle Screen Burn:* Wait 30 seconds without typing...

## Technology Stack

*   **Frontend:** React (with Vite), TypeScript, Tailwind CSS, Framer Motion, xterm.js
*   **Backend:** Cloudflare Pages Functions (TypeScript)
*   **Storage:** Cloudflare R2 (File Data), Cloudflare KV (Metadata)
*   **Scheduling:** Cloudflare Cron Triggers

## Development

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Run Frontend Dev Server:** (Frontend UI only, no backend functions)
    ```bash
    npm run dev
    ```

3.  **Run Full Stack Locally (Frontend + Backend):**
    *   Ensure you have Wrangler installed (`npm install -g wrangler`) or use `npx`.
    *   Make sure `wrangler.toml` has valid `preview_id` and `preview_bucket_name` entries pointing to your created KV/R2 resources (or placeholders if just testing locally without real storage).
    *   Build the frontend first: `npm run build`
    *   Start the Pages development server:
        ```bash
        # Replace with your actual KV namespace binding name if different
        # Replace with your actual R2 bucket binding name if different
        npx wrangler pages dev ./dist --kv BITROT_KV --r2 BITROT_R2 
        ```
        This simulates the Cloudflare environment locally.

## Deployment

This project is configured for easy deployment via Cloudflare Pages connected to a GitHub repository.

1.  Push your code (including `wrangler.toml`, `/functions` directory, and built `/dist` assets implicitly handled by the build command) to your main branch on GitHub.
2.  Ensure your Cloudflare Pages project is connected to this repository.
3.  Configure build settings in the Cloudflare dashboard:
    *   Build command: `npm run build`
    *   Build output directory: `dist`
    *   Framework Preset: Vite (or auto-detected)
    *   **Important:** Ensure no custom "Deploy command" is set.
4.  Cloudflare Pages will automatically build the project, deploy the static assets, discover the functions in the `/functions` directory, and apply bindings based on `wrangler.toml`.
5.  Verify KV and R2 bindings are active in the Pages project settings (**Settings -> Functions -> Bindings**).

## Backend Setup (Cloudflare)

This project relies on Cloudflare's serverless platform:

*   **Functions:** Backend logic lives in the `/functions` directory (e.g., `upload.ts`, `list.ts`, `cron-decay.ts`). Cloudflare Pages automatically detects and deploys these.
*   **Storage:**
    *   Cloudflare R2 stores the actual file data for each decay level (`{id}/level_{n}`).
    *   Cloudflare KV stores JSON metadata for each file (ID, name, type, size, current level, decay mode, next decay time).
*   **Configuration:** `wrangler.toml` defines the KV namespace ID and R2 bucket name used by the functions. You **must** create these resources in your Cloudflare dashboard and update `wrangler.toml` with the correct values before deploying.
*   **Bindings:** The bindings defined in `wrangler.toml` connect your code (`env.BITROT_KV`, `env.BITROT_R2`) to your actual Cloudflare resources. Ensure they are correctly set up in the Pages dashboard settings.
*   **Scheduling:** Cron Triggers, defined in `wrangler.toml`, automatically run the `functions/cron-decay.ts` function on a schedule (currently hourly) to progress file decay.

## Roadmap / Future Features

*   Implement remaining decay algorithms: JPEG Glitch, Gamma Burn.
*   Add more `lessons`.
*   Create a proper API (`/api/...`) for programmatic access (e.g., `curl https://bitrot.sh/api/rot?id=XYZ&level=4`).
*   Develop a CLI client (`npx bitrot-cli rot file.jpg --level 3`).
*   Implement user sessions/authentication (e.g., GitHub OAuth) to save labs.
*   Add share tokens for collaborative file sabotage.
*   Create a "Most Corrupted" leaderboard.
*   Implement "Good Citizen" mode (check uploaded text hashes against HaveIBeenPwned).
*   Design T-shirt merchandise.

## Contributing

(Placeholder - Contributions welcome! Please open an issue to discuss changes.)

## License

Apache-2.0 license 