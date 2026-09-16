import type { SlotType } from './types';

// Static labels for the schedule editor's "reserved slot types". This is purely an
// organizational tag stored on a playlist (control_api.py playlists.slot_type) — it
// is NOT enforced by the broadcast picker, since the catalog has no curated jingle /
// news / talk-show audio to filter against. Operators still add whatever tracks they
// want to a "news" or "ads" playlist by hand; the tag just labels the slot for humans.
export const SLOT_TYPES: { code: SlotType; label: string; icon: string }[] = [
  { code: 'music', label: 'இசை', icon: '♪' },
  { code: 'news', label: 'செய்திகள்', icon: '📰' },
  { code: 'talk_show', label: 'நேரடி உரையாடல்', icon: '🎙️' },
  { code: 'ads_jingles', label: 'விளம்பரம்', icon: '📢' },
];

export function slotTypeLabel(code: string | null | undefined): string {
  return SLOT_TYPES.find((s) => s.code === code)?.label || 'இசை';
}
