import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { audio } from '../audio/audio.js';

export function Button({ variant = 'gold', className = '', sound = 'click', onClick, children, ...rest }) {
  return (
    <button
      type="button"
      className={`btn btn-${variant} ${className}`}
      onClick={(e) => {
        audio.unlock();
        if (sound) audio.sfxPlay(sound);
        onClick?.(e);
      }}
      {...rest}
    >
      {children}
    </button>
  );
}

/**
 * A modal panel. On phones it becomes a bottom sheet so the world stays partly visible.
 * Traps nothing fancy: Esc closes, focus moves to the panel on open.
 */
export function Panel({ title, icon: Icon, onClose, children, wide = false, tone = 'paper', footer, labelledBy }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  const toneCls = tone === 'night' ? 'bg-indigo text-paper' : 'bg-paper text-ink';
  return (
    <div className="absolute inset-0 z-40 flex items-end sm:items-center justify-center bg-indigo-night/40 p-0 sm:p-4" onPointerDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <section
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy || 'panel-title'}
        className={`pop-in sticker ${toneCls} w-full ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'} max-h-[82vh] sm:max-h-[88vh] flex flex-col rounded-t-3xl sm:rounded-3xl outline-none`}
      >
        <header className="flex items-center gap-3 px-5 pt-4 pb-3 border-b-2 border-ink/15">
          {Icon && <Icon aria-hidden className="w-6 h-6 shrink-0" />}
          <h2 id={labelledBy || 'panel-title'} className="font-display font-extrabold text-2xl leading-none flex-1 pt-1">
            {title}
          </h2>
          {onClose && (
            <button type="button" aria-label="Close" onClick={() => { audio.sfxPlay('close'); onClose(); }} className="rounded-full p-1.5 hover:bg-ink/10">
              <X className="w-6 h-6" />
            </button>
          )}
        </header>
        <div className="overflow-y-auto scroll-thin px-5 py-4 flex-1">{children}</div>
        {footer && <footer className="px-5 py-3 border-t-2 border-ink/15">{footer}</footer>}
      </section>
    </div>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div role="tablist" className="flex gap-2 flex-wrap mb-4">
      {tabs.map((t) => (
        <button
          key={t.id}
          role="tab"
          type="button"
          aria-selected={value === t.id}
          onClick={() => { audio.sfxPlay('click'); onChange(t.id); }}
          className={`font-display font-bold px-3 py-1 rounded-full sticker-sm ${value === t.id ? 'bg-gold' : 'bg-white/70'}`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Meter({ label, value, max = 100, color = 'bg-leaf', compact = false }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={compact ? '' : 'mb-2'}>
      <div className="flex justify-between text-sm font-bold">
        <span>{label}</span>
        <span>{Math.round(value)}</span>
      </div>
      <div className="h-3 rounded-full bg-ink/15 overflow-hidden border-2 border-ink" role="meter" aria-label={label} aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={max}>
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function Coins({ value, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 font-bold ${className}`}>
      <span aria-hidden className="inline-block w-4 h-4 rounded-full bg-gold border-2 border-ink" />
      {Number(value || 0).toLocaleString()} <span className="sr-only">Life Coins</span><span aria-hidden className="text-xs opacity-70">LC</span>
    </span>
  );
}

export function Empty({ children }) {
  return <p className="text-ink/70 italic py-3">{children}</p>;
}

export function ErrorNote({ error }) {
  if (!error) return null;
  return (
    <p role="alert" className="bg-laterite/10 border-2 border-laterite text-laterite rounded-xl px-3 py-2 text-sm font-bold my-2">
      {error.message || String(error)}
    </p>
  );
}

export function Spinner({ label = 'Loading' }) {
  return (
    <div role="status" className="flex items-center gap-3 text-paper font-display font-bold">
      <span className="w-6 h-6 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      {label}
    </div>
  );
}
