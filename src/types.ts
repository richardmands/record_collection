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
  summary: string;
  summarySource: string;
  summarySourceLabel: string;
  artistInfoUrl: string;
  artistInfoLabel: string;
  coverImage: string;
  discogsUrl: string;
  tracks: Track[];
  researchNotes: string;
  verificationStatus: string;
  verificationIssues: string[];
  coverStatus: string;
  coverSource: string;
  shelfLocation: string;
  vinylCondition: string;
  sleeveCondition: string;
  obi: string;
  inserts: string;
  purchaseDate: string;
  pricePaid: string;
  purchaseCurrency: string;
}

export interface Collection {
  version: number;
  albumCount: number;
  albums: Album[];
  updatedAt: string;
}

export type Language = 'en' | 'ja';

export type SortKey =
  | 'artistEn'
  | 'artistJa'
  | 'title'
  | 'year';
