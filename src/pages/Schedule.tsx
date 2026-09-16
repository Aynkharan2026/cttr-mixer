import { useFacets } from '../FacetsContext';

function hourLabel(h: number): string {
  const period = h < 12 ? 'AM' : 'PM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}${period}`;
}

export default function Schedule() {
  const facets = useFacets();

  return (
    <div>
      <h1 className="tamil text-lg font-bold mb-4" style={{ color: 'var(--gold)' }}>
        நேர அட்டவணை
      </h1>
      {!facets ? (
        <div className="text-white/40 text-sm">ஏற்றுகிறது...</div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {facets.dayparts.map((d) => (
            <div
              key={d.code}
              className="flex items-center justify-between rounded-xl border px-4 py-3.5"
              style={{ borderColor: 'var(--card-border)', background: 'rgba(255,255,255,0.02)' }}
            >
              <div>
                <div className="tamil text-sm font-semibold" style={{ color: 'var(--gold)' }}>
                  {d.label_tamil || d.label}
                </div>
                <div className="text-xs text-white/40 mt-0.5">{d.label}</div>
              </div>
              <div className="text-sm text-white/70 tabular-nums">
                {hourLabel(d.start_hour)} – {hourLabel(d.end_hour)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
