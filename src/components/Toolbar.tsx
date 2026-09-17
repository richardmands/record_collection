import type { SortKey } from '../types';

interface Props {
  query: string;
  onQuery: (q: string) => void;
  sort: SortKey;
  onSort: (s: SortKey) => void;
  count: number;
  total: number;
}

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'artistEn', label: 'Artist (EN)' },
  { value: 'artistJa', label: 'Artist (JA)' },
  { value: 'title', label: 'Album title' },
  { value: 'year', label: 'Release year' },
];

export function Toolbar({
  query,
  onQuery,
  sort,
  onSort,
  count,
  total,
}: Props) {
  return (
    <div className="toolbar">
      <label className="toolbar__search">
        <span className="sr-only">Search</span>
        <input
          type="search"
          placeholder="Search artist or title…"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          autoComplete="off"
        />
      </label>
      <label className="toolbar__sort">
        <span>Sort</span>
        <select
          value={sort}
          onChange={(e) => onSort(e.target.value as SortKey)}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <p className="toolbar__count">
        {count === total ? (
          <>
            <strong>{total}</strong> albums
          </>
        ) : (
          <>
            <strong>{count}</strong> of {total}
          </>
        )}
      </p>
    </div>
  );
}
