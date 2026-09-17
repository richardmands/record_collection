#!/usr/bin/env node
/**
 * Rebuild public/data/collection.json from cover files in public/covers.
 *
 * Existing metadata (artist, title, label, catalog) is preserved when the
 * cover filename already has an entry. New covers only get an id and a
 * filename-derived slug — album facts are never invented.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const coversDir = join(root, 'public', 'covers')
const dataPath = join(root, 'public', 'data', 'collection.json')

const COVER_RE = /^(\d+)_(.+)\.(jpe?g|png|webp)$/i

function slugToWords(slug) {
  return slug.replace(/_/g, ' ').trim()
}

async function loadExisting() {
  try {
    const raw = await readFile(dataPath, 'utf8')
    const parsed = JSON.parse(raw)
    const albums = Array.isArray(parsed) ? parsed : parsed.albums
    return Array.isArray(albums) ? albums : []
  } catch (err) {
    if (err && err.code === 'ENOENT') return []
    throw err
  }
}

const files = (await readdir(coversDir)).filter((name) => COVER_RE.test(name))
const existing = await loadExisting()
const byCover = new Map(existing.map((album) => [album.cover, album]))

const albums = files
  .map((cover) => {
    const match = cover.match(COVER_RE)
    const id = Number(match[1])
    const slug = match[2]
    const prev = byCover.get(cover) ?? {}
    return {
      id,
      artist: prev.artist ?? null,
      artistJa: prev.artistJa ?? null,
      title: prev.title ?? slugToWords(slug),
      titleJa: prev.titleJa ?? null,
      cover,
      label: prev.label ?? null,
      catalog: prev.catalog ?? null,
    }
  })
  .sort((a, b) => a.id - b.id)

await writeFile(dataPath, `${JSON.stringify({ albums }, null, 2)}\n`)
console.log(`Wrote ${albums.length} album(s) to public/data/collection.json`)
