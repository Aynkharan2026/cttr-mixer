import type { ClockSlotType } from './types';

// Color coding for the hour-clock timeline + calendar (clock_slots.slot_type).
// Fixed colors per the build spec: music=gold, talk=red, news=blue, jingle=green,
// time=grey. station_id/ad/custom aren't specified exactly, so they're chosen to
// stay legible against the purple console background (index.css --bg-*) without
// clashing with the 5 fixed colors above.
export const CLOCK_SLOT_TYPES: {
  code: ClockSlotType;
  label: string;
  icon: string;
  color: string;
}[] = [
  { code: 'music', label: 'இசை', icon: '🎵', color: '#d4af37' },
  { code: 'talk_show', label: 'நேரடி உரையாடல்', icon: '🎙️', color: '#ef4444' },
  { code: 'news', label: 'செய்திகள்', icon: '📰', color: '#3b82f6' },
  { code: 'jingle', label: 'ஜிங்கிள்', icon: '🔔', color: '#22c55e' },
  { code: 'time_announce', label: 'நேர அறிவிப்பு', icon: '⏰', color: '#9ca3af' },
  { code: 'station_id', label: 'நிலைய அடையாளம்', icon: '🆔', color: '#a78bfa' },
  { code: 'ad', label: 'விளம்பரம்', icon: '📢', color: '#f59e0b' },
  { code: 'custom', label: 'தனிப்பயன்', icon: '⚙️', color: '#22d3ee' },
];

export function clockSlotMeta(code: string | null | undefined) {
  return CLOCK_SLOT_TYPES.find((s) => s.code === code) || CLOCK_SLOT_TYPES[0];
}

// Slot types clock_slots fires once per occurrence (scheduler loop) rather than
// pick_next() reading continuously — mirrors control_api.py's MOMENTARY_SLOT_TYPES.
export const MOMENTARY_SLOT_TYPES: ClockSlotType[] = ['jingle', 'station_id', 'time_announce'];

export const DAY_NAMES_TAMIL = ['ஞாயிறு', 'திங்கள்', 'செவ்வாய்', 'புதன்', 'வியாழன்', 'வெள்ளி', 'சனி'];
export const DAY_NAMES_SHORT = ['ஞா', 'தி', 'செ', 'பு', 'வி', 'வெ', 'ச'];
