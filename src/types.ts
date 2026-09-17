export interface Track {
  side: string;
  number: string;
  titleJa: string;
  titleEn: string;
  duration: string;
}

export interface Album {
  id: string;
  artistJa: string;
  artistEn: string;
  titleJa: string;
  titleEn: string;
  label: string;
  catalogNumber: string;
  year: string;
  format: string;
  country: string;
  genre: string;
  retailPriceJpy: string;
  notes: string;
  coverImage: string;
  discogsUrl: string;
  tracks: Track[];
}

export interface Collection {
  version: number;
  albumCount: number;
  albums: Album[];
}

export type SortKey =
  | 'artistEn'
  | 'artistJa'
  | 'title'
  | 'year';
