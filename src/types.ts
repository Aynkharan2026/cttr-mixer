export interface Track {
  id: string;
  title: string | null;
  title_tamil: string | null;
  title_romanized: string | null;
  artist: string | null;
  album: string | null;
  movie_name: string | null;
  music_director: string | null;
  year: number | null;
  duration_sec: number | null;
  is_eelam: boolean;
  filename?: string;
  singers: string[];
  moods: string[];
  dayparts: string[];
  content_types: string[];
}

export interface Facet {
  code: string;
  label: string;
  label_tamil: string | null;
}

export interface DaypartFacet extends Facet {
  start_hour: number;
  end_hour: number;
}

export interface ContentTypeFacet extends Facet {
  is_music: boolean;
}

export interface Facets {
  moods: Facet[];
  dayparts: DaypartFacet[];
  content_types: ContentTypeFacet[];
}

export interface EntitySummary {
  id: number;
  name: string;
  name_key: string;
  track_count: number;
  year?: number | null;
}

export interface SearchResponse {
  results: Track[];
  limit: number;
  offset: number;
}

export interface YearSummary {
  year: number;
  track_count: number;
}

export interface LiveState {
  enabled: boolean;
  connected: boolean;
}

export interface NowPlaying extends Record<string, unknown> {
  track_id?: string;
  title?: string;
  artist?: string;
  started_at: number | null;
  elapsed_sec: number | null;
  details: Track | null;
}

export interface ListenerCounts {
  icecast: number | null;
  yesstreaming: number | null;
  total: number;
}

// What Icecast reports about the actual encoder source for our mount: connected
// (an encoder is live) and its configured bitrate. There is no sample-level audio
// meter available server-side — see components/StreamMeter.tsx for how this is
// honestly presented (connection/bitrate health, not a fabricated VU needle).
export interface StreamHealth {
  connected: boolean;
  bitrate_kbps: number | null;
  listeners: number | null;
}

export interface StatusResponse {
  liquidsoap_online: boolean;
  on_air?: string;
  paused?: boolean;
  live?: LiveState;
  daypart?: string | null;
  now_playing?: NowPlaying;
  queue?: Track[];
  listeners: ListenerCounts;
  stream?: StreamHealth;
}

// Schedule editor — backed by the real `playlists` / `playlist_tracks` tables that
// pick_next() already reads on the Liquidsoap side (see control_api.py). slot_type
// is an organizational tag only: nothing server-side filters playback content by it,
// since the catalog has no curated jingle/news/talk-show audio to enforce it against.
export type SlotType = 'music' | 'news' | 'talk_show' | 'ads_jingles';

export interface Playlist {
  id: number;
  name: string;
  description: string | null;
  slot_type: SlotType | null;
  channel: string;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
  daypart: string;
  daypart_label: string;
  daypart_label_tamil: string | null;
  track_count: number;
}

export interface PlaylistTrack extends Track {
  position: number;
}

export interface ArchivedTrack extends Track {
  archived_at: string;
}

// /api/broadcast-log: a "played" row (from radio_play_log) or any station_events
// row (event_type as `type`, e.g. live_on/live_off/skip/queue_add/play_now/
// play_next/track_archived/track_restored). Discriminated loosely by `type`
// since the two source rows carry genuinely different fields.
export interface BroadcastLogEntry {
  type: string;
  at: string;
  // "played" fields
  source?: string;
  daypart?: string | null;
  playlist_id?: number | null;
  track_id?: string | null;
  title?: string | null;
  artist?: string | null;
  movie_name?: string | null;
  // station_events fields
  details?: Record<string, unknown>;
  actor?: string | null;
}

export interface PlayLogEntry {
  picked_at: string;
  source: 'schedule' | 'playlist' | 'request';
  daypart: string | null;
  playlist_id: number | null;
  track_id: string | null;
  title: string | null;
  title_tamil: string | null;
  filename: string | null;
  artist: string | null;
  movie_name: string | null;
  duration_sec: number | null;
}

// -----------------------------------------------------------------------------
// Hour-clock + calendar scheduling engine (schedule_clocks / clock_slots /
// schedule_calendar / schedule_inserts — control_api.py). Distinct from, and
// layered on top of, the Playlist/SlotType editor above: clock_slots reference
// the SAME playlists.id for their music/news/talk content, they just add
// minute-by-minute timing + a real calendar on top of it.
// -----------------------------------------------------------------------------
export type ClockSlotType =
  | 'music'
  | 'jingle'
  | 'station_id'
  | 'time_announce'
  | 'news'
  | 'talk_show'
  | 'ad'
  | 'custom';

export interface ScheduleClock {
  id: number;
  name: string;
  name_tamil: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  slot_count?: number;
}

export interface ClockSlot {
  id: number;
  minute_offset: number;
  duration_minutes: number;
  slot_type: ClockSlotType;
  playlist_id: number | null;
  track_id: string | null;
  is_live: boolean;
  label: string | null;
  label_tamil: string | null;
  playlist_name?: string | null;
  track_title?: string | null;
}

export interface ScheduleClockDetail extends ScheduleClock {
  slots: ClockSlot[];
}

// 0 = Sunday .. 6 = Saturday (matches JS Date.getDay()).
export interface CalendarEntry {
  id: number;
  clock_id: number;
  clock_name: string;
  clock_name_tamil: string | null;
  date: string | null;
  day_of_week: number | null;
  hour_start: number;
  hour_end: number;
  priority: number;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export type InsertType = 'station_id' | 'time_announce' | 'jingle';

export interface ScheduleInsert {
  id: number;
  insert_type: InsertType;
  label: string | null;
  interval_minutes: number;
  audio_file: string | null;
  tts_template: string | null;
  enabled: boolean;
  last_fired_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScheduleStatus {
  station_time: string;
  active_clock: { id: number; name: string; name_tamil: string | null } | null;
  active_slot: ClockSlot | null;
  inserts: ScheduleInsert[];
  tts_available: boolean;
}

// /api/schedule/upcoming — a genuine forward preview of what pick_next() will
// actually hand Liquidsoap next (playlist-in-order for the active clock slot,
// else the daypart rule engine), NOT Liquidsoap's own near-always-empty request
// queue. Read-only: never writes to radio_play_log, so polling it is free.
export interface UpcomingTrack extends Track {
  source: 'schedule' | 'playlist' | 'request';
  playlist_id: number | null;
}

export interface UpcomingResponse {
  results: UpcomingTrack[];
  daypart: string;
  active_slot_label: string | null;
}
