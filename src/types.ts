export type Album = {
  id: number
  artist: string | null
  artistJa: string | null
  title: string
  titleJa: string | null
  cover: string
  label: string | null
  catalog: string | null
}

export type Collection = {
  albums: Album[]
}
