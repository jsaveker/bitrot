# bitrot.sh

A cyberpunk-themed single page website for bitrot.sh.

## Features

- Modern React application with Vite
- Cyberpunk-themed design
- Responsive layout
- Smooth animations with Framer Motion
- Tailwind CSS for styling

## Development

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

## Deployment to Cloudflare Pages

1. Push your code to a GitHub repository
2. Go to Cloudflare Pages dashboard
3. Click "Create a project"
4. Connect your GitHub repository
5. Configure build settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
6. Click "Deploy site"

## Backend Setup (Cloudflare)

This project uses Cloudflare Functions for backend logic, Cloudflare KV for metadata storage, and Cloudflare R2 for file storage.

- **Functions:** Located in the `/functions` directory. Handlers like `upload.ts` process requests.
- **Storage:** Configuration for KV namespaces and R2 buckets is defined in `wrangler.toml`. You need to create these resources in your Cloudflare dashboard and update `wrangler.toml` with the correct IDs/names before deploying.
- **Bindings:** Ensure the KV and R2 bindings are correctly configured in your Cloudflare Pages project settings (Settings -> Functions -> Bindings) to match `wrangler.toml`.

## Customization

- Edit `src/App.tsx` (or relevant `.tsx` files) to modify the content
- Update colors in `tailwind.config.js`
- Modify animations in `src/index.css`

## License

Apache-2.0 license