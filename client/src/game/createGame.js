import Phaser from 'phaser';
import { WorldScene } from './WorldScene.js';
import { bridge } from './bridge.js';

/** Create the single Phaser instance. React owns its lifetime (created once per play session). */
export function createGame(parent, { mapId, x, y, facing, look, minutes, reducedMotion }) {
  const game = new Phaser.Game({
    // ?renderer=canvas forces the Canvas renderer (useful on devices with weak or blocklisted GPUs).
    type: new URLSearchParams(window.location.search).get('renderer') === 'canvas' ? Phaser.CANVAS : Phaser.AUTO,
    parent,
    backgroundColor: '#141a4a',
    pixelArt: false,
    antialias: true,
    roundPixels: true,
    scale: { mode: Phaser.Scale.RESIZE, width: parent.clientWidth || 800, height: parent.clientHeight || 600 },
    input: { activePointers: 3 },
    audio: { noAudio: true }, // audio is handled by our own WebAudio engine
    banner: false,
    scene: [],
  });
  game.registry.set('look', look);
  game.registry.set('minutes', minutes);
  game.registry.set('reducedMotion', !!reducedMotion);
  game.scene.add('world', WorldScene, true, { mapId, x, y, facing });
  // Read-only hook for automated browser tests and debugging. The client is never authoritative.
  window.__lfj = { game, bridge };
  return game;
}
