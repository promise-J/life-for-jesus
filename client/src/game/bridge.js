// The single communication channel between React (UI) and Phaser (world).
// React → Phaser: set-blocked, teleport, time, look, trumpet, touch-dir, touch-interact, reduced-motion
// Phaser → React: ready, location, prompt, interact, minutes, error
class Bridge {
  constructor() {
    this.handlers = new Map();
    this.pos = null; // latest player position { mapId, x, y, facing }
  }
  on(evt, fn) {
    if (!this.handlers.has(evt)) this.handlers.set(evt, new Set());
    this.handlers.get(evt).add(fn);
    return () => this.off(evt, fn);
  }
  off(evt, fn) {
    this.handlers.get(evt)?.delete(fn);
  }
  emit(evt, data) {
    for (const fn of [...(this.handlers.get(evt) || [])]) {
      try {
        fn(data);
      } catch (e) {
        console.error(`bridge handler for ${evt} failed`, e);
      }
    }
  }
  clear() {
    this.handlers.clear();
    this.pos = null;
  }
}

export const bridge = new Bridge();
