import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Backpack, Map as MapIcon, ScrollText, HandHeart, BookOpen, User, Pause, Briefcase, Users, AlertTriangle } from 'lucide-react';
import { getMap, NPC_BY_ID } from '@lfj/shared';
import { Api } from '../api/client.js';
import { audio } from '../audio/audio.js';
import { bridge } from '../game/bridge.js';
import { GameProvider, useGame } from '../state/GameContext.jsx';
import { useSettings, useAuth } from '../state/AppContext.jsx';
import { Button, Spinner } from '../components/ui.jsx';
import { Hud } from '../overlays/Hud.jsx';
import { TouchControls } from '../overlays/TouchControls.jsx';
import { OverlayRouter } from '../overlays/OverlayRouter.jsx';
import { EndingSequence } from '../overlays/Ending.jsx';

function World({ initial }) {
  const ref = useRef(null);
  const gameRef = useRef(null);
  const { settings } = useSettings();
  useEffect(() => {
    let destroyed = false;
    let game;
    import('../game/createGame.js').then(({ createGame }) => {
      if (destroyed || !ref.current) return;
      const s = initial.state;
      game = createGame(ref.current, { mapId: s.location.mapId, x: s.location.x, y: s.location.y, facing: s.location.facing, look: s.profile, minutes: s.time.minutes, reducedMotion: settings.reducedMotion });
      gameRef.current = game;
    });
    return () => {
      destroyed = true;
      game?.destroy(true);
      gameRef.current = null;
      bridge.pos = null;
    };
    // Create the Phaser instance once per play session — never on ordinary React updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    gameRef.current?.registry.set('reducedMotion', settings.reducedMotion);
  }, [settings.reducedMotion]);
  return <div ref={ref} className="absolute inset-0 touch-none select-none" data-testid="world" aria-label="Game world" />;
}

const SHORTCUTS = { i: 'inventory', m: 'map', j: 'missions', p: 'prayer', b: 'bible', c: 'profile', r: 'relationships', k: 'careers' };

function Playfield() {
  const g = useGame();
  const { state, panel, setPanel, act, ending } = g;
  const [prompt, setPrompt] = useState(null);
  const inDialogue = !!state.dialogue;

  // Block world input whenever anything modal is open.
  useEffect(() => {
    bridge.emit('set-blocked', !!panel || inDialogue || ending);
    audio.setDuck(inDialogue || panel?.id === 'prayer' || panel?.id === 'decision');
  }, [panel, inDialogue, ending]);

  useEffect(() => bridge.on('prompt', setPrompt), []);

  // Music for prayer.
  useEffect(() => {
    if (panel?.id === 'prayer') audio.play('prayer', getMap(state.location.mapId)?.ambience);
    else if (!ending) {
      const m = getMap(state.location.mapId);
      audio.play(panel?.id === 'decision' ? 'tension' : m.music, m.ambience);
    }
  }, [panel?.id, state.location.mapId, ending]);

  const onInteract = useCallback(
    async (hit) => {
      if (hit.kind === 'npc') {
        try {
          await act('talk_start', { npcId: hit.npcId }, { quiet: true });
        } catch {
          /* toast shown */
        }
        return;
      }
      const it = hit.object.interact;
      switch (it.kind) {
        case 'info':
          return setPanel({ id: 'info', title: it.label, text: it.text });
        case 'shop':
          return setPanel({ id: 'market', shopId: it.shopId });
        case 'bed':
          return setPanel({ id: 'rest' });
        case 'kitchen':
          return setPanel({ id: 'inventory', filter: 'food' });
        case 'wardrobe':
          return setPanel({ id: 'profile', wardrobe: true });
        case 'bible':
          return setPanel({ id: 'bible' });
        case 'prayer':
          return setPanel({ id: 'prayer', place: it.place });
        case 'work':
          return setPanel({ id: 'careers', tab: 'work', mapId: hit.mapId });
        case 'job_board':
          return setPanel({ id: 'careers', tab: 'jobs' });
        case 'enroll':
        case 'study':
          return setPanel({ id: 'careers', tab: 'education' });
        case 'business':
          return setPanel({ id: 'careers', tab: 'business' });
        case 'bank':
          return setPanel({ id: 'bank' });
        case 'property':
          return setPanel({ id: 'property' });
        case 'travel':
          return setPanel({ id: 'map' });
        case 'mission_board':
          return setPanel({ id: 'missions', tab: 'board' });
        case 'service':
          return setPanel({ id: 'service', service: it.service });
        case 'bible_study':
          return setPanel({ id: 'bibleStudy' });
        case 'clinic':
          return setPanel({ id: 'clinic' });
        case 'borehole':
          return setPanel({ id: 'borehole' });
        case 'scripture_spot':
          return setPanel({ id: 'scriptureSpot', ref: it.ref, title: it.label });
        case 'history_exit':
          return setPanel({ id: 'historyExit' });
        default:
          return setPanel({ id: 'info', title: it.label, text: '' });
      }
    },
    [act, setPanel],
  );

  useEffect(() => bridge.on('interact', onInteract), [onInteract]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (ending) return;
      const k = e.key.toLowerCase();
      if (k === 'escape') {
        if (panel) setPanel(null);
        else if (!inDialogue) setPanel({ id: 'pause' });
        return;
      }
      if (inDialogue || e.ctrlKey || e.metaKey || e.altKey) return;
      const id = SHORTCUTS[k];
      if (id) {
        audio.sfxPlay('open');
        setPanel((p) => (p?.id === id ? null : { id }));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [panel, setPanel, inDialogue, ending]);

  const dock = [
    ['inventory', Backpack, 'Inventory (I)'],
    ['missions', ScrollText, 'Missions (J)'],
    ['map', MapIcon, 'Map & travel (M)'],
    ['prayer', HandHeart, 'Pray (P)'],
    ['bible', BookOpen, 'Bible (B)'],
    ['careers', Briefcase, 'Work & study (K)'],
    ['relationships', Users, 'People (R)'],
    ['profile', User, 'Profile (C)'],
  ];

  return (
    <>
      {!ending && <Hud />}
      {!ending && (
        <nav aria-label="Game menu" className="absolute right-2 top-16 sm:top-3 z-20 flex flex-col gap-1.5">
          {dock.map(([id, Icon, label]) => (
            <button key={id} type="button" aria-label={label} title={label} onClick={() => { audio.unlock(); audio.sfxPlay('open'); setPanel({ id }); }} className="sticker-sm bg-paper rounded-xl p-1.5 sm:p-2 hover:bg-gold">
              <Icon className="w-5 h-5" />
            </button>
          ))}
          <button type="button" aria-label="Pause (Esc)" title="Pause (Esc)" onClick={() => setPanel({ id: 'pause' })} className="sticker-sm bg-indigo text-paper rounded-xl p-1.5 sm:p-2">
            <Pause className="w-5 h-5" />
          </button>
        </nav>
      )}
      {prompt && !panel && !inDialogue && !ending && (
        <div className="absolute left-1/2 -translate-x-1/2 bottom-28 sm:bottom-6 z-20 sticker-sm bg-paper rounded-full px-4 py-1.5 font-bold pointer-events-none" aria-live="polite">
          <kbd className="bg-gold rounded px-1.5 mr-2 border-2 border-ink text-sm">E</kbd>
          {prompt.label}
        </div>
      )}
      {state.scenarios.pending.length > 0 && !panel && !inDialogue && !ending && (
        <button type="button" onClick={() => setPanel({ id: 'decision', scenarioId: state.scenarios.pending[0] })} className="absolute left-1/2 -translate-x-1/2 top-20 z-20 sticker btn-red rounded-full px-4 py-1.5 font-display font-bold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" /> A decision awaits
        </button>
      )}
      {!ending && <TouchControls />}
      <OverlayRouter />
    </>
  );
}

function Toasts() {
  const { toasts } = useGame();
  const color = { error: 'bg-laterite text-white', warn: 'bg-sand', reward: 'bg-gold', achievement: 'bg-gold', mission: 'bg-leaf text-white', story: 'bg-indigo text-paper', decision: 'bg-laterite text-white', calm: 'bg-mist' };
  return (
    <div className="absolute left-2 right-16 sm:left-auto sm:right-16 top-16 z-50 flex flex-col items-stretch sm:items-end gap-2 pointer-events-none" aria-live="polite" role="status">
      {toasts.map((t) => (
        <div key={t.id} className={`toast-in sticker-sm rounded-2xl px-3 py-2 max-w-md text-sm font-bold ${color[t.kind] || 'bg-paper'}`}>
          {t.text}
        </div>
      ))}
    </div>
  );
}

export default function GameScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [initial, setInitial] = useState(null);
  const [error, setError] = useState(null);
  const [endedFlag, setEndedFlag] = useState(false);

  const load = useCallback(() => {
    setError(null);
    Api.character(id)
      .then(({ character }) => {
        if (character.status === 'ended') navigate(`/report/${id}`, { replace: true });
        else setInitial(character);
      })
      .catch(setError);
  }, [id, navigate]);

  useEffect(() => {
    load();
    return () => {
      bridge.clear();
    };
  }, [load]);

  if (error)
    return (
      <div className="adire-bg h-full flex items-center justify-center p-6">
        <div className="sticker bg-paper rounded-3xl p-6 max-w-md">
          <h1 className="font-display text-3xl font-extrabold mb-2">{error.status === 404 ? 'Character not found' : 'Could not load your game'}</h1>
          <p className="mb-4">{error.message}</p>
          <div className="flex gap-2">
            {error.status !== 404 && <Button onClick={load}>Try again</Button>}
            <Button variant="paper" onClick={() => navigate('/')}>Main menu</Button>
          </div>
        </div>
      </div>
    );
  if (!initial || !user)
    return (
      <div className="adire-bg h-full flex items-center justify-center">
        <Spinner label="Loading your life…" />
      </div>
    );

  return (
    <GameProvider characterId={id} initial={initial} onEnded={() => setEndedFlag(true)}>
      <main className="relative h-full w-full overflow-hidden bg-indigo-night" onPointerDown={() => audio.unlock()}>
        <World initial={initial} />
        <Playfield />
        <Toasts />
        {endedFlag && <EndingSequence />}
      </main>
    </GameProvider>
  );
}

export { NPC_BY_ID };
