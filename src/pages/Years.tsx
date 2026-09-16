import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import type { YearSummary } from '../types';

function decadeOf(year: number): number {
  return Math.floor(year / 10) * 10;
}

export default function Years() {
  const [years, setYears] = useState<YearSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDecade, setOpenDecade] = useState<number | null>(null);

  useEffect(() => {
    api
      .years()
      .then((res) => setYears(res.results))
      .finally(() => setLoading(false));
  }, []);

  const decades = new Map<number, YearSummary[]>();
  for (const y of years) {
    const d = decadeOf(y.year);
    if (!decades.has(d)) decades.set(d, []);
    decades.get(d)!.push(y);
  }
  const sortedDecades = [...decades.keys()].sort((a, b) => b - a);

  return (
    <div>
      <h1 className="tamil text-lg font-bold mb-4" style={{ color: 'var(--gold)' }}>
        ஆண்டு
      </h1>
      {loading && <div className="text-white/40 text-sm">ஏற்றுகிறது...</div>}
      <div className="flex flex-col gap-2">
        {sortedDecades.map((decade) => {
          const isOpen = openDecade === decade;
          const decadeYears = decades.get(decade)!;
          const total = decadeYears.reduce((s, y) => s + y.track_count, 0);
          return (
            <div key={decade} className="rounded-xl border" style={{ borderColor: 'var(--card-border)' }}>
              <button
                onClick={() => setOpenDecade(isOpen ? null : decade)}
                className="w-full flex items-center justify-between px-3.5 py-2.5 text-left"
              >
                <span className="text-sm font-medium text-white/90">{decade}s</span>
                <span className="text-xs text-white/40">{total} பாடல்கள்</span>
              </button>
              {isOpen && (
                <div className="flex flex-wrap gap-1.5 px-3.5 pb-3">
                  {decadeYears
                    .sort((a, b) => b.year - a.year)
                    .map((y) => (
                      <Link
                        key={y.year}
                        to={`/years/${y.year}`}
                        className="rounded-full px-3 py-1 text-xs border text-white/70 hover:text-white"
                        style={{ borderColor: 'var(--card-border)' }}
                      >
                        {y.year} · {y.track_count}
                      </Link>
                    ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
