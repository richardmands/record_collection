# Record Collection

A static [Vite](https://vite.dev/) + React + TypeScript browser for Richard’s vinyl. Album covers and metadata are served as files from `public/` — no backend required.

## Local development

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Typecheck and emit production files to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run sync-data` | Rebuild `public/data/collection.json` from `public/covers/` |

`sync-data` keeps existing artist/title/label/catalog fields when a cover is already listed. New cover files only add an id and filename-derived title — it does not invent album facts.

## Collection data

- Covers: `public/covers/*.jpg`
- Catalog: `public/data/collection.json`

Cover filenames use `{id}_{slug}.jpg` (for example `21_kaneko_i_love_ny.jpg`). After adding or renaming covers, run `npm run sync-data` and fill in any missing metadata by hand.

## Deploy on Netlify (GitHub)

The app is a single-page app. Netlify should build from this repository’s default branch.

1. Push this repo to GitHub (already the source of truth for this project).
2. In [Netlify](https://app.netlify.com/), **Add new site → Import an existing project** and choose the GitHub repo `richardmands/record_collection`.
3. Confirm build settings (also stored in `netlify.toml`):

   | Setting | Value |
   | --- | --- |
   | Build command | `npm run build` |
   | Publish directory | `dist` |

4. Deploy. The `[[redirects]]` rule in `netlify.toml` sends unknown paths to `index.html` with status `200` so client-side album URLs (`/?id=21`) keep working on refresh.

Node 22 is a safe choice in Netlify’s build environment if you need to pin a version (`NODE_VERSION=22` in the site’s environment variables, or an `.nvmrc`).
