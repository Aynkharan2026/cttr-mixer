import { useEffect, useState } from 'react';

// Station operates on America/Toronto time (STATION_TZ default in control_api.py —
// daypart windows are computed against it), so the console clock is pinned to that
// zone rather than the operator's browser locale, to match what "night/morning/..."
// on screen actually means for the broadcast.
const STATION_TZ = 'America/Toronto';

const fmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: STATION_TZ,
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
});

export default function LiveClock({ className }: { className?: string }) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className={`tabular-nums ${className ?? ''}`} title={`${STATION_TZ} (station time)`}>
      {fmt.format(now)}
    </span>
  );
}
