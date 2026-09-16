import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
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

  async function fetchStatus() {
    try {
      const s = await api.status();
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
