// Original procedural environment art: ground, buildings, furniture and props.
import { TILE, OBJECT_TYPES, objectSize } from '@lfj/shared';
import { shade } from './character.js';

const INK = '#1e2140';

function rand(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function rr(ctx, x, y, w, h, r, fill, stroke) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

const GROUND = {
  grass: '#7cc46b',
  dry: '#cdb06a',
  pavement: '#cfc8bb',
  road: '#4b4d5c',
  path: '#d9b47c',
  plaza: '#e9c48f',
  pitch: '#5daf57',
  dirt: '#c49260',
  plaza_red: '#c76b45',
  field: '#8a5a32',
  stone: '#cdbfa4',
  sand: '#e8d29a',
  water: '#3a8fd1',
};

function paintArea(ctx, a, r) {
  const x = a.x * TILE;
  const y = a.y * TILE;
  const w = a.w * TILE;
  const h = a.h * TILE;
  const base = GROUND[a.type] || '#888';
  ctx.fillStyle = base;
  ctx.fillRect(x, y, w, h);
  switch (a.type) {
    case 'pavement':
      ctx.strokeStyle = shade(base, -0.08);
      ctx.lineWidth = 1;
      for (let i = x; i <= x + w; i += 16) {
        ctx.beginPath();
        ctx.moveTo(i, y);
        ctx.lineTo(i, y + h);
        ctx.stroke();
      }
      for (let j = y; j <= y + h; j += 16) {
        ctx.beginPath();
        ctx.moveTo(x, j);
        ctx.lineTo(x + w, j);
        ctx.stroke();
      }
      break;
    case 'road': {
      ctx.fillStyle = shade(base, 0.04);
      for (let i = 0; i < (w * h) / 600; i++) ctx.fillRect(x + r() * w, y + r() * h, 2, 2);
      ctx.fillStyle = '#f2d24b';
      if (a.lanes === 'h') for (let i = x + 8; i < x + w; i += 48) ctx.fillRect(i, y + h / 2 - 2, 24, 4);
      else for (let j = y + 8; j < y + h; j += 48) ctx.fillRect(x + w / 2 - 2, j, 4, 24);
      ctx.fillStyle = '#e9e4da';
      if (a.lanes === 'h') {
        ctx.fillRect(x, y, w, 3);
        ctx.fillRect(x, y + h - 3, w, 3);
      } else {
        ctx.fillRect(x, y, 3, h);
        ctx.fillRect(x + w - 3, y, 3, h);
      }
      break;
    }
    case 'plaza':
    case 'plaza_red':
      ctx.strokeStyle = shade(base, -0.07);
      ctx.lineWidth = 1;
      for (let j = y; j < y + h; j += 16) for (let i = x + ((j / 16) % 2) * 8; i < x + w; i += 16) ctx.strokeRect(i + 0.5, j + 0.5, 16, 16);
      break;
    case 'pitch':
      for (let i = 0; i < a.w; i += 2) {
        ctx.fillStyle = shade(base, 0.05);
        ctx.fillRect(x + i * TILE, y, TILE, h);
      }
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 3;
      ctx.strokeRect(x + 10, y + 10, w - 20, h - 20);
      ctx.beginPath();
      ctx.moveTo(x + w / 2, y + 10);
      ctx.lineTo(x + w / 2, y + h - 10);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h / 2, 40, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case 'field':
      ctx.strokeStyle = shade(base, -0.12);
      ctx.lineWidth = 4;
      for (let j = y + 8; j < y + h; j += 14) {
        ctx.beginPath();
        ctx.moveTo(x + 4, j);
        ctx.lineTo(x + w - 4, j);
        ctx.stroke();
      }
      ctx.fillStyle = '#4ea24a';
      for (let j = y + 6; j < y + h; j += 14) for (let i = x + 10; i < x + w; i += 22) {
        ctx.beginPath();
        ctx.arc(i + r() * 4, j, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 'stone':
      for (let j = y; j < y + h; j += 12) for (let i = x + ((j / 12) % 2) * 9; i < x + w; i += 18) {
        ctx.fillStyle = shade(base, (r() - 0.5) * 0.1);
        rr(ctx, i + 1, j + 1, 16, 10, 3);
        ctx.fill();
      }
      break;
    case 'water':
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.lineWidth = 2;
      for (let i = 0; i < (w * h) / 900; i++) {
        const px = x + r() * w;
        const py = y + r() * h;
        ctx.beginPath();
        ctx.arc(px, py, 6, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
      }
      break;
    default:
      for (let i = 0; i < (w * h) / 300; i++) {
        ctx.fillStyle = shade(base, (r() - 0.5) * 0.12);
        ctx.fillRect(x + r() * w, y + r() * h, 3, 3);
      }
  }
}

const STYLES = {
  house_blue: { wall: '#9cc7f0', roof: '#c2452d', trim: '#ffffff' },
  house_peach: { wall: '#f6c49b', roof: '#5a6a8f', trim: '#fff7ea' },
  church: { wall: '#fbf3e3', roof: '#2c3787', trim: '#f2b632', steeple: true },
  church_small: { wall: '#f7ead0', roof: '#8a4b2a', trim: '#ffffff', steeple: true },
  university: { wall: '#e8dcc6', roof: '#23875a', trim: '#ffffff', columns: true },
  clinic: { wall: '#ffffff', roof: '#3fa7a0', trim: '#c2452d', cross: true },
  shop: { wall: '#ffd97a', roof: '#c2452d', trim: '#ffffff', awning: true },
  bank: { wall: '#d7e0ef', roof: '#1d2462', trim: '#f2b632' },
  office: { wall: '#c7d5e6', roof: '#334155', trim: '#ffffff', glass: true },
  community: { wall: '#f5b38a', roof: '#7b4bc4', trim: '#fff' },
  kiosk: { wall: '#9a8c7a', roof: '#4b5563', trim: '#fff' },
  hut: { wall: '#c98f5a', roof: '#b9954a', trim: '#7a4b2a', thatch: true },
  ancient: { wall: '#e6d3b0', roof: '#b75b3a', trim: '#fff7e0' },
  temple: { wall: '#efe6d2', roof: '#c9b48a', trim: '#fff', columns: true },
};

function drawBuilding(ctx, b) {
  const st = STYLES[b.style] || STYLES.house_blue;
  const x = b.x * TILE;
  const y = b.y * TILE;
  const w = b.w * TILE;
  const h = b.h * TILE;
  const roofH = Math.round(h * 0.42);
  // shadow
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(x + 6, y + 8, w, h);
  if (st.thatch) {
    rr(ctx, x + 4, y + roofH - 6, w - 8, h - roofH + 6, 10, st.wall, INK);
    ctx.fillStyle = st.roof;
    ctx.beginPath();
    ctx.moveTo(x - 4, y + roofH + 4);
    ctx.lineTo(x + w / 2, y - 8);
    ctx.lineTo(x + w + 4, y + roofH + 4);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = shade(st.roof, -0.25);
    ctx.lineWidth = 2;
    for (let i = 1; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(x + w / 2, y - 8);
      ctx.lineTo(x - 4 + (i * (w + 8)) / 8, y + roofH + 4);
      ctx.stroke();
    }
    return finishDoorAndSign(ctx, b, st, x, y, w, h);
  }
  // walls
  rr(ctx, x, y + roofH - 4, w, h - roofH + 4, 4, st.wall, INK);
  // roof
  ctx.fillStyle = st.roof;
  ctx.beginPath();
  ctx.moveTo(x - 6, y + roofH);
  ctx.lineTo(x + 10, y);
  ctx.lineTo(x + w - 10, y);
  ctx.lineTo(x + w + 6, y + roofH);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = shade(st.roof, -0.18);
  ctx.lineWidth = 2;
  for (let j = y + 10; j < y + roofH - 2; j += 9) {
    ctx.beginPath();
    ctx.moveTo(x + 2, j);
    ctx.lineTo(x + w - 2, j);
    ctx.stroke();
  }
  if (st.steeple) {
    const sx = x + w / 2;
    rr(ctx, sx - 14, y - 34, 28, 40, 3, st.wall, INK);
    ctx.fillStyle = st.roof;
    ctx.beginPath();
    ctx.moveTo(sx - 18, y - 30);
    ctx.lineTo(sx, y - 58);
    ctx.lineTo(sx + 18, y - 30);
    ctx.fill();
    ctx.fillStyle = st.trim;
    ctx.fillRect(sx - 2, y - 76, 4, 20);
    ctx.fillRect(sx - 8, y - 70, 16, 4);
  }
  if (st.cross) {
    ctx.fillStyle = st.trim;
    ctx.fillRect(x + w - 26, y + 8, 6, 18);
    ctx.fillRect(x + w - 32, y + 14, 18, 6);
  }
  // windows
  const wallTop = y + roofH + 8;
  const winY = wallTop + 4;
  const nWin = Math.max(1, Math.floor(b.w / 2));
  for (let i = 0; i < nWin; i++) {
    const wx = x + 12 + i * ((w - 24) / nWin) + ((w - 24) / nWin - 22) / 2;
    if (b.door && Math.abs(wx + 11 - (b.door.x * TILE + 16)) < 26) continue;
    rr(ctx, wx, winY, 22, 18, 3, st.glass ? '#9fd0f2' : '#bfe1f7', INK);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillRect(wx + 3, winY + 3, 6, 4);
    if (!st.glass) {
      ctx.fillStyle = st.trim;
      ctx.fillRect(wx + 10, winY, 2, 18);
    }
  }
  if (st.columns) {
    ctx.fillStyle = '#ffffff';
    for (let i = x + 10; i < x + w - 10; i += 28) ctx.fillRect(i, wallTop - 6, 7, h - roofH - 4);
  }
  if (st.awning) {
    for (let i = 0; i < b.w * 2; i++) {
      ctx.fillStyle = i % 2 ? '#ffffff' : '#c2452d';
      ctx.fillRect(x + i * 16, y + roofH - 2, 16, 12);
    }
  }
  return finishDoorAndSign(ctx, b, st, x, y, w, h);
}

function finishDoorAndSign(ctx, b, st, x, y, w, h) {
  if (b.door) {
    const dx = b.door.x * TILE;
    const dy = b.door.y * TILE;
    rr(ctx, dx + 4, dy - 10, 24, 42, 4, b.private ? '#6b4f3a' : '#8b5a2b', INK);
    ctx.fillStyle = '#f2d24b';
    ctx.beginPath();
    ctx.arc(dx + 23, dy + 12, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(253,246,227,0.9)';
    ctx.fillRect(dx + 2, dy + 30, 28, 3); // threshold
  } else {
    // private / non-enterable: closed shutters
    const dx = x + w / 2 - 12;
    rr(ctx, dx, y + h - 34, 24, 34, 3, '#7a6a5a', INK);
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    for (let j = y + h - 30; j < y + h; j += 5) {
      ctx.beginPath();
      ctx.moveTo(dx + 2, j);
      ctx.lineTo(dx + 22, j);
      ctx.stroke();
    }
  }
  // sign board
  if (b.name) {
    ctx.font = '700 11px "Baloo 2", Nunito, sans-serif';
    const label = b.name.length > 30 ? b.name.slice(0, 29) + '…' : b.name;
    const tw = Math.min(w - 8, ctx.measureText(label).width + 14);
    const sx = x + w / 2 - tw / 2;
    const sy = y + Math.round(h * 0.42) - 10;
    rr(ctx, sx, sy, tw, 16, 5, '#fdf6e3', INK);
    ctx.fillStyle = INK;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x + w / 2, sy + 8.5, tw - 8);
  }
}

function drawInteriorShell(ctx, map) {
  const W = map.width * TILE;
  const H = map.height * TILE;
  const floor = { wood: '#c58b56', tile: '#e7e2d6', carpet: '#5a6aa8', church: '#d9cbb0' }[map.floor] || '#d0c4ad';
  ctx.fillStyle = floor;
  ctx.fillRect(0, 0, W, H);
  if (map.floor === 'wood') {
    ctx.strokeStyle = shade(floor, -0.12);
    for (let j = 0; j < H; j += 12) {
      ctx.beginPath();
      ctx.moveTo(0, j);
      ctx.lineTo(W, j);
      ctx.stroke();
    }
  } else if (map.floor === 'tile') {
    for (let j = 0; j < H; j += 32) for (let i = 0; i < W; i += 32) if (((i + j) / 32) % 2) {
      ctx.fillStyle = shade(floor, -0.06);
      ctx.fillRect(i, j, 32, 32);
    }
  } else if (map.floor === 'church') {
    ctx.fillStyle = '#9b2c2c';
    ctx.fillRect(W / 2 - 24, 64, 48, H - 64);
  } else if (map.floor === 'carpet') {
    ctx.fillStyle = shade(floor, 0.05);
    for (let j = 0; j < H; j += 8) ctx.fillRect(0, j, W, 3);
  }
  // walls
  ctx.fillStyle = map.wall;
  ctx.fillRect(0, 0, W, TILE);
  ctx.fillStyle = shade(map.wall, -0.15);
  ctx.fillRect(0, TILE - 6, W, 6);
  ctx.fillStyle = shade(map.wall, -0.3);
  ctx.fillRect(0, 0, TILE * 0.6, H);
  ctx.fillRect(W - TILE * 0.6, 0, TILE * 0.6, H);
  ctx.fillRect(0, H - TILE * 0.5, W, TILE * 0.5);
  // exit doormat
  ctx.fillStyle = '#f2b632';
  ctx.fillRect(map.exit.x * TILE + 2, H - TILE * 0.5, TILE - 4, TILE * 0.5);
  ctx.fillStyle = INK;
  ctx.font = '700 10px Nunito, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', map.exit.x * TILE + TILE / 2, H - 4);
  // windows on the back wall
  if (map.id !== 'church') for (let i = 2; i < map.width - 2; i += 4) rr(ctx, i * TILE, 4, 28, 18, 3, '#bfe1f7', INK);
  else for (let i = 2; i < map.width - 2; i += 3) {
    ctx.fillStyle = ['#e85d3f', '#f2b632', '#3b4aa8', '#23875a'][i % 4];
    rr(ctx, i * TILE + 6, 2, 18, 26, 9, ctx.fillStyle, INK);
  }
}

/** Paint the static layer (ground + buildings) for a map into one canvas. */
export function renderMapBase(map) {
  const c = document.createElement('canvas');
  c.width = map.width * TILE;
  c.height = map.height * TILE;
  const ctx = c.getContext('2d');
  const r = rand(map.width * 131 + map.height);
  if (map.kind === 'interior') {
    drawInteriorShell(ctx, map);
  } else {
    ctx.fillStyle = GROUND[map.ground] || GROUND.grass;
    ctx.fillRect(0, 0, c.width, c.height);
    for (let i = 0; i < (c.width * c.height) / 260; i++) {
      ctx.fillStyle = shade(GROUND[map.ground] || GROUND.grass, (r() - 0.5) * 0.14);
      ctx.fillRect(r() * c.width, r() * c.height, 2, 4);
    }
    for (const a of map.areas || []) paintArea(ctx, a, r);
    for (const b of map.buildings || []) drawBuilding(ctx, b);
    for (const l of map.labels || []) {
      ctx.font = '800 15px "Baloo 2", Nunito, sans-serif';
      ctx.textAlign = 'center';
      ctx.lineWidth = 4;
      ctx.strokeStyle = 'rgba(20,26,74,0.75)';
      ctx.strokeText(l.text, l.x * TILE, l.y * TILE + 12);
      ctx.fillStyle = '#fdf6e3';
      ctx.fillText(l.text, l.x * TILE, l.y * TILE + 12);
    }
  }
  return c;
}

/** How far above its footprint each object type draws (pixels). */
/** Horizontal overhang on each side (pixels), for canopies wider than their trunk tile. */
export const OVERHANG_X = { palm: 18, tree: 10, cypress: 4 };

export const OVERHANG = { tree: 40, palm: 48, bigtree: 48, cypress: 44, lamp: 34, noticeboard: 18, booth: 22, bus: 16, stall: 22, goal: 10, atm: 14, sign: 14, column: 30, citywall: 16, milestone: 6, wardrobe: 14, shelf: 14, fridge: 10, pulpit: 12, blackboard: 8, portal: 26, cooler: 8, plant: 8, borehole: 20, bed: 0, keke: 10, car: 8 };

/** Render a prop or furniture piece to a canvas sized to its footprint plus overhang. */
export function renderObject(obj) {
  const { w, h } = objectSize(obj);
  const over = OVERHANG[obj.type] || 0;
  const ox = OVERHANG_X[obj.type] || 0;
  const c = document.createElement('canvas');
  c.width = w * TILE + ox * 2;
  c.height = h * TILE + over;
  const ctx = c.getContext('2d');
  ctx.translate(ox, over);
  const W = w * TILE;
  const H = h * TILE;
  const shadow = () => {
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(W / 2, H - 4, W / 2 - 3, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  };
  switch (obj.type) {
    case 'tree':
    case 'bigtree': {
      shadow();
      rr(ctx, W / 2 - 4, H - 22, 8, 20, 2, '#7a4b2a');
      const cr = obj.type === 'bigtree' ? 34 : 20;
      const cy = H - 22 - cr * 0.6;
      for (const [dx, dy, k] of [[-cr * 0.45, 4, 0.82], [cr * 0.45, 4, 0.82], [0, -cr * 0.25, 1]]) {
        ctx.fillStyle = '#2f8a46';
        ctx.beginPath();
        ctx.arc(W / 2 + dx, cy + dy, cr * k, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = '#4fb05a';
      ctx.beginPath();
      ctx.arc(W / 2 - cr * 0.25, cy - cr * 0.35, cr * 0.45, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'cypress':
      shadow();
      ctx.fillStyle = '#2f6b3a';
      ctx.beginPath();
      ctx.ellipse(W / 2, H - 28, 10, 34, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'palm': {
      shadow();
      ctx.strokeStyle = '#8b5e34';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(W / 2, H - 4);
      ctx.quadraticCurveTo(W / 2 + 8, H - 30, W / 2 + 2, H - 54);
      ctx.stroke();
      const cx = W / 2 + 2;
      const cy = H - 56;
      ctx.lineWidth = 5;
      for (const [ang, len] of [[-2.7, 22], [-2.0, 20], [-1.2, 18], [-0.45, 20], [0.25, 22], [-1.6, 14]]) {
        ctx.strokeStyle = '#2f9a4a';
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        const ex = cx + Math.cos(ang) * len;
        const ey = cy + Math.sin(ang) * len * 0.7;
        ctx.quadraticCurveTo(cx + Math.cos(ang) * len * 0.6, cy + Math.sin(ang) * len * 0.7 - 8, ex, ey + 8);
        ctx.stroke();
      }
      ctx.fillStyle = '#6b4a2b';
      ctx.beginPath();
      ctx.arc(cx - 2, cy + 2, 2.5, 0, Math.PI * 2);
      ctx.arc(cx + 3, cy + 3, 2.5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 'bush':
      shadow();
      ctx.fillStyle = '#3b9b4c';
      ctx.beginPath();
      ctx.arc(W / 2 - 6, H - 12, 10, 0, Math.PI * 2);
      ctx.arc(W / 2 + 6, H - 12, 10, 0, Math.PI * 2);
      ctx.arc(W / 2, H - 18, 10, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'flowers':
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = ['#e85d3f', '#f2b632', '#ffffff', '#c084fc', '#f472b6'][i];
        ctx.beginPath();
        ctx.arc(6 + i * 5, 14 + (i % 2) * 8, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 'lamp':
      shadow();
      ctx.fillStyle = '#3a3f5c';
      ctx.fillRect(W / 2 - 2, -30, 4, H + 26);
      rr(ctx, W / 2 - 8, -34, 16, 8, 3, '#fff3b0', INK);
      break;
    case 'bench':
      shadow();
      rr(ctx, 4, H - 22, W - 8, 8, 3, '#a8693a', INK);
      rr(ctx, 4, H - 30, W - 8, 6, 3, '#c07b45', INK);
      ctx.fillStyle = INK;
      ctx.fillRect(8, H - 14, 4, 10);
      ctx.fillRect(W - 12, H - 14, 4, 10);
      break;
    case 'booth':
      shadow();
      rr(ctx, 3, -18, W - 6, H + 14, 4, '#f2b632', INK);
      rr(ctx, 7, -10, W - 14, 12, 2, '#bfe1f7', INK);
      break;
    case 'noticeboard':
      ctx.fillStyle = '#7a4b2a';
      ctx.fillRect(6, 4, 4, H - 4);
      ctx.fillRect(W - 10, 4, 4, H - 4);
      rr(ctx, 1, -16, W - 2, 26, 3, '#c98f5a', INK);
      for (const [px, py, col] of [[5, -12, '#fff'], [16, -13, '#f2b632'], [8, -2, '#bfe1f7']]) {
        ctx.fillStyle = col;
        ctx.fillRect(px, py, 9, 9);
      }
      break;
    case 'stall': {
      const col = obj.color || '#e85d3f';
      shadow();
      rr(ctx, 4, H - 26, W - 8, 22, 3, '#a8693a', INK);
      for (let i = 0; i < 6; i++) {
        ctx.fillStyle = ['#f2b632', '#e85d3f', '#23875a', '#fdf6e3'][i % 4];
        ctx.beginPath();
        ctx.arc(12 + i * 8, H - 22, 4, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = INK;
      ctx.fillRect(6, -10, 3, H - 16);
      ctx.fillRect(W - 9, -10, 3, H - 16);
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = i % 2 ? '#fdf6e3' : col;
        ctx.fillRect(i * (W / 4), -22, W / 4, 18);
      }
      ctx.strokeStyle = INK;
      ctx.lineWidth = 2;
      ctx.strokeRect(1, -22, W - 2, 18);
      break;
    }
    case 'cart':
      shadow();
      rr(ctx, 3, 8, W - 6, 14, 3, '#b77a44', INK);
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(10, 25, 4, 0, Math.PI * 2);
      ctx.arc(W - 10, 25, 4, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'atm':
      shadow();
      rr(ctx, 4, -12, W - 8, H + 8, 4, '#1d2462', INK);
      rr(ctx, 8, -6, W - 16, 10, 2, '#9fd0f2');
      ctx.fillStyle = '#f2b632';
      ctx.fillRect(10, 10, W - 20, 3);
      break;
    case 'sign':
      ctx.fillStyle = '#5a4030';
      ctx.fillRect(W / 2 - 2, 6, 4, H - 6);
      rr(ctx, 2, -12, W - 4, 20, 3, '#fdf6e3', INK);
      ctx.fillStyle = INK;
      ctx.fillRect(8, -6, W - 16, 2);
      ctx.fillRect(8, -1, W - 20, 2);
      break;
    case 'goal':
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 4;
      ctx.strokeRect(6, -6, W - 12, H + 2);
      break;
    case 'bus':
      shadow();
      rr(ctx, 2, -12, W - 4, H + 4, 8, '#f2c21b', INK);
      ctx.fillStyle = INK;
      ctx.fillRect(4, 12, W - 8, 5);
      for (let i = 10; i < W - 14; i += 20) rr(ctx, i, -6, 16, 13, 2, '#9fd0f2', INK);
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(18, H - 6, 6, 0, Math.PI * 2);
      ctx.arc(W - 18, H - 6, 6, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'keke':
      shadow();
      rr(ctx, 4, -6, W - 8, H, 8, '#2fa35a', INK);
      rr(ctx, 6, -10, W - 12, 8, 4, '#1d2462', INK);
      rr(ctx, 10, 0, 16, 10, 2, '#9fd0f2');
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(12, H - 3, 4, 0, Math.PI * 2);
      ctx.arc(W - 12, H - 3, 4, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'car':
      shadow();
      rr(ctx, 2, -2, W - 4, H - 4, 8, '#c2452d', INK);
      rr(ctx, 12, -8, W - 24, 12, 5, '#9fd0f2', INK);
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(14, H - 4, 5, 0, Math.PI * 2);
      ctx.arc(W - 14, H - 4, 5, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'borehole':
      shadow();
      rr(ctx, 6, -10, W - 12, H + 4, 3, '#8aa3b8', INK);
      ctx.fillStyle = '#3a8fd1';
      ctx.fillRect(10, -18, 4, 12);
      rr(ctx, 4, -20, 16, 6, 2, '#5a6a8f', INK);
      break;
    case 'fence':
      ctx.fillStyle = '#8b5e34';
      for (let i = 2; i < W; i += 9) ctx.fillRect(i, 6, 5, H - 8);
      ctx.fillRect(0, 12, W, 4);
      ctx.fillRect(0, 22, W, 4);
      break;
    case 'citywall':
      ctx.fillStyle = '#cdb68a';
      ctx.fillRect(0, -16, W, H + 16);
      ctx.strokeStyle = shade('#cdb68a', -0.2);
      ctx.lineWidth = 1;
      for (let j = -16; j < H; j += 8) {
        ctx.beginPath();
        ctx.moveTo(0, j);
        ctx.lineTo(W, j);
        ctx.stroke();
      }
      ctx.fillStyle = shade('#cdb68a', -0.12);
      ctx.fillRect(0, -16, W, 4);
      break;
    case 'column':
      shadow();
      rr(ctx, 9, -30, 14, H + 26, 2, '#f4ecd8', INK);
      ctx.fillStyle = '#d9cbb0';
      ctx.fillRect(13, -26, 2, H + 20);
      ctx.fillRect(18, -26, 2, H + 20);
      rr(ctx, 5, -34, 22, 6, 2, '#f4ecd8', INK);
      break;
    case 'fountain':
      ctx.fillStyle = '#cdbfa4';
      ctx.beginPath();
      ctx.ellipse(W / 2, H / 2 + 6, W / 2 - 4, H / 2 - 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#5fb0e8';
      ctx.beginPath();
      ctx.ellipse(W / 2, H / 2 + 6, W / 2 - 10, H / 2 - 14, 0, 0, Math.PI * 2);
      ctx.fill();
      rr(ctx, W / 2 - 4, H / 2 - 18, 8, 22, 2, '#e6d3b0', INK);
      break;
    case 'milestone':
      shadow();
      rr(ctx, 8, -6, W - 16, H, 6, '#d6ccb5', INK);
      ctx.fillStyle = INK;
      ctx.font = '700 7px serif';
      ctx.textAlign = 'center';
      ctx.fillText('VIA', W / 2, 8);
      break;
    case 'rock':
      ctx.fillStyle = '#9a9286';
      ctx.beginPath();
      ctx.ellipse(W / 2, H / 2 + 4, W / 2 - 3, H / 2 - 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#b3ab9e';
      ctx.beginPath();
      ctx.ellipse(W / 2 - 3, H / 2, 8, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'portal': {
      const g = ctx.createRadialGradient(W / 2, H / 2 - 10, 2, W / 2, H / 2 - 10, 26);
      g.addColorStop(0, 'rgba(255,240,180,0.95)');
      g.addColorStop(1, 'rgba(242,182,50,0)');
      ctx.fillStyle = g;
      ctx.fillRect(-10, -26, W + 20, H + 26);
      rr(ctx, 6, -10, W - 12, H + 6, 6, '#e6d3b0', INK);
      break;
    }
    // ── furniture ──
    case 'bed':
      rr(ctx, 2, 2, W - 4, H - 4, 6, '#8b5a2b', INK);
      rr(ctx, 6, 6, W - 12, H - 12, 4, '#f6efe2');
      rr(ctx, 6, 20, W - 12, H - 26, 4, '#3b4aa8');
      rr(ctx, 10, 8, W - 20, 10, 4, '#ffffff', INK);
      break;
    case 'wardrobe':
      rr(ctx, 2, -14, W - 4, H + 12, 3, '#9b6a3e', INK);
      ctx.fillStyle = INK;
      ctx.fillRect(W / 2 - 1, -10, 2, H + 4);
      break;
    case 'shelf':
      rr(ctx, 2, -14, W - 4, H + 12, 3, '#9b6a3e', INK);
      for (let j = -10; j < H; j += 12) for (let i = 6; i < W - 6; i += 5) {
        ctx.fillStyle = ['#c2452d', '#3b4aa8', '#23875a', '#f2b632'][(i + j) % 4 === 0 ? 0 : (i / 5) % 4 | 0];
        ctx.fillRect(i, j, 4, 9);
      }
      break;
    case 'stove':
      rr(ctx, 2, 2, W - 4, H - 4, 3, '#d9d9d9', INK);
      ctx.fillStyle = INK;
      ctx.beginPath();
      ctx.arc(10, 12, 4, 0, Math.PI * 2);
      ctx.arc(22, 12, 4, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'fridge':
      rr(ctx, 3, -10, W - 6, H + 8, 4, '#f1f5f9', INK);
      ctx.fillStyle = INK;
      ctx.fillRect(W - 9, -2, 2, 10);
      break;
    case 'table':
    case 'desk':
      rr(ctx, 2, 4, W - 4, H - 10, 4, obj.type === 'desk' ? '#b98a5c' : '#a8693a', INK);
      if (obj.type === 'desk') rr(ctx, W / 2 - 9, 0, 18, 12, 2, '#334155', INK);
      ctx.fillStyle = INK;
      ctx.fillRect(6, H - 8, 3, 6);
      ctx.fillRect(W - 9, H - 8, 3, 6);
      break;
    case 'chair':
      rr(ctx, 7, 8, W - 14, H - 12, 4, '#c07b45', INK);
      break;
    case 'mat':
      rr(ctx, 2, 6, W - 4, H - 12, 4, '#c2452d');
      ctx.strokeStyle = '#f2b632';
      ctx.lineWidth = 2;
      ctx.strokeRect(7, 10, W - 14, H - 20);
      break;
    case 'plant':
      rr(ctx, 9, H - 14, 14, 12, 3, '#c2452d', INK);
      ctx.fillStyle = '#2f8a46';
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.ellipse(16 + (i - 2) * 4, H - 20 - (i % 2) * 6, 4, 9, (i - 2) * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 'counter':
      rr(ctx, 1, 2, W - 2, H - 4, 4, '#c98f5a', INK);
      ctx.fillStyle = '#fdf6e3';
      ctx.fillRect(4, 4, W - 8, 6);
      break;
    case 'crates':
      for (let j = 0; j < H; j += 16) rr(ctx, 3, j + 1, W - 6, 15, 2, '#c49a6c', INK);
      break;
    case 'scale':
      rr(ctx, 6, 10, W - 12, 18, 3, '#94a3b8', INK);
      rr(ctx, 4, 4, W - 8, 6, 2, '#cbd5e1', INK);
      break;
    case 'sacks':
      for (let i = 0; i < 2; i++) rr(ctx, 4 + i * 30, 6, 24, H - 8, 9, '#e8d6b0', INK);
      break;
    case 'cooler':
      rr(ctx, 7, -6, W - 14, H + 4, 3, '#e2e8f0', INK);
      rr(ctx, 9, -14, W - 18, 10, 4, '#7dd3fc', INK);
      break;
    case 'altar':
      rr(ctx, 2, 2, W - 4, H - 6, 3, '#fdf6e3', INK);
      ctx.fillStyle = '#9b2c2c';
      ctx.fillRect(W / 2 - 20, 2, 40, H - 6);
      ctx.fillStyle = '#f2b632';
      ctx.fillRect(W / 2 - 2, -14, 4, 18);
      ctx.fillRect(W / 2 - 7, -9, 14, 4);
      break;
    case 'pulpit':
      rr(ctx, 4, -8, W - 8, H + 4, 3, '#8b5a2b', INK);
      break;
    case 'pew':
      rr(ctx, 2, 4, W - 4, 10, 3, '#9b6a3e', INK);
      rr(ctx, 2, 14, W - 4, 12, 3, '#b07a48', INK);
      break;
    case 'blackboard':
      rr(ctx, 2, -6, W - 4, H, 3, '#23453a', '#8b5a2b');
      ctx.strokeStyle = 'rgba(255,255,255,0.6)';
      ctx.beginPath();
      ctx.moveTo(14, 4);
      ctx.lineTo(70, 4);
      ctx.moveTo(14, 12);
      ctx.lineTo(50, 12);
      ctx.stroke();
      break;
    case 'schooldesk':
      rr(ctx, 4, 4, W - 8, 12, 3, '#d9a066', INK);
      rr(ctx, W / 2 - 8, 18, 16, 10, 3, '#3b4aa8', INK);
      break;
    case 'stage':
      rr(ctx, 2, 4, W - 4, H - 8, 6, '#7b4bc4', INK);
      ctx.fillStyle = '#f2b632';
      for (let i = 16; i < W; i += 40) {
        ctx.beginPath();
        ctx.arc(i, 14, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    default:
      rr(ctx, 4, 4, W - 8, H - 8, 4, '#999', INK);
  }
  return c;
}

export { OBJECT_TYPES };
