import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Api, newKey } from '../api/client.js';
import { audio } from '../audio/audio.js';
import { bridge } from '../game/bridge.js';

const GameCtx = createContext(null);

const SYNC_EVERY_MS = 20_000;

/**
 * Holds the authoritative character (as last returned by the server), the local clock delta,
 * UI panels and toasts. Every change to persistent data goes through `act`, which serialises
 * requests, flushes pending movement/time first, and attaches an idempotency key.
 */
export function GameProvider({ characterId, initial, children, onEnded }) {
  const [character, setCharacter] = useState(initial);
  const [panel, setPanel] = useState(null); // { id, ...props }
  const [toasts, setToasts] = useState([]);
  const [busy, setBusy] = useState(false);
  const [saveStatus, setSaveStatus] = useState('saved'); // saved | saving | error
  const [pendingMinutes, setPendingMinutes] = useState(0);
  const [ending, setEnding] = useState(false);
  const charRef = useRef(initial);
  const pendingRef = useRef(0);
  const dirtyRef = useRef(false);
  const queue = useRef(Promise.resolve());
  const lastSync = useRef(Date.now());

  const state = character.state;

  const toast = useCallback((text, kind = 'info') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t.slice(-4), { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), kind === 'story' || kind === 'decision' ? 9000 : 5000);
  }, []);

  const applyServer = useCallback((ch) => {
    const prevLoc = charRef.current.state.location;
    charRef.current = ch;
    setCharacter(ch);
    const loc = ch.state.location;
    // Travel / history / server corrections move the player in the world.
    if (loc.mapId !== prevLoc.mapId && (!bridge.pos || bridge.pos.mapId !== loc.mapId)) bridge.emit('teleport', loc);
  }, []);

  const doSync = useCallback(
    async ({ keepalive = false } = {}) => {
      const pos = bridge.pos;
      const minutes = pendingRef.current;
      if (!pos || (!dirtyRef.current && minutes === 0)) return;
      dirtyRef.current = false;
      pendingRef.current -= minutes;
      setPendingMinutes(pendingRef.current);
      setSaveStatus('saving');
      try {
        const r = await Api.action(characterId, 'sync', { mapId: pos.mapId, x: pos.x, y: pos.y, facing: pos.facing, elapsedMinutes: minutes }, newKey(), { keepalive });
        lastSync.current = Date.now();
        applyServer(r.character);
        setSaveStatus('saved');
        for (const m of r.messages) toast(m.text, m.kind);
        if (r.ended) setEnding(true);
        return r;
      } catch (e) {
        setSaveStatus('error');
        if (e.code === 'invalid_position' || e.code === 'wrong_region') bridge.emit('teleport', charRef.current.state.location);
        else {
          // keep the minutes so the next sync can deliver them
          pendingRef.current += minutes;
          dirtyRef.current = true;
        }
        if (e.code === 'ended') setEnding(true);
        return null;
      }
    },
    [characterId, applyServer, toast],
  );

  const enqueue = useCallback((fn) => {
    const p = queue.current.then(fn, fn);
    queue.current = p.catch(() => {});
    return p;
  }, []);

  const sync = useCallback((opts) => enqueue(() => doSync(opts)), [enqueue, doSync]);

  const act = useCallback(
    (type, payload = {}, { quiet = false } = {}) =>
      enqueue(async () => {
        if (charRef.current.status === 'ended') return null;
        await doSync();
        setBusy(true);
        setSaveStatus('saving');
        try {
          const r = await Api.action(characterId, type, payload);
          if (import.meta.env.DEV) console.debug('[lfj] action', type, payload, r.events);
          applyServer(r.character);
          setSaveStatus('saved');
          let coinGain = false;
          for (const ev of r.events) {
            if (ev.type === 'achievement') audio.sfxPlay('achievement');
            else if (ev.type === 'mission_completed') audio.sfxPlay('success');
            else if (ev.type === 'scenario_triggered') audio.sfxPlay('decision');
          }
          if (r.messages.some((m) => /Earned|Sold|wages|sales/i.test(m.text))) coinGain = true;
          if (coinGain) audio.sfxPlay('coin');
          if (!quiet) for (const m of r.messages) toast(m.text, m.kind);
          const triggered = r.events.find((e) => e.type === 'scenario_triggered');
          if (triggered && !r.ended) setPanel((p) => (p?.id === 'decision' ? p : { id: 'decision', scenarioId: triggered.id }));
          if (r.ended) setEnding(true);
          return r;
        } catch (e) {
          setSaveStatus(e.status === 0 ? 'error' : 'saved');
          audio.sfxPlay('error');
          toast(e.message, 'error');
          if (e.code === 'ended') setEnding(true);
          throw e;
        } finally {
          setBusy(false);
        }
      }),
    [characterId, enqueue, doSync, applyServer, toast],
  );

  // Phaser events: clock minutes, location changes.
  useEffect(() => {
    const offs = [
      bridge.on('minutes', (n) => {
        pendingRef.current += n;
        setPendingMinutes(pendingRef.current);
      }),
      bridge.on('location', (p) => {
        dirtyRef.current = true;
        if (p.arrived && p.mapId !== charRef.current.state.location.mapId) sync();
      }),
    ];
    const timer = setInterval(() => {
      if (pendingRef.current > 0 || dirtyRef.current) {
        if (Date.now() - lastSync.current > SYNC_EVERY_MS) sync();
      }
    }, 2000);
    const onHide = () => {
      if (document.visibilityState === 'hidden') doSync({ keepalive: true });
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', onHide);
    return () => {
      offs.forEach((o) => o());
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', onHide);
    };
  }, [sync, doSync]);

  // Keep Phaser's clock display in step with the authoritative time.
  const minutes = state.time.minutes + (state.history?.active ? 0 : pendingMinutes);
  const displayMinutes = state.history?.active ? state.time.minutes : minutes;
  useEffect(() => {
    bridge.emit('time', displayMinutes);
  }, [displayMinutes]);

  useEffect(() => {
    if (ending) onEnded?.();
  }, [ending, onEnded]);

  const value = useMemo(
    () => ({ characterId, character, state, act, sync, panel, setPanel, toasts, toast, busy, saveStatus, minutes: displayMinutes, ending, setEnding, setCharacter: applyServer }),
    [characterId, character, state, act, sync, panel, toasts, toast, busy, saveStatus, displayMinutes, ending, applyServer],
  );
  return <GameCtx.Provider value={value}>{children}</GameCtx.Provider>;
}

export const useGame = () => useContext(GameCtx);
