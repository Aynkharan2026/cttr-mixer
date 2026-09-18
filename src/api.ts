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
    request<{ ok: boolean; ahead_count: number; queued: import('./types').Track }>('/api/queue', {
      method: 'POST',
      body: JSON.stringify({ track_id: trackId }),
    }),
  playNow: (trackId: string) =>
    request<{ ok: boolean; ahead_count: number; queued: import('./types').Track }>(
      `/api/tracks/${trackId}/play-now`,
      { method: 'POST' },
    ),
  playNext: (trackId: string) =>
    request<{ ok: boolean; ahead_count: number; queued: import('./types').Track }>(
      `/api/tracks/${trackId}/play-next`,
      { method: 'POST' },
    ),
  archiveTrack: (trackId: string) =>
    request<{ ok: boolean }>(`/api/tracks/${trackId}/archive`, { method: 'POST' }),
  restoreTrack: (trackId: string) =>
    request<{ ok: boolean }>(`/api/tracks/${trackId}/restore`, { method: 'POST' }),
  archivedTracks: (params: { limit?: number; offset?: number } = {}) =>
    request<{ results: import('./types').ArchivedTrack[]; limit: number; offset: number }>(
      `/api/tracks/archived${qs(params)}`,
    ),
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

  // Hour-clock + calendar scheduling engine.
  clocks: () => request<{ results: import('./types').ScheduleClock[] }>('/api/schedule/clocks'),
  clock: (id: number) => request<import('./types').ScheduleClockDetail>(`/api/schedule/clocks/${id}`),
  createClock: (body: { name: string; name_tamil?: string; description?: string }) =>
    request<{ ok: true; id: number }>('/api/schedule/clocks', { method: 'POST', body: JSON.stringify(body) }),
  updateClock: (id: number, body: Partial<{ name: string; name_tamil: string; description: string }>) =>
    request<{ ok: true }>(`/api/schedule/clocks/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteClock: (id: number) => request<{ ok: true }>(`/api/schedule/clocks/${id}`, { method: 'DELETE' }),
  duplicateClock: (id: number, body: { name: string; name_tamil?: string }) =>
    request<{ ok: true; id: number }>(`/api/schedule/clocks/${id}/duplicate`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  createSlot: (
    clockId: number,
    body: {
      minute_offset: number;
      duration_minutes: number;
      slot_type: import('./types').ClockSlotType;
      playlist_id?: number | null;
      track_id?: string | null;
      is_live?: boolean;
      label?: string | null;
      label_tamil?: string | null;
    },
  ) => request<{ ok: true; id: number }>(`/api/schedule/clocks/${clockId}/slots`, {
    method: 'POST',
    body: JSON.stringify(body),
  }),
  updateSlot: (
    clockId: number,
    slotId: number,
    body: Partial<{
      minute_offset: number;
      duration_minutes: number;
      slot_type: import('./types').ClockSlotType;
      playlist_id: number | null;
      track_id: string | null;
      clear_playlist: boolean;
      clear_track: boolean;
      is_live: boolean;
      label: string | null;
      label_tamil: string | null;
    }>,
  ) => request<{ ok: true }>(`/api/schedule/clocks/${clockId}/slots/${slotId}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }),
  deleteSlot: (clockId: number, slotId: number) =>
    request<{ ok: true }>(`/api/schedule/clocks/${clockId}/slots/${slotId}`, { method: 'DELETE' }),

  calendar: (params: { start?: string; end?: string } = {}) =>
    request<{ results: import('./types').CalendarEntry[] }>(`/api/schedule/calendar${qs(params)}`),
  createCalendarEntry: (body: {
    clock_id: number;
    date?: string | null;
    day_of_week?: number | null;
    hour_start: number;
    hour_end: number;
    priority?: number;
    enabled?: boolean;
  }) => request<{ ok: true; id: number }>('/api/schedule/calendar', { method: 'POST', body: JSON.stringify(body) }),
  updateCalendarEntry: (
    id: number,
    body: Partial<{
      clock_id: number;
      date: string | null;
      day_of_week: number | null;
      clear_date: boolean;
      clear_day_of_week: boolean;
      hour_start: number;
      hour_end: number;
      priority: number;
      enabled: boolean;
    }>,
  ) => request<{ ok: true }>(`/api/schedule/calendar/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteCalendarEntry: (id: number) => request<{ ok: true }>(`/api/schedule/calendar/${id}`, { method: 'DELETE' }),
  applyWeek: (body: { clock_id: number; hour_start: number; hour_end: number; priority?: number }) =>
    request<{ ok: true; calendar_ids: number[] }>('/api/schedule/calendar/apply-week', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  scheduleStatus: () => request<import('./types').ScheduleStatus>('/api/schedule/status'),
  upcoming: (count = 8) => request<import('./types').UpcomingResponse>(`/api/schedule/upcoming${qs({ count })}`),

  inserts: () => request<{ results: import('./types').ScheduleInsert[] }>('/api/schedule/inserts'),
  createInsert: (body: {
    insert_type: import('./types').InsertType;
    label?: string;
    interval_minutes: number;
    audio_file?: string;
    tts_template?: string;
    enabled?: boolean;
  }) => request<{ ok: true; id: number }>('/api/schedule/inserts', { method: 'POST', body: JSON.stringify(body) }),
  updateInsert: (
    id: number,
    body: Partial<{
      label: string;
      interval_minutes: number;
      audio_file: string | null;
      clear_audio_file: boolean;
      tts_template: string | null;
      clear_tts_template: boolean;
      enabled: boolean;
    }>,
  ) => request<{ ok: true }>(`/api/schedule/inserts/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteInsert: (id: number) => request<{ ok: true }>(`/api/schedule/inserts/${id}`, { method: 'DELETE' }),
  fireInsertNow: (id: number) =>
    request<{ ok: true; label: string; file: string }>(`/api/schedule/inserts/${id}/fire-now`, { method: 'POST' }),

  // ஒலிபரப்பு பதிவு — Broadcast log: merges radio_play_log ("what aired") and the
  // new station_events table ("what an RJ/scheduler did") into one timeline.
  broadcastLog: (params: { start?: string; end?: string; limit?: number } = {}) =>
    request<{ results: import('./types').BroadcastLogEntry[] }>(`/api/broadcast-log${qs(params)}`),

  // iziCast / iPhone live-broadcast setup guide. Server/port/mount/user load with
  // the page; the password is a separate call the RJ triggers explicitly by
  // clicking "reveal" — never present in the page's initial load or the JS bundle.
  liveHarborInfo: () =>
    request<{ server: string; port: number; mount: string; user: string }>('/api/live/harbor-info'),
  liveHarborPassword: () => request<{ password: string }>('/api/live/harbor-password'),
};
