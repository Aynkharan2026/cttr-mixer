// Thin client for the CTTR control API. The Bearer token is never bundled into
// the build — it's entered once by the operator and kept in localStorage only
// (see AuthGate). Anyone reading this file or the shipped JS finds no secret.

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.cttr.ca';
const TOKEN_KEY = 'cttr_mixer_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    if (res.status === 401) clearToken();
    throw new ApiError(res.status, text || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

function qs(params: Record<string, string | number | boolean | undefined | null>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  }
  return parts.length ? `?${parts.join('&')}` : '';
}

export const api = {
  health: () => request<{ ok: boolean }>('/api/health'),
  status: () => request<import('./types').StatusResponse>('/api/status'),
  facets: () => request<import('./types').Facets>('/api/facets'),

  search: (params: {
    q?: string;
    artist?: string;
    movie?: string;
    mood?: string;
    daypart?: string;
    content_type?: string;
    year?: number;
    limit?: number;
    offset?: number;
  }) => request<import('./types').SearchResponse>(`/api/search${qs(params)}`),

  movies: (params: { q?: string; sort?: string; order?: string; limit?: number; offset?: number }) =>
    request<{ results: import('./types').EntitySummary[] }>(`/api/movies${qs(params)}`),
  movieTracks: (id: number, params: { limit?: number; offset?: number } = {}) =>
    request<{ movie: { id: number; name: string; year: number | null }; results: import('./types').Track[] }>(
      `/api/movies/${id}/tracks${qs(params)}`,
    ),

  singers: (params: { q?: string; sort?: string; order?: string; limit?: number; offset?: number }) =>
    request<{ results: import('./types').EntitySummary[] }>(`/api/singers${qs(params)}`),
  singerTracks: (id: number, params: { limit?: number; offset?: number } = {}) =>
    request<{ singer: { id: number; name: string }; results: import('./types').Track[] }>(
      `/api/singers/${id}/tracks${qs(params)}`,
    ),

  musicDirectors: (params: { q?: string; sort?: string; order?: string; limit?: number; offset?: number }) =>
    request<{ results: import('./types').EntitySummary[] }>(`/api/music-directors${qs(params)}`),
  musicDirectorTracks: (id: number, params: { limit?: number; offset?: number } = {}) =>
    request<{ music_director: { id: number; name: string }; results: import('./types').Track[] }>(
      `/api/music-directors/${id}/tracks${qs(params)}`,
    ),

  songwriters: (params: { q?: string; sort?: string; order?: string; limit?: number; offset?: number }) =>
    request<{ results: import('./types').EntitySummary[] }>(`/api/songwriters${qs(params)}`),
  songwriterTracks: (id: number, params: { limit?: number; offset?: number } = {}) =>
    request<{ songwriter: { id: number; name: string }; results: import('./types').Track[] }>(
      `/api/songwriters/${id}/tracks${qs(params)}`,
    ),

  years: () => request<{ results: import('./types').YearSummary[] }>('/api/years'),
  yearTracks: (year: number, params: { limit?: number; offset?: number } = {}) =>
    request<{ year: number; results: import('./types').Track[] }>(`/api/years/${year}/tracks${qs(params)}`),

  queueTrack: (trackId: string) =>
    request<{ ok: boolean; queued: import('./types').Track }>('/api/queue', {
      method: 'POST',
      body: JSON.stringify({ track_id: trackId }),
    }),
  skip: () => request<{ ok: boolean }>('/api/skip', { method: 'POST' }),
  pause: () => request<{ ok: boolean }>('/api/pause', { method: 'POST' }),
  resume: () => request<{ ok: boolean }>('/api/resume', { method: 'POST' }),
  setLive: (enabled: boolean) =>
    request<{ ok: boolean }>('/api/live', { method: 'POST', body: JSON.stringify({ enabled }) }),

  history: (limit = 25) => request<{ history: import('./types').PlayLogEntry[] }>(`/api/history${qs({ limit })}`),

  // Schedule editor: real CRUD against the playlists / playlist_tracks tables that
  // the broadcast engine (pick_next in control_api.py) already reads.
  playlists: (params: { channel?: string } = {}) =>
    request<{ results: import('./types').Playlist[] }>(`/api/schedule/playlists${qs(params)}`),
  createPlaylist: (body: {
    name: string;
    daypart: string;
    channel?: string;
    description?: string;
    scheduled_at?: string | null;
    slot_type?: string | null;
  }) => request<{ ok: true; id: number }>('/api/schedule/playlists', { method: 'POST', body: JSON.stringify(body) }),
  updatePlaylist: (
    id: number,
    body: Partial<{
      name: string;
      description: string;
      daypart: string;
      scheduled_at: string | null;
      clear_scheduled_at: boolean;
      slot_type: string | null;
    }>,
  ) => request<{ ok: true }>(`/api/schedule/playlists/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deletePlaylist: (id: number) => request<{ ok: true }>(`/api/schedule/playlists/${id}`, { method: 'DELETE' }),

  playlistTracks: (id: number) =>
    request<{ results: import('./types').PlaylistTrack[] }>(`/api/schedule/playlists/${id}/tracks`),
  addPlaylistTrack: (id: number, trackId: string, position?: number) =>
    request<{ ok: true; position: number; track_count: number }>(`/api/schedule/playlists/${id}/tracks`, {
      method: 'POST',
      body: JSON.stringify({ track_id: trackId, position }),
    }),
  reorderPlaylistTracks: (id: number, trackIds: string[]) =>
    request<{ ok: true; track_count: number }>(`/api/schedule/playlists/${id}/tracks/order`, {
      method: 'PUT',
      body: JSON.stringify({ track_ids: trackIds }),
    }),
  removePlaylistTrack: (id: number, trackId: string) =>
    request<{ ok: true; track_count: number }>(`/api/schedule/playlists/${id}/tracks/${trackId}`, {
      method: 'DELETE',
    }),
};
