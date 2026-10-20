import { useEffect, useState } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Hand } from 'lucide-react';
import { bridge } from '../game/bridge.js';
import { useSettings } from '../state/AppContext.jsx';
import { useGame } from '../state/GameContext.jsx';

function useCoarsePointer() {
  const [coarse, setCoarse] = useState(() => typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches);
  useEffect(() => {
    const mq = window.matchMedia?.('(pointer: coarse)');
    if (!mq) return undefined;
    const fn = () => setCoarse(mq.matches);
    mq.addEventListener?.('change', fn);
    return () => mq.removeEventListener?.('change', fn);
  }, []);
  return coarse;
}

function PadButton({ dir, Icon, className }) {
  const press = (e) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    bridge.emit('touch-dir', dir);
  };
  const release = (e) => {
    e.preventDefault();
    bridge.emit('touch-dir', null);
  };
  return (
    <button
      type="button"
      aria-label={`Walk ${dir}`}
      className={`absolute w-14 h-14 rounded-2xl bg-paper/90 sticker-sm flex items-center justify-center active:bg-gold touch-none ${className}`}
      onPointerDown={press}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      onContextMenu={(e) => e.preventDefault()}
    >
      <Icon className="w-7 h-7" />
    </button>
  );
}

export function TouchControls() {
  const { settings } = useSettings();
  const { panel, state } = useGame();
  const coarse = useCoarsePointer();
  const show = settings.touchControls === 'on' || (settings.touchControls === 'auto' && coarse);
  if (!show || panel || state.dialogue) return null;
  return (
    <>
      <div className="absolute left-3 bottom-3 z-30 w-[11.5rem] h-[11.5rem] select-none" data-testid="dpad">
        <PadButton dir="up" Icon={ChevronUp} className="left-1/2 -translate-x-1/2 top-0" />
        <PadButton dir="down" Icon={ChevronDown} className="left-1/2 -translate-x-1/2 bottom-0" />
        <PadButton dir="left" Icon={ChevronLeft} className="left-0 top-1/2 -translate-y-1/2" />
        <PadButton dir="right" Icon={ChevronRight} className="right-0 top-1/2 -translate-y-1/2" />
      </div>
      <button
        type="button"
        aria-label="Interact"
        className="absolute right-4 bottom-6 z-30 w-20 h-20 rounded-full bg-gold sticker flex items-center justify-center font-display font-extrabold active:translate-x-0.5 active:translate-y-0.5 touch-none"
        onPointerDown={(e) => {
          e.preventDefault();
          bridge.emit('touch-interact');
        }}
      >
        <Hand className="w-9 h-9" />
      </button>
    </>
  );
}
