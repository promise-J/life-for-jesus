import { useEffect, useRef } from 'react';
import { drawCharacter, FRAME_W, FRAME_H } from '../game/art/character.js';

/** Animated preview of a character look. Purely cosmetic. */
export function CharacterPreview({ look, size = 4, dir = 'down', animate = true, className = '', label }) {
  const ref = useRef(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext?.('2d');
    if (!ctx) return; // jsdom / no canvas
    let frame = 0;
    let raf;
    let last = 0;
    const draw = (t) => {
      if (t - last > 220 || !last) {
        last = t;
        ctx.clearRect(0, 0, c.width, c.height);
        drawCharacter(ctx, look, dir, animate ? [0, 1, 0, 2][frame % 4] : 0, 0, 0, size);
        frame++;
      }
      if (animate) raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [look, size, dir, animate]);
  return <canvas ref={ref} width={FRAME_W * size} height={FRAME_H * size} className={className} role="img" aria-label={label || 'Character preview'} />;
}
