# Japanese Vinyl Browser

A local Vite + React + TypeScript app for browsing Richard’s Japanese vinyl collection (enka, kayōkyoku, folk LPs). Bilingual titles, sort/search, and per-side track listings.

## Quick start

```bash
cd /workspace/vinyl-browser
npm install
npm run sync-data   # optional: rebuild JSON from CSVs
npm run dev         # http://localhost:5173
```

Production preview:

```bash
npm run build
npm run preview -- --host 0.0.0.0 --port 4173
```

Then open **http://127.0.0.1:4173**

## npm scripts

| Script | Purpose |
|--------|---------|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | Typecheck + production build → `dist/` |
| `npm run preview` | Serve the production build |
| `npm run sync-data` | Rebuild `public/data/collection.json` from CSVs |

## Data layout

```
data/
  record_collection.csv          # album rows
  record_collection_tracks.csv   # track rows
public/
  data/collection.json           # loaded by the app at runtime
  covers/*.jpg                   # filenames match Cover Image Filename
```

The UI fetches `/data/collection.json` only. Covers are requested as `/covers/<filename>`. Missing or broken images fall back to a warm gradient placeholder with artist initials.

## Updating the catalog

1. **Edit or replace CSVs** in `data/` (and/or drop a ready-made `collection.json`).
2. **Add cover JPEGs** into `public/covers/` using the same filenames referenced in the CSV / JSON (`Cover Image Filename` / `coverImage`).
3. **Sync** (if you changed CSVs):
   ```bash
   npm run sync-data
   ```
   This regenerates `public/data/collection.json`.
4. **Rebuild / refresh**:
   - Dev: Vite will pick up `public/` changes on reload.
   - Preview: `npm run build && npm run preview -- --host 0.0.0.0 --port 4173`

You can also replace `public/data/collection.json` directly (e.g. copy from `/workspace/record-collection/collection.json`) and skip the sync script.

## Seed source

Initial data was copied from `/workspace/record-collection/` (`collection.json`, CSVs, and `covers-web/`).
