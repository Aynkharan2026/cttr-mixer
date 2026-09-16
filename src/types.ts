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

export interface StatusResponse {
  liquidsoap_online: boolean;
  on_air?: string;
  paused?: boolean;
  live?: LiveState;
  daypart?: string | null;
  now_playing?: NowPlaying;
  queue?: Track[];
  listeners: ListenerCounts;
}
