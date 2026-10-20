// Original procedural cartoon characters. Shared by Phaser (sprite sheets) and React (previews).
import { SKIN_TONES, HAIR_COLORS, OUTFITS } from '@lfj/shared';

export const FRAME_W = 32;
export const FRAME_H = 48;
export const DIRS = ['down', 'left', 'right', 'up'];
export const FRAMES_PER_DIR = 3;

export function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c) => Math.max(0, Math.min(255, Math.round(c + amt * 255)));
  const r = f(n >> 16);
  const g = f((n >> 8) & 255);
  const b = f(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

export function lookColors(look) {
  const skin = SKIN_TONES.find((s) => s.id === look.skin)?.color || '#8a5a3b';
  const hair = HAIR_COLORS.find((h) => h.id === look.hairColor)?.color || '#1b1412';
  const outfit = OUTFITS.find((o) => o.id === look.outfit) || OUTFITS[0];
  return { skin, hair, outfit };
}

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

/** Draw one frame. (ox, oy) is the frame's top-left in design units; s is the pixel scale. */
export function drawCharacter(ctx, look, dir = 'down', frame = 0, ox = 0, oy = 0, s = 2) {
  const { skin, hair, outfit } = lookColors(look);
  const female = look.gender === 'female';
  ctx.save();
  ctx.translate(ox * s, oy * s);
  ctx.scale(s, s);
  ctx.lineJoin = 'round';
  const ink = 'rgba(22,26,58,0.85)';
  const step = frame === 1 ? 1 : frame === 2 ? -1 : 0;
  const bob = frame === 0 ? 0 : -0.6;
  const side = dir === 'left' || dir === 'right';
  const flip = dir === 'left' ? -1 : 1;

  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(16, 45.5, 8.5, 2.6, 0, 0, Math.PI * 2);
  ctx.fill();

  // legs & shoes
  const legColor = female ? shade(skin, -0.05) : outfit.bottom;
  ctx.fillStyle = legColor;
  if (side) {
    rr(ctx, 13 + step * 2.2, 33, 4, 11, 1.5);
    rr(ctx, 15 - step * 2.2, 33, 4, 11, 1.5);
    ctx.fillStyle = '#2a2320';
    rr(ctx, 12 + step * 2.2 + (flip > 0 ? 1 : -1), 42.5, 6, 2.6, 1.2);
    rr(ctx, 14 - step * 2.2 + (flip > 0 ? 1 : -1), 42.5, 6, 2.6, 1.2);
  } else {
    rr(ctx, 11.5, 33, 4, 11 - Math.max(0, step), 1.5);
    rr(ctx, 16.5, 33, 4, 11 - Math.max(0, -step), 1.5);
    ctx.fillStyle = '#2a2320';
    rr(ctx, 11, 42.5 - Math.max(0, step), 5, 2.6, 1.2);
    rr(ctx, 16, 42.5 - Math.max(0, -step), 5, 2.6, 1.2);
  }

  ctx.translate(0, bob);
  // skirt / wrapper for female characters
  if (female) {
    ctx.fillStyle = outfit.bottom;
    ctx.beginPath();
    ctx.moveTo(9.5, 30);
    ctx.lineTo(22.5, 30);
    ctx.lineTo(24, 39);
    ctx.lineTo(8, 39);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = outfit.accent;
    ctx.fillRect(8.6, 36.5, 14.8, 1.4);
  }

  // arms (behind torso when walking sideways)
  const armSwing = step * 2;
  ctx.fillStyle = outfit.top;
  if (side) {
    rr(ctx, 14 - armSwing * flip, 23, 4, 10, 2);
  } else {
    rr(ctx, 6.5, 23 + armSwing * 0.5, 4, 10, 2);
    rr(ctx, 21.5, 23 - armSwing * 0.5, 4, 10, 2);
    ctx.fillStyle = skin;
    rr(ctx, 6.8, 31.5 + armSwing * 0.5, 3.4, 3, 1.5);
    rr(ctx, 21.8, 31.5 - armSwing * 0.5, 3.4, 3, 1.5);
  }

  // torso
  ctx.fillStyle = outfit.top;
  rr(ctx, 9, 21.5, 14, 12, 4);
  // ankara-style accent pattern
  ctx.fillStyle = outfit.accent;
  if (outfit.id.startsWith('ankara') || outfit.id.startsWith('wrapper')) {
    for (const [px, py] of [[12, 25], [16, 28], [20, 25], [12, 31], [20, 31]]) {
      ctx.beginPath();
      ctx.arc(px, py, 1.1, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (outfit.id === 'office_navy') {
    ctx.fillRect(15, 22, 2, 10); // tie
  } else if (outfit.id === 'kaftan_white') {
    ctx.fillRect(14.5, 22, 3, 6);
  } else {
    ctx.fillRect(10, 26, 12, 1.4);
  }
  if (side) {
    ctx.fillStyle = shade(outfit.top, -0.08);
    rr(ctx, 14 + armSwing * flip, 23, 4, 10, 2);
    ctx.fillStyle = skin;
    rr(ctx, 14.3 + armSwing * flip, 31.5, 3.4, 3, 1.5);
  }

  // neck + head
  ctx.fillStyle = shade(skin, -0.08);
  ctx.fillRect(14, 19, 4, 4);
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(16, 13.5, 9.5, 0, Math.PI * 2);
  ctx.fill();
  // ears
  if (!side) {
    ctx.beginPath();
    ctx.arc(6.8, 14.5, 1.8, 0, Math.PI * 2);
    ctx.arc(25.2, 14.5, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }

  drawHair(ctx, look.hair, hair, outfit, dir);

  // face
  if (dir !== 'up') {
    const eyes = side ? [[16 + 4.5 * flip, 14]] : [[12.2, 14.2], [19.8, 14.2]];
    for (const [ex, ey] of eyes) {
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(ex, ey, 1.9, 2.3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1a1210';
      ctx.beginPath();
      ctx.arc(ex + (side ? flip * 0.5 : 0), ey + 0.4, 1.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.fillRect(ex + 0.1, ey - 0.6, 0.6, 0.6);
    }
    ctx.strokeStyle = shade(skin, -0.35);
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    if (side) ctx.arc(16 + 5 * flip, 18, 1.6, flip > 0 ? 0.1 : Math.PI - 1.5, flip > 0 ? 1.5 : Math.PI - 0.1);
    else ctx.arc(16, 17.2, 2.4, 0.2, Math.PI - 0.2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(232,110,110,0.28)';
    if (!side) {
      ctx.beginPath();
      ctx.arc(10.5, 17, 1.4, 0, Math.PI * 2);
      ctx.arc(21.5, 17, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // outline around head for the cartoon look
  ctx.strokeStyle = ink;
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.arc(16, 13.5, 9.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawHair(ctx, style, color, outfit, dir) {
  ctx.fillStyle = color;
  const back = dir === 'up';
  switch (style) {
    case 'afro':
      ctx.beginPath();
      ctx.arc(16, 9.5, 11, Math.PI * 0.95, Math.PI * 2.05);
      ctx.fill();
      for (const [x, y] of [[6, 11], [26, 11], [9, 5], [23, 5], [16, 2.5]]) {
        ctx.beginPath();
        ctx.arc(x, y, 3.6, 0, Math.PI * 2);
        ctx.fill();
      }
      if (back) {
        ctx.beginPath();
        ctx.arc(16, 13, 10.4, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 'braids':
      ctx.beginPath();
      ctx.arc(16, 12, 10.2, Math.PI, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 6; i++) {
        const x = 7 + i * 3.6;
        if (!back && i > 0 && i < 5) continue;
        ctx.fillRect(x, 12, 2, back ? 14 : 16);
      }
      if (back) {
        ctx.beginPath();
        ctx.arc(16, 13, 9.8, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 'bun':
      ctx.beginPath();
      ctx.arc(16, 12, 10, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(16, 2.5, 4.5, 0, Math.PI * 2);
      ctx.fill();
      if (back) {
        ctx.beginPath();
        ctx.arc(16, 13, 9.6, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 'twists':
      ctx.beginPath();
      ctx.arc(16, 11.5, 10.3, Math.PI * 0.95, Math.PI * 2.05);
      ctx.fill();
      for (let i = 0; i < 7; i++) {
        ctx.beginPath();
        ctx.arc(7 + i * 3, 4.5 + (i % 2), 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      if (back) {
        ctx.beginPath();
        ctx.arc(16, 13, 9.8, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 'gele': {
      ctx.fillStyle = outfit.accent === '#ffffff' ? '#e85d3f' : outfit.accent;
      ctx.beginPath();
      ctx.ellipse(16, 6.5, 12.5, 6.5, 0, Math.PI, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(16, 8, 10.8, 4.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = shade(ctx.fillStyle, -0.15);
      ctx.beginPath();
      ctx.moveTo(6, 7);
      ctx.quadraticCurveTo(16, 1, 27, 6);
      ctx.lineTo(26, 8);
      ctx.quadraticCurveTo(16, 4, 6, 9);
      ctx.fill();
      break;
    }
    case 'lowcut':
    default:
      ctx.beginPath();
      ctx.arc(16, 12.5, 9.9, Math.PI * 1.02, Math.PI * 1.98);
      ctx.fill();
      if (back) {
        ctx.beginPath();
        ctx.arc(16, 13.5, 9.6, Math.PI * 0.9, Math.PI * 2.1);
        ctx.fill();
      }
  }
}

/** Render a full sprite sheet: rows = DIRS, cols = FRAMES_PER_DIR. Returns a canvas at scale s. */
export function renderSpriteSheet(look, s = 2) {
  const c = document.createElement('canvas');
  c.width = FRAME_W * FRAMES_PER_DIR * s;
  c.height = FRAME_H * DIRS.length * s;
  const ctx = c.getContext('2d');
  DIRS.forEach((dir, row) => {
    for (let f = 0; f < FRAMES_PER_DIR; f++) drawCharacter(ctx, look, dir, f, f * FRAME_W, row * FRAME_H, s);
  });
  return c;
}

export function lookKey(look) {
  return ['char', look.gender, look.skin, look.hair, look.hairColor, look.outfit].join('_');
}
