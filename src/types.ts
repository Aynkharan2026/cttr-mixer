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

export interface PlayLogEntry {
  picked_at: string;
  source: 'schedule' | 'playlist' | 'request';
  daypart: string | null;
  playlist_id: number | null;
  track_id: string | null;
  title: string | null;
  artist: string | null;
  movie_name: string | null;
  duration_sec: number | null;
}
