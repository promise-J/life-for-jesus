import { useEffect, useState } from 'react';
import { BookMarked } from 'lucide-react';
import { Api } from '../api/client.js';

const cache = new Map();

export async function fetchPassage(ref) {
  if (cache.has(ref)) return cache.get(ref);
  const p = Api.passage(ref).then((r) => r.passage);
  cache.set(ref, p);
  p.catch(() => cache.delete(ref));
  return p;
}

/**
 * Shows the actual text of a Bible passage from the server's public-domain WEB data,
 * visually distinct from game dialogue and commentary.
 */
export function ScriptureCard({ refText, onRead, compact = false, why }) {
  const [passage, setPassage] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    let alive = true;
    setPassage(null);
    setError(null);
    fetchPassage(refText)
      .then((p) => {
        if (!alive) return;
        setPassage(p);
        onRead?.(refText);
      })
      .catch((e) => alive && setError(e));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refText]);
  return (
    <figure className={`scripture-card rounded-xl px-4 ${compact ? 'py-2' : 'py-3'} my-2`}>
      <figcaption className="flex items-center gap-2 font-sans text-sm font-extrabold text-ink mb-1">
        <BookMarked className="w-4 h-4 text-gold-deep" aria-hidden />
        <span>{passage?.reference || refText}</span>
        <span className="ml-auto text-xs font-bold text-ink/60">Scripture · {passage?.translation?.id || 'WEB'}</span>
      </figcaption>
      {error && <p className="font-sans text-sm text-laterite">Scripture text is unavailable right now ({error.message}). Reference: {refText}.</p>}
      {!passage && !error && <p className="font-sans text-sm text-ink/60">Loading…</p>}
      {passage && (
        <blockquote className={`${compact ? 'text-[0.95rem] max-h-40 overflow-y-auto' : 'text-[1.02rem]'} text-ink`}>
          {passage.verses.map((v) => (
            <span key={v.verse}>
              {passage.verses.length > 1 && <sup className="font-sans text-[0.65em] font-bold text-gold-deep mr-0.5">{v.verse}</sup>}
              {v.text}{' '}
            </span>
          ))}
        </blockquote>
      )}
      {why && <p className="font-sans text-sm text-ink/75 mt-1.5 border-t border-ink/10 pt-1.5"><span className="font-bold">Why it’s here (game commentary):</span> {why}</p>}
    </figure>
  );
}
