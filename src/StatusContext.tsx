import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { api } from './api';
import type { StatusResponse } from './types';

interface StatusContextValue {
  status: StatusResponse | null;
  refresh: () => void;
}

const StatusContext = createContext<StatusContextValue>({ status: null, refresh: () => {} });

const POLL_MS = 7000;

export function StatusProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  // Out-of-order-response guard. fetchStatus is called both by the ambient
  // POLL_MS interval and, directly, by callers like TopBar's live-mic toggle
  // (await refresh() right after POSTing /api/live, to show the new state
  // immediately instead of waiting up to POLL_MS for the next tick). That
  // means two requests can legitimately be in flight at once, and nothing
  // about fetch() guarantees they resolve in the order they were sent --
  // this is exactly what looked like "on-air state flips on its own": an
  // ambient poll issued *before* the toggle's own POST could resolve *after*
  // the toggle's own refresh() already landed the correct new status,
  // silently overwriting it with the stale pre-toggle snapshot a moment
  // later. Each call now stamps a monotonically increasing sequence number
  // at issue time and only commits its response if no newer call has been
  // issued since -- a stale response is simply dropped instead of applied.
  const seqRef = useRef(0);

  async function fetchStatus() {
    const seq = ++seqRef.current;
    try {
      const s = await api.status();
      if (seq !== seqRef.current) return; // superseded by a newer request; discard
      setStatus(s);
    } catch {
      // transient network blip — keep the last known status on screen
    }
  }

  useEffect(() => {
    fetchStatus();
    const id = setInterval(fetchStatus, POLL_MS);
    return () => clearInterval(id);
  }, []);

  return <StatusContext.Provider value={{ status, refresh: fetchStatus }}>{children}</StatusContext.Provider>;
}

export function useStatus() {
  return useContext(StatusContext);
}
