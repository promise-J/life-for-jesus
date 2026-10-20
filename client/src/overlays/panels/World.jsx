import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Map as MapIcon, ScrollText, Users, Pause, Hourglass, Bug, Lock } from 'lucide-react';
import { DESTINATIONS, ERAS, MISSIONS, MISSION_BY_ID, missionView, check, NPC_BY_ID, getMap, formatDate, ERA_BY_ID } from '@lfj/shared';
import { useGame } from '../../state/GameContext.jsx';
import { useAuth } from '../../state/AppContext.jsx';
import { Api } from '../../api/client.js';
import { Panel, Button, Tabs, Empty, Coins, Meter } from '../../components/ui.jsx';
import { ScriptureCard } from '../../components/ScriptureCard.jsx';
import { SettingsPanel } from '../SettingsPanel.jsx';
import { HowToPlay } from '../HowToPlay.jsx';

export function MapPanel({ onClose }) {
  const { state, act, busy } = useGame();
  const [tab, setTab] = useState(state.history.active ? 'eras' : 'places');
  const region = state.location.region;
  const atPark = state.location.mapId === 'udoka' || state.location.mapId === 'nkwo';
  const hasCar = state.inventory.some((s) => s.itemId === 'car');
  return (
    <Panel title="World map" icon={MapIcon} onClose={onClose} wide>
      <Tabs tabs={[{ id: 'places', label: 'Places' }, { id: 'eras', label: 'Eras (history)' }]} value={tab} onChange={setTab} />
      {tab === 'places' && (
        <>
          <p className="mb-3 text-sm">You are in <span className="font-bold">{getMap(state.location.mapId).name}</span>. Journeys leave from the motor park (Udoka) or the village bus (Nkwo).</p>
          <ul className="grid sm:grid-cols-2 gap-2">
            {DESTINATIONS.map((d) => {
              const here = d.available && d.mapId === region;
              const cost = hasCar ? Math.round((d.cost || 0) / 2) : d.cost;
              return (
                <li key={d.id} className={`rounded-2xl border-2 p-3 ${here ? 'border-ink bg-gold/25' : 'border-ink/20 bg-white'} ${!d.available ? 'opacity-70' : ''}`}>
                  <p className="font-display font-bold text-lg leading-tight flex items-center gap-2">{!d.available && <Lock className="w-4 h-4" />}{d.name}{here && ' — you are here'}</p>
                  <p className="text-xs font-bold text-ink/60">{d.country}</p>
                  <p className="text-sm my-1">{d.description}</p>
                  {d.available && !here && (
                    <>
                      <p className="text-sm">Fare <Coins value={cost} /> · about {d.hours} hours{hasCar ? ' (by car)' : ''}</p>
                      <Button className="mt-2 text-sm !py-1" disabled={busy || !atPark || !!state.history.active || state.coins < cost} onClick={() => act('travel', { to: d.id }).then(onClose).catch(() => {})}>
                        {!atPark ? 'Go to the motor park first' : state.coins < cost ? 'Not enough for the fare' : 'Travel'}
                      </Button>
                    </>
                  )}
                  {!d.available && <p className="text-sm font-bold">Planned — not yet built.</p>}
                </li>
              );
            })}
          </ul>
        </>
      )}
      {tab === 'eras' && (
        <>
          <p className="mb-3 text-sm">Step into a historical setting. Your own life is paused while you are there — no time passes and you do not age.</p>
          <ul className="grid gap-2">
            {ERAS.map((e) => {
              const ok = e.available && (!e.requires || check(e.requires, state));
              const active = state.history.active?.eraId === e.id;
              return (
                <li key={e.id} className={`rounded-2xl border-2 p-3 ${active ? 'border-ink bg-gold/25' : 'border-ink/20 bg-white'} ${!e.available ? 'opacity-70' : ''}`}>
                  <p className="font-display font-bold text-lg leading-tight flex items-center gap-2">{!e.available && <Lock className="w-4 h-4" />}{e.name}</p>
                  <p className="text-xs font-bold text-ink/60">{e.era}{state.history.completed.includes(e.id) ? ' · completed' : ''}</p>
                  <p className="text-sm my-1">{e.description}</p>
                  {e.historicalNotes && (
                    <details className="text-sm">
                      <summary className="font-bold cursor-pointer">Historical notes — what is documented and what is invented</summary>
                      <ul className="list-disc pl-5 mt-1">{e.historicalNotes.map((n) => <li key={n}>{n}</li>)}</ul>
                    </details>
                  )}
                  {e.available && !active && (
                    <Button className="mt-2 text-sm !py-1" disabled={busy || !ok || !!state.history.active} onClick={() => act('enter_history', { eraId: e.id }).then(onClose).catch(() => {})}>
                      {ok ? 'Enter this era' : `Locked: ${e.requirementText}`}
                    </Button>
                  )}
                  {active && <Button className="mt-2 text-sm !py-1" variant="indigo" disabled={busy} onClick={() => act('exit_history').then(onClose).catch(() => {})}>Return to your own time</Button>}
                  {!e.available && <p className="text-sm font-bold">Planned — not yet built.</p>}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Panel>
  );
}

function MissionCard({ m, state, onAccept, busy }) {
  const v = missionView(state, m.id);
  return (
    <li className="rounded-2xl border-2 border-ink/20 bg-white p-3">
      <div className="flex justify-between gap-2 flex-wrap">
        <p className="font-display font-bold text-lg leading-tight">{m.title}</p>
        <span className="text-xs font-bold bg-sand rounded-full px-2 py-0.5 self-start capitalize">{m.category.replace('_', ' ')}</span>
      </div>
      <p className="text-sm my-1">{m.summary}</p>
      {v.status !== 'available' && (
        <ul className="text-sm space-y-0.5 my-2">
          {v.objectives.map((o) => (
            <li key={o.id} className={o.done ? 'line-through text-ink/50' : ''}>
              {o.done ? '✓' : '○'} {o.text}{o.optional ? ' (optional)' : ''}{o.target > 1 && !o.done ? ` — ${Math.min(o.count, o.target)}/${o.target}` : ''}
            </li>
          ))}
        </ul>
      )}
      {v.outcome && <p className="text-sm italic my-1">{v.outcome}</p>}
      <details className="text-sm">
        <summary className="font-bold cursor-pointer">Scripture behind this mission</summary>
        {m.scripture.map((s) => <ScriptureCard key={s.ref} refText={s.ref} compact why={s.why} />)}
      </details>
      {onAccept && <Button className="mt-2 text-sm !py-1" disabled={busy} onClick={() => onAccept(m.id)}>Take on this mission</Button>}
    </li>
  );
}

export function MissionsPanel({ onClose, tab: initial = 'active' }) {
  const { state, act, busy } = useGame();
  const [tab, setTab] = useState(initial);
  const active = state.missions.active.map((id) => MISSION_BY_ID[id]);
  const done = state.missions.completed.map((id) => MISSION_BY_ID[id]);
  const board = MISSIONS.filter((m) => m.board && !state.missions.active.includes(m.id) && !state.missions.completed.includes(m.id));
  return (
    <Panel title="Missions" icon={ScrollText} onClose={onClose} wide>
      <Tabs tabs={[{ id: 'active', label: `Active (${active.length})` }, { id: 'board', label: 'Notice board' }, { id: 'done', label: `Completed (${done.length})` }]} value={tab} onChange={setTab} />
      {state.mode === 'mission' && tab === 'active' && <p className="text-sm mb-2">Mission Mode: new missions in the journey are added automatically as you finish them.</p>}
      {tab === 'active' && (active.length ? <ul className="space-y-2">{active.map((m) => <MissionCard key={m.id} m={m} state={state} />)}</ul> : <Empty>No active missions. Check a notice board, or talk to people around Udoka.</Empty>)}
      {tab === 'board' && (
        <>
          <p className="text-sm mb-2">Optional missions you can take on any time. Other missions come from people you meet.</p>
          {board.length ? (
            <ul className="space-y-2">
              {board.map((m) => {
                const locked = m.prerequisites && !check(m.prerequisites, state);
                return locked ? (
                  <li key={m.id} className="rounded-2xl border-2 border-ink/15 bg-white p-3 opacity-60"><p className="font-display font-bold">{m.title}</p><p className="text-sm">Not available yet (reach level 2).</p></li>
                ) : (
                  <MissionCard key={m.id} m={m} state={state} busy={busy} onAccept={(id) => act('accept_mission', { missionId: id }).catch(() => {})} />
                );
              })}
            </ul>
          ) : (
            <Empty>You’ve taken on everything on the board.</Empty>
          )}
        </>
      )}
      {tab === 'done' && (done.length ? <ul className="space-y-2">{done.map((m) => <MissionCard key={m.id} m={m} state={state} />)}</ul> : <Empty>Nothing completed yet.</Empty>)}
    </Panel>
  );
}

export function RelationshipsPanel({ onClose }) {
  const { state } = useGame();
  const people = Object.entries(state.relationships).filter(([id, r]) => r.met && NPC_BY_ID[id] && !NPC_BY_ID[id].ambient).sort((a, b) => b[1].trust - a[1].trust);
  return (
    <Panel title="People" icon={Users} onClose={onClose} wide>
      <p className="text-sm mb-3">Trust grows through listening, helping and respecting people’s choices. It doesn’t measure anyone’s worth.</p>
      {people.length === 0 && <Empty>You haven’t met anyone yet. Walk up to someone and press E to say hello.</Empty>}
      <ul className="grid sm:grid-cols-2 gap-2">
        {people.map(([id, r]) => {
          const n = NPC_BY_ID[id];
          const sl = state.storylines[id];
          return (
            <li key={id} className="rounded-2xl border-2 border-ink/20 bg-white p-3">
              <p className="font-display font-bold text-lg leading-tight">{n.name}</p>
              <p className="text-xs text-ink/60 mb-1">{n.occupation}</p>
              <Meter label="Trust" value={r.trust} color="bg-adire" />
              <p className="text-sm">{n.circumstances}</p>
              {sl && <p className="text-sm font-bold mt-1">{sl.outcome === 'conversion' ? 'Chose to follow Jesus (fictional storyline outcome)' : 'An honest friendship'}{sl.discipled ? ' · growing in fellowship' : ''}</p>}
              {r.notes.length > 0 && (
                <ul className="text-xs text-ink/70 mt-1">{r.notes.slice(-3).map((x, i) => <li key={i}>{formatDate(x.at)}: {x.text}</li>)}</ul>
              )}
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

export function HistoryExitPanel({ onClose }) {
  const { state, act, busy } = useGame();
  const era = state.history.active && ERA_BY_ID[state.history.active.eraId];
  return (
    <Panel title="Return to your own time" icon={Hourglass} onClose={onClose}>
      <p className="mb-3">Leave {era?.name || 'this era'} and go back to where you were. No time will have passed at home.</p>
      <Button disabled={busy || !era} onClick={() => act('exit_history').then(onClose).catch(() => {})}>Return now</Button>
    </Panel>
  );
}

function DevPanel() {
  const { characterId, setCharacter, setEnding, state } = useGame();
  const [info, setInfo] = useState(null);
  const [log, setLog] = useState('');
  const run = async (fn, label) => {
    try {
      const r = await fn();
      if (r?.character) setCharacter(r.character);
      setLog(`${label}: ok`);
      return r;
    } catch (e) {
      setLog(`${label}: ${e.message}`);
      return null;
    }
  };
  return (
    <div className="rounded-2xl border-2 border-dashed border-laterite p-3 mt-4 bg-laterite/5">
      <p className="font-bold flex items-center gap-2"><Bug className="w-4 h-4" /> Developer tools (disabled in production)</p>
      <p className="text-xs mb-2">Map {state.location.mapId} ({state.location.x}, {state.location.y}) · minute {state.time.minutes} · active missions: {state.missions.active.join(', ') || 'none'} · dialogue: {state.dialogue?.tree || 'none'}</p>
      <div className="flex gap-2 flex-wrap">
        <Button variant="paper" className="text-sm !py-1" onClick={() => run(() => Api.devAdvance(characterId, 6), 'advance 6h')}>Advance 6 hours</Button>
        <Button variant="paper" className="text-sm !py-1" onClick={async () => setInfo(await run(() => Api.devInspect(characterId), 'inspect'))}>Inspect save</Button>
        <Button variant="red" className="text-sm !py-1" onClick={async () => { const r = await run(() => Api.devEnding(characterId), 'trigger ending'); if (r?.ended) setEnding(true); }}>Trigger the trumpet</Button>
      </div>
      {log && <p className="text-xs mt-2 font-mono">{log}</p>}
      {info && <pre className="text-[10px] max-h-48 overflow-auto bg-white p-2 mt-2 rounded">{JSON.stringify({ endAtMinutes: info.endAtMinutes, rev: info.rev, minutes: info.minutes }, null, 1)}</pre>}
    </div>
  );
}

export function PausePanel({ onClose }) {
  const navigate = useNavigate();
  const { config } = useAuth();
  const { sync, characterId, saveStatus } = useGame();
  const [sub, setSub] = useState(null);
  if (sub === 'settings') return <SettingsPanel onClose={() => setSub(null)} />;
  if (sub === 'how') return <HowToPlay onClose={() => setSub(null)} />;
  return (
    <Panel title="Paused" icon={Pause} onClose={onClose}>
      <div className="grid gap-2">
        <Button onClick={onClose}>Resume</Button>
        <Button variant="paper" onClick={async () => { await sync(); }}>Save now {saveStatus === 'saved' ? '(all saved)' : ''}</Button>
        <Button variant="paper" onClick={() => setSub('settings')}>Audio & accessibility</Button>
        <Button variant="paper" onClick={() => setSub('how')}>How to play</Button>
        <Button variant="paper" onClick={() => navigate(`/report/${characterId}`)}>Life so far (report)</Button>
        <Button variant="indigo" onClick={async () => { await sync(); navigate('/'); }}>Save & return to main menu</Button>
      </div>
      <p className="text-xs text-ink/60 mt-3">Your progress is saved on the server after every action and every few seconds while you walk.</p>
      {config.devTools && <DevPanel />}
    </Panel>
  );
}

