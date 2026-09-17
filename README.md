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
2. Identify the sleeve, artist, title and visible catalogue number. Compare the exact pressing, not just a similar title. Record uncertainty rather than guessing. Avoid duplicating albums already in the collection.
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

## Files

- `data/record_collection.xlsx`: authoritative workbook, including research tab.
- `data/record_collection.csv`, `data/record_collection_tracks.csv`: generated spreadsheet-friendly exports.
- `public/data/collection.json`: generated browser data.
- `public/covers/`: published, sourced cover artwork only.
- `data/reference-photos/`: original identification photos, excluded from Netlify’s published directory.
- `data/research/`: photo audit, artwork source manifest and archived superseded data/covers. See its README for outstanding work.

The September 2026 audit retains 41 records and reconciles 448 track entries. All 41 have artwork: 33 online covers and eight reference-photo crops. Every album has a sourced description, and the 40 records with named artists have artist information links. Uncertain metadata remains visibly flagged.
