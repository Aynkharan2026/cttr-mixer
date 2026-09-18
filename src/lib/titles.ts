// Shared bilingual title formatting — every place a track title renders (Now
// Playing, search/browse results, queue, broadcast/play history, the
// schedule/playlist editor, the clock-slot track picker) is supposed to show
// "தமிழ் தலைப்பு / English Title" side by side, not one language with the
// other as a silent fallback. A previous pass (see ScheduleEditor.tsx/
// TrackRow.tsx history) made every site *prefer* title_tamil with an English
// fallback — correct for a single-language display, but not what this needs:
// both should show together whenever both exist. Centralized here so all
// call sites stay in sync rather than re-deriving the same three-way
// null-handling independently.
//
// Fallback rules (never render a bare "/" with one side empty):
//   - both present      -> "தமிழ் / English"
//   - only Tamil         -> "தமிழ்"
//   - only English        -> "English"
//   - neither (+ optional extra fallback, e.g. filename) -> extraFallback or "Untitled"
export function bilingualTitle(
  titleTamil?: string | null,
  title?: string | null,
  extraFallback?: string | null,
): string {
  const tamil = titleTamil?.trim();
  const english = title?.trim();
  if (tamil && english) return `${tamil} / ${english}`;
  if (tamil) return tamil;
  if (english) return english;
  return extraFallback?.trim() || 'Untitled';
}
