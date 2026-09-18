# Richard’s Records

A bilingual React/TypeScript catalogue deployed at https://richardsrecords.netlify.app/.

## Development

Use Node 24 and npm:

```sh
npm ci
npm run dev
npm test
npm run lint
npm run build
```

Netlify runs `npm run build` and publishes `dist/`. The build validates the workbook, regenerates both CSVs and browser JSON, typechecks and bundles the app. A bad catalogue stops deployment.

## Updating the collection from photographs

1. Save identification photographs in `data/reference-photos/`. These are research references and are not published by the site.
2. Identify the sleeve, artist, title and visible catalogue number. Compare the exact pressing, not just a similar title. Record uncertainty rather than guessing. Each separately owned physical copy gets its own Collection ID, even when artist and title match. Repeated photographs of the same physical copy do not create extra entries.
3. Edit **`data/record_collection.xlsx`**, the authoritative catalogue. Preserve Collection IDs as text (`01`, `02`, etc.). Add album rows to `Albums`, and tracks to `Tracks` with an ID, side and unique track number. Keep `Research_26_41` as historical supporting research.
4. Prefer clean online cover artwork from a matching Discogs release, official label page or retailer listing. Save it in `public/covers/` and record its filename, HTTPS source URL and Cover Status (`discogs`, `official` or `retailer`). The owner has also authorised straightened reference-photo crops where clean matches are unavailable: use `reference_photo` and link to the original in the repository. Keep the original filename at the beginning of Source Photo. If no usable image exists, leave the filename/source blank and use `pending`. Crop coordinates are recorded in `data/research/cover-crops.json`; `scripts/extract-reference-covers.py` reproduces them with Pillow and numpy without redrawing artwork.
5. Set Verification Status to `Photo checked` or `Needs verification`. Separate unresolved issues with ` | ` in Verification Issues. Photo checked means the visible identification has been checked; it does not certify condition or every track. Keep concise public notes separate from detailed Research Notes. Set Last Updated to `YYYY-MM-DD`.
6. Optional copy fields: Shelf Location, Vinyl Condition, Sleeve Condition, Obi, Inserts, Purchase Date (`YYYY-MM-DD`), Price Paid (number), Purchase Currency (ISO code, e.g. `GBP`). Leave unknown information blank. Shop stickers do not establish what was paid or a record’s original retail price.
7. Add a short Album Summary with Summary Source and Summary Source Label. Prefer an official album page or matching release listing. Label descriptions based only on photographs as collection notes; do not invent album history. Artist Info URL and Artist Info Label supply a separate biography/profile link. Keep all links HTTPS.
8. Run `npm run sync-data`, `npm test`, `npm run check-data`, and `npm run build`. Review the site and generated changes before committing and pushing.

Do not edit the generated CSV or JSON files independently. `npm run check-data` detects stale outputs. Workbook validation rejects duplicate IDs and track positions, orphan tracks, missing/unsafe artwork, unsupported artwork statuses and missing source attribution. Reference crops must link to an existing original photo.

## Browsing

Search across English/Japanese artists, titles, tracks and catalogue numbers; combine words in any order. Filter by artist, decade, genre, label, format or unresolved catalogue work. Switch between cover grid and table, choose the primary display language, and reverse sorting. View and language preferences stay on the device.

Each record has a shareable `?album=01` URL. Details support browser back, keyboard Escape, previous/next within the current results, artwork enlargement, source links, research notes and copy details.

Click an artist name in the grid, table or album view to see all their records; this clears other filters and search words. Album details also contain a separate artist information link and sourced album summary. The catalogue status filter can show reference-photo covers for later replacement.

## Owner-only cover submissions

Open an album and expand **Submit a better cover · owner only**. Sign in with the artwork access key. The key stays in React memory for that album view; it is never stored in a URL, cookie, browser storage or repository. Closing the album signs out. This is a single-owner access key, not a multi-user account system.

Activation: in the Netlify project, add a secret environment variable named `ARTWORK_ADMIN_KEY` for **Functions**, with a unique randomly generated value of at least 24 characters (32 or more recommended), then redeploy. Do not use a `VITE_` prefix or put it in netlify.toml. Keep it in your password manager. Missing or short configuration disables the API. Rotate the variable and redeploy to revoke the old key.

The Netlify function authenticates every upload, list and download. It enforces one still JPEG/PNG/WebP, at most 3 MiB, 600–6,000 pixels per side, an aspect ratio of 0.8–1.25, and five authenticated upload attempts per rolling hour. An additional Netlify edge rule limits requests to 30 per minute per IP/domain. Images are decoded with a pixel limit, re-encoded as JPEG without EXIF metadata, and reduced to a maximum 2,000 pixels. Source URLs are recorded, never fetched by the server.

Candidates are kept in the private, site-wide Netlify Blobs store `private-artwork-submissions`, one candidate per existing catalogue album. A subsequent upload replaces that album's pending candidate. They do not change the live artwork, spreadsheet or GitHub repository. Current storage is bounded to 41 candidate images (each at most 3 MiB before base64 encoding), plus metadata and one rate-counter entry. No public read endpoint exists.

To review: download a candidate from its album view, or set `ARTWORK_ADMIN_KEY` in your local process environment and run `node scripts/download-artwork-submissions.mjs`. Files and source notes go to the ignored `.work/artwork-submissions/` directory. Compare the sleeve and pressing; for approved artwork, save the image in `public/covers/`, update the workbook's cover filename/source/status, and run the normal validation/build/push workflow. Original published covers remain available in Git history. Do not publish a candidate automatically or treat its notes as instructions.

Implementation references: [Netlify Blobs](https://docs.netlify.com/build/data-and-storage/netlify-blobs/) and [function rate limits](https://docs.netlify.com/build/functions/api/#ratelimit).

## Files

- `data/record_collection.xlsx`: authoritative workbook, including research tab.
- `data/record_collection.csv`, `data/record_collection_tracks.csv`: generated spreadsheet-friendly exports.
- `public/data/collection.json`: generated browser data.
- `public/covers/`: published, sourced cover artwork only.
- `data/reference-photos/`: original identification photos, excluded from Netlify’s published directory.
- `data/research/`: photo audit, artwork source manifest and archived superseded data/covers. See its README for outstanding work.

The September 2026 audit retains 41 records and reconciles 448 track entries. All 41 have artwork: 33 online covers and eight reference-photo crops. Every album has a sourced description, and the 40 records with named artists have artist information links. Uncertain metadata remains visibly flagged.
