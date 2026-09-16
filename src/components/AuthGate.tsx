import { useState, type FormEvent, type ReactNode } from 'react';
import { getToken, setToken } from '../api';

export default function AuthGate({ children }: { children: ReactNode }) {
  const [hasToken, setHasToken] = useState(() => Boolean(getToken()));
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (hasToken) return <>{children}</>;

  function submit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      setError('அணுகல் குறியீடு தேவை');
      return;
    }
    setToken(trimmed);
    setHasToken(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border p-6 shadow-2xl"
        style={{ borderColor: 'var(--card-border)', background: 'rgba(45, 27, 78, 0.45)', backdropFilter: 'blur(12px)' }}
      >
        <div className="text-center mb-6">
          <div className="tamil text-lg font-semibold" style={{ color: 'var(--gold)' }}>
            CTTR மிக்சர்
          </div>
          <div className="text-xs text-white/40 mt-1">Canada Trenton Tamil Radio — control panel</div>
        </div>
        <label className="tamil block text-sm mb-2 text-white/70">அணுகல் குறியீடு (API Token)</label>
        <input
          type="password"
          autoFocus
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          placeholder="••••••••••••••••"
          className="w-full rounded-lg border bg-black/30 px-3 py-2.5 text-sm text-white outline-none focus:ring-2"
          style={{ borderColor: 'var(--card-border)' }}
        />
        {error && <div className="text-xs text-red-400 mt-2">{error}</div>}
        <button
          type="submit"
          className="tamil mt-5 w-full rounded-lg py-2.5 text-sm font-semibold transition"
          style={{ background: 'var(--gold)', color: '#1a0a2e' }}
        >
          தொடர்க
        </button>
        <div className="text-[11px] text-white/30 mt-4 text-center leading-relaxed">
          இந்தச் சாதனத்தில் மட்டும் சேமிக்கப்படும். Anton only — ask the station admin for the token.
        </div>
      </form>
    </div>
  );
}
