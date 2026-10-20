import Phaser from 'phaser';
import {
  getMap, TILE, objectSize, stepMovement, resolveDirection, findInteraction, transitionAt, spawnPoint, tileOf,
  npcsInMap, npcPresence, NPC_BY_ID, isBlocked, darkness,
} from '@lfj/shared';
import { renderMapBase, renderObject, OVERHANG, OVERHANG_X } from './art/world.js';
import { renderSpriteSheet, lookKey, FRAME_W, FRAME_H, FRAMES_PER_DIR, DIRS } from './art/character.js';
import { bridge } from './bridge.js';
import { audio } from '../audio/audio.js';

const SPEED = 118; // px per second
const NPC_SPEED = 42;

function ensureCharTexture(scene, look) {
  const key = lookKey(look);
  if (!scene.textures.exists(key)) {
    const sheet = renderSpriteSheet(look, 2);
    scene.textures.addSpriteSheet(key, sheet, { frameWidth: FRAME_W * 2, frameHeight: FRAME_H * 2 });
    DIRS.forEach((dir, row) => {
      const base = row * FRAMES_PER_DIR;
      scene.anims.create({ key: `${key}_walk_${dir}`, frames: [base + 1, base, base + 2, base].map((f) => ({ key, frame: f })), frameRate: 8, repeat: -1 });
      scene.anims.create({ key: `${key}_idle_${dir}`, frames: [{ key, frame: base }], frameRate: 1 });
    });
  }
  return key;
}

export class WorldScene extends Phaser.Scene {
  constructor() {
    super('world');
  }

  init(data) {
    this.mapId = data.mapId;
    this.map = getMap(data.mapId);
    this.startPos = { x: data.x, y: data.y, facing: data.facing || 'down' };
    this.look = this.registry.get('look');
    this.blocked = !!this.registry.get('blocked');
    this.minutes = this.registry.get('minutes') || 0;
    this.pressOrder = [];
    this.touchDir = null;
    this.promptKey = null;
    this.lastHour = -1;
    this.transitioning = false;
    this.ending = false;
    this.clockAcc = 0;
    this.stepAcc = 0;
    // The Scene object is reused on restart: drop references to the previous map's game objects.
    this.night = null;
    this.flash = null;
    this.glows = [];
    this.npcs = null;
    this.player = null;
    this.currentHit = null;
  }

  create() {
    const map = this.map;
    const W = map.width * TILE;
    const H = map.height * TILE;
    const baseKey = `map_${map.id}`;
    if (!this.textures.exists(baseKey)) this.textures.addCanvas(baseKey, renderMapBase(map));
    this.add.image(0, 0, baseKey).setOrigin(0, 0).setDepth(-10);
    if (map.kind === 'interior') this.cameras.main.setBackgroundColor('#141a4a');

    // Props & furniture, y-sorted with characters.
    this.lamps = [];
    for (const o of map.objects) {
      const { w, h } = objectSize(o);
      const key = `obj_${o.type}_${w}x${h}_${o.color || ''}`;
      if (!this.textures.exists(key)) this.textures.addCanvas(key, renderObject(o));
      const img = this.add.image(o.x * TILE - (OVERHANG_X[o.type] || 0), (o.y + h) * TILE, key).setOrigin(0, 1);
      img.setDepth((o.y + h) * TILE - (OVERHANG[o.type] === undefined ? 0 : 1));
      if (o.type === 'mat' || o.type === 'flowers') img.setDepth(-5);
      if (o.type === 'lamp') this.lamps.push({ x: o.x * TILE + 16, y: o.y * TILE - 26 });
    }

    // Player
    const charKey = ensureCharTexture(this, this.look);
    this.charKey = charKey;
    this.player = this.add.sprite(this.startPos.x, this.startPos.y, charKey, 0).setOrigin(0.5, 47 / 48).setScale(0.5);
    this.facing = this.startPos.facing;
    this.player.play(`${charKey}_idle_${this.facing}`);

    // Interaction highlight
    this.highlight = this.add.graphics().setDepth(99999);

    // Camera
    const cam = this.cameras.main;
    cam.setBounds(Math.min(0, (W - cam.width) / 2), Math.min(0, (H - cam.height) / 2), Math.max(W, cam.width), Math.max(H, cam.height));
    cam.startFollow(this.player, true, 0.15, 0.15);
    this.applyZoom();
    this.scale.on('resize', this.applyZoom, this);

    // Day / night overlay & lamp glow
    this.night = this.add.rectangle(0, 0, 10, 10, 0x0b1240, 0).setOrigin(0, 0).setScrollFactor(0).setDepth(100000);
    this.glows = this.lamps.map((l) => this.add.circle(l.x, l.y, 46, 0xffe28a, 0).setBlendMode(Phaser.BlendModes.ADD).setDepth(100001));
    this.flash = this.add.rectangle(0, 0, 10, 10, 0xfff3c4, 0).setOrigin(0, 0).setScrollFactor(0).setDepth(100010);

    // NPCs
    this.npcs = new Map();
    this.refreshNpcs(true);

    // Input
    const kb = this.input.keyboard;
    this.keys = kb.addKeys({ up: 'W', down: 'S', left: 'A', right: 'D', up2: 'UP', down2: 'DOWN', left2: 'LEFT', right2: 'RIGHT', e: 'E', space: 'SPACE' }, true, false);
    kb.removeCapture('SPACE'); // let focused buttons work with the space bar
    for (const [name, key] of Object.entries(this.keys)) {
      const dir = name.replace('2', '');
      if (['up', 'down', 'left', 'right'].includes(dir)) key.on('down', () => this.pressOrder.push(dir));
    }
    this.keys.e.on('down', () => this.tryInteract());
    this.keys.space.on('down', () => this.tryInteract());

    // Bridge subscriptions (cleaned up on shutdown so scene restarts never duplicate handlers)
    this.unsubs = [
      bridge.on('set-blocked', (b) => {
        this.blocked = b;
        this.registry.set('blocked', b);
      }),
      bridge.on('time', (m) => this.setMinutes(m)),
      bridge.on('touch-dir', (d) => {
        this.touchDir = d;
      }),
      bridge.on('touch-interact', () => this.tryInteract()),
      bridge.on('teleport', (p) => this.teleport(p)),
      bridge.on('look', (look) => this.changeLook(look)),
      bridge.on('trumpet', () => this.playTrumpet()),
    ];
    this.events.once('shutdown', () => {
      this.unsubs.forEach((u) => u());
      this.scale.off('resize', this.applyZoom, this);
    });

    audio.play(map.music, map.ambience);
    this.cameras.main.fadeIn(250, 20, 26, 74);
    this.setMinutes(this.minutes);
    bridge.pos = { mapId: map.id, x: this.player.x, y: this.player.y, facing: this.facing };
    bridge.emit('location', { ...bridge.pos, arrived: true });
  }

  applyZoom() {
    const cam = this.cameras.main;
    const w = this.scale.width;
    const h = this.scale.height;
    const target = Math.max(1, Math.min(2, Math.min(w / (22 * TILE), h / (14 * TILE))));
    cam.setZoom(target);
    const W = this.map.width * TILE;
    const H = this.map.height * TILE;
    const vw = w / target;
    const vh = h / target;
    cam.setBounds(W < vw ? (W - vw) / 2 : 0, H < vh ? (H - vh) / 2 : 0, Math.max(W, vw), Math.max(H, vh));
    this.night?.setSize(w / target + 4, h / target + 4);
    this.flash?.setSize(w / target + 4, h / target + 4);
  }

  setMinutes(m) {
    this.minutes = m;
    const hour = Math.floor((m % 1440) / 60);
    if (hour !== this.lastHour) {
      this.lastHour = hour;
      this.refreshNpcs(false);
    }
    const d = darkness(m) * (this.map.kind === 'interior' ? 0.25 : this.map.historical ? 0.5 : 0.58);
    this.night?.setFillStyle(0x0b1240, d);
    for (const g of this.glows || []) g.setFillStyle(0xffe28a, darkness(m) * 0.35);
  }

  refreshNpcs(initial) {
    if (!this.npcs) return;
    const present = new Set(npcsInMap(this.mapId, this.minutes).map((n) => n.id));
    for (const [id, n] of this.npcs) {
      if (!present.has(id)) {
        n.sprite.destroy();
        n.label.destroy();
        this.npcs.delete(id);
      }
    }
    for (const id of present) {
      if (this.npcs.has(id)) continue;
      const def = NPC_BY_ID[id];
      const sch = npcPresence(def, this.minutes);
      const key = ensureCharTexture(this, def.look);
      let tx = sch.x;
      let ty = sch.y;
      if (!initial) {
        // arriving NPCs appear near their spot; avoid popping in on top of the player
        if (Math.hypot(tx * TILE - this.player.x, ty * TILE - this.player.y) < 40) tx = Math.max(1, tx - 1);
      }
      const x = tx * TILE + TILE / 2;
      const y = ty * TILE + TILE - 1;
      const sprite = this.add.sprite(x, y, key, 0).setOrigin(0.5, 47 / 48).setScale(0.5);
      const label = this.add.text(x, y - 52, def.name, { fontFamily: 'Nunito, sans-serif', fontSize: '11px', fontStyle: '800', color: '#fdf6e3', stroke: '#141a4a', strokeThickness: 3 }).setOrigin(0.5, 1).setDepth(99990).setAlpha(0);
      this.npcs.set(id, { id, def, sprite, label, key, home: { x, y }, radius: (sch.wander || 1) * TILE, dir: null, facing: 'down', timer: Math.random() * 2000 });
    }
  }

  npcList() {
    return [...this.npcs.values()].map((n) => ({ id: n.id, x: n.sprite.x, y: n.sprite.y }));
  }

  update(time, delta) {
    if (this.ending) return;
    const dt = Math.min(delta, 50) / 1000;
    const map = this.map;

    // Input → direction
    const k = this.keys;
    const pressed = {
      up: k.up.isDown || k.up2.isDown || this.touchDir === 'up',
      down: k.down.isDown || k.down2.isDown || this.touchDir === 'down',
      left: k.left.isDown || k.left2.isDown || this.touchDir === 'left',
      right: k.right.isDown || k.right2.isDown || this.touchDir === 'right',
    };
    this.pressOrder = this.pressOrder.filter((d) => pressed[d]).slice(-4);
    if (this.touchDir) this.pressOrder.push(this.touchDir);
    const dir = this.blocked || this.transitioning ? null : resolveDirection(pressed, this.pressOrder);

    if (dir) {
      this.facing = dir;
      const next = stepMovement({ x: this.player.x, y: this.player.y }, dir, SPEED, dt, map);
      this.player.setPosition(next.x, next.y);
      this.player.play(`${this.charKey}_walk_${dir}`, true);
      this.stepAcc += dt;
      if (this.stepAcc > 0.32) {
        this.stepAcc = 0;
        audio.sfxPlay('step');
      }
      const { tx, ty } = tileOf(next.x, next.y);
      const to = transitionAt(map, tx, ty);
      if (to) this.goThrough(to);
    } else {
      this.player.play(`${this.charKey}_idle_${this.facing}`, true);
    }
    this.player.setDepth(this.player.y);
    bridge.pos = { mapId: map.id, x: Math.round(this.player.x), y: Math.round(this.player.y), facing: this.facing };

    // Game clock: one game minute per real second while you are free to roam.
    if (!this.blocked && !this.transitioning) {
      this.clockAcc += dt;
      if (this.clockAcc >= 1) {
        const whole = Math.floor(this.clockAcc);
        this.clockAcc -= whole;
        bridge.emit('minutes', whole);
      }
    }

    this.updateNpcs(dt);
    this.updatePrompt();
  }

  updateNpcs(dt) {
    for (const n of this.npcs.values()) {
      const s = n.sprite;
      const near = Math.hypot(s.x - this.player.x, s.y - this.player.y) < 70;
      n.label.setPosition(s.x, s.y - 50).setAlpha(near ? 1 : 0);
      if (this.blocked && near) {
        // face the player during conversations
        const dx = this.player.x - s.x;
        const dy = this.player.y - s.y;
        n.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
        s.play(`${n.key}_idle_${n.facing}`, true);
        s.setDepth(s.y);
        continue;
      }
      n.timer -= dt * 1000;
      if (n.timer <= 0) {
        n.timer = 1200 + Math.random() * 2600;
        n.dir = Math.random() < 0.45 ? null : ['up', 'down', 'left', 'right'][Math.floor(Math.random() * 4)];
        // drift back home if wandered too far
        if (Math.hypot(s.x - n.home.x, s.y - n.home.y) > n.radius) {
          const dx = n.home.x - s.x;
          const dy = n.home.y - s.y;
          n.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
        }
      }
      if (n.dir && !near) {
        const next = stepMovement({ x: s.x, y: s.y }, n.dir, NPC_SPEED, dt, this.map);
        if (!next.moved) n.timer = 0;
        // don't walk into the player
        if (Math.hypot(next.x - this.player.x, next.y - this.player.y) > 22) s.setPosition(next.x, next.y);
        n.facing = n.dir;
        s.play(`${n.key}_walk_${n.dir}`, true);
      } else {
        s.play(`${n.key}_idle_${n.facing}`, true);
      }
      s.setDepth(s.y);
    }
  }

  updatePrompt() {
    const hit = this.blocked ? null : findInteraction(this.map, { x: this.player.x, y: this.player.y }, this.facing, this.npcList());
    const key = hit ? `${hit.kind}:${hit.target.id}` : null;
    this.highlight.clear();
    if (hit) {
      if (hit.kind === 'npc') {
        const n = this.npcs.get(hit.target.id);
        this.highlight.lineStyle(2, 0xf2b632, 1).strokeEllipse(n.sprite.x, n.sprite.y - 1, 26, 9);
      } else {
        const o = hit.target;
        const { w, h } = objectSize(o);
        this.highlight.lineStyle(2, 0xf2b632, 0.95).strokeRoundedRect(o.x * TILE - 2, o.y * TILE - 2, w * TILE + 4, h * TILE + 4, 6);
      }
    }
    if (key !== this.promptKey) {
      this.promptKey = key;
      this.currentHit = hit;
      bridge.emit('prompt', hit ? (hit.kind === 'npc' ? { label: `Talk to ${NPC_BY_ID[hit.target.id].name}` } : { label: hit.target.interact.label || 'Interact' }) : null);
    }
  }

  tryInteract() {
    if (this.blocked || this.transitioning || this.ending) return;
    const hit = findInteraction(this.map, { x: this.player.x, y: this.player.y }, this.facing, this.npcList());
    if (!hit) return;
    audio.sfxPlay('click');
    if (hit.kind === 'npc') bridge.emit('interact', { kind: 'npc', npcId: hit.target.id });
    else bridge.emit('interact', { kind: 'object', object: hit.target, mapId: this.mapId });
  }

  goThrough(to) {
    if (this.transitioning) return;
    this.transitioning = true;
    audio.sfxPlay('door');
    const target = getMap(to.mapId);
    const sp = spawnPoint(target, to.spawn);
    this.cameras.main.fadeOut(180, 20, 26, 74);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.restart({ mapId: target.id, x: sp.x * TILE + TILE / 2, y: sp.y * TILE + TILE - 1, facing: to.mapId === 'udoka' || target.kind === 'exterior' ? 'down' : 'up' });
    });
  }

  teleport(p) {
    if (p.mapId !== this.mapId) {
      this.transitioning = true;
      this.cameras.main.fadeOut(220, 20, 26, 74);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.restart({ mapId: p.mapId, x: p.x, y: p.y, facing: p.facing }));
    } else {
      const { tx, ty } = tileOf(p.x, p.y);
      if (!isBlocked(this.map, tx, ty)) this.player.setPosition(p.x, p.y);
    }
  }

  changeLook(look) {
    this.look = look;
    this.registry.set('look', look);
    this.charKey = ensureCharTexture(this, look);
    this.player.setTexture(this.charKey, 0);
  }

  playTrumpet() {
    this.ending = true;
    this.player.anims.stop();
    for (const n of this.npcs.values()) {
      n.sprite.anims.stop();
      this.tweens.add({ targets: n.sprite, y: n.sprite.y - 6, yoyo: true, duration: 600, repeat: 2 });
    }
    const reduced = this.registry.get('reducedMotion');
    if (!reduced) this.cameras.main.shake(1800, 0.004);
    this.tweens.add({ targets: this.flash, fillAlpha: 0.92, duration: reduced ? 400 : 3600, ease: 'Sine.easeIn' });
    this.tweens.add({ targets: this.night, fillAlpha: 0, duration: 1500 });
  }
}
