import { useState } from 'react';
import { Backpack, User, BedDouble, Stethoscope, Landmark, Home, Info, Utensils } from 'lucide-react';
import {
  ITEM_BY_ID, LIMITS, qualificationName, JOB_BY_ID, levelOf, ageAt, lifeStageFor, SKILLS, PROPERTIES, HAIR_STYLES, HAIR_COLORS, OUTFITS,
  ACHIEVEMENTS, BACKGROUNDS, START_AGES,
} from '@lfj/shared';
import { useGame } from '../../state/GameContext.jsx';
import { Panel, Button, Coins, Meter, Empty, Tabs } from '../../components/ui.jsx';
import { CharacterPreview } from '../../components/CharacterPreview.jsx';
import { bridge } from '../../game/bridge.js';

export function InventoryPanel({ onClose, filter }) {
  const { state, act, busy } = useGame();
  const items = state.inventory.filter((s) => !filter || ['food', 'gift'].includes(ITEM_BY_ID[s.itemId]?.category));
  return (
    <Panel title={filter ? 'Kitchen' : 'Inventory'} icon={filter ? Utensils : Backpack} onClose={onClose} wide>
      <p className="mb-3 text-sm">
        {state.inventory.length} / {LIMITS.inventorySlots} slots · <Coins value={state.coins} /> in hand · savings <Coins value={state.savings} />
      </p>
      {items.length === 0 && <Empty>{filter ? 'Nothing to eat. Oja Market’s food stalls are south of the main road.' : 'Your bag is empty.'}</Empty>}
      <ul className="grid sm:grid-cols-2 gap-2">
        {items.map((s) => {
          const it = ITEM_BY_ID[s.itemId];
          const usable = it.use && ['food', 'gift'].includes(it.category);
          return (
            <li key={s.itemId} className="rounded-2xl border-2 border-ink/20 bg-white p-3 flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-sand border-2 border-ink flex items-center justify-center font-display font-bold text-lg" aria-hidden>
                {it.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold leading-tight">
                  {it.name} {s.qty > 1 && <span className="text-ink/60">×{s.qty}</span>}
                </p>
                <p className="text-sm text-ink/70">{it.description}</p>
                {usable && (
                  <Button className="mt-2 text-sm !py-1" disabled={busy} onClick={() => act('use_item', { itemId: it.id })}>
                    Eat / use
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {state.properties.length > 0 && (
        <>
          <h3 className="font-display text-xl font-bold mt-4 mb-1">Property</h3>
          <ul className="list-disc pl-5">{state.properties.map((p) => <li key={p}>{PROPERTIES.find((x) => x.id === p)?.name}</li>)}</ul>
        </>
      )}
    </Panel>
  );
}

export function ProfilePanel({ onClose, wardrobe }) {
  const { state, act, busy } = useGame();
  const [tab, setTab] = useState(wardrobe ? 'wardrobe' : 'me');
  const age = Math.floor(ageAt(state));
  const job = JOB_BY_ID[state.career.jobId];
  const [look, setLook] = useState({ hair: state.profile.hair, hairColor: state.profile.hairColor, outfit: state.profile.outfit });
  const preview = { ...state.profile, ...look };
  return (
    <Panel title={state.profile.name} icon={User} onClose={onClose} wide>
      <Tabs tabs={[{ id: 'me', label: 'Profile' }, { id: 'achievements', label: 'Crowns & badges' }, ...(state.location.mapId === 'home' ? [{ id: 'wardrobe', label: 'Wardrobe' }] : [])]} value={tab} onChange={setTab} />
      {tab === 'me' && (
        <div className="grid sm:grid-cols-[auto_1fr] gap-4">
          <div className="bg-sand rounded-2xl border-2 border-ink self-start">
            <CharacterPreview look={state.profile} size={4} />
          </div>
          <div>
            <p className="mb-2">
              {age} years old · {lifeStageFor(age).name} · Level {levelOf(state.stats.xp)} ({state.stats.xp} XP)
            </p>
            <p className="mb-2 text-sm">
              {START_AGES.find((s) => s.id === state.profile.startAge)?.name} · {BACKGROUNDS.find((b) => b.id === state.profile.background)?.name} · {state.mode === 'mission' ? 'Mission Mode' : 'Free Life'}
            </p>
            <Meter label="Energy" value={state.stats.energy} color="bg-gold" />
            <Meter label="Health" value={state.stats.health} />
            <Meter label="Wellbeing" value={state.stats.wellbeing} color="bg-adire" />
            <p className="mt-3"><span className="font-bold">Work:</span> {job ? `${job.name} at ${job.employer} (performance ${state.career.performance})` : 'Not employed'}</p>
            <p><span className="font-bold">Qualifications:</span> {state.education.completed.map(qualificationName).join(', ') || 'none yet'}</p>
            <p><span className="font-bold">Money:</span> <Coins value={state.coins} /> in hand, <Coins value={state.savings} /> saved{state.stats.arrears ? <>, <span className="text-laterite font-bold">{state.stats.arrears.toLocaleString()} LC in arrears</span></> : ''}</p>
            <h3 className="font-display text-lg font-bold mt-3 mb-1">Skills</h3>
            <div className="grid grid-cols-2 gap-x-4">
              {SKILLS.map((s) => <Meter key={s} label={s[0].toUpperCase() + s.slice(1)} value={state.skills[s] || 0} color="bg-leaf" />)}
            </div>
          </div>
        </div>
      )}
      {tab === 'achievements' && (
        <div>
          <p className="text-sm mb-3 bg-sand rounded-xl p-2 border-2 border-ink/15">Crowns and badges are fictional gameplay recognitions. They record what happened in this simulation — they don’t measure anyone’s real faith or standing before God.</p>
          <ul className="grid sm:grid-cols-2 gap-2">
            {ACHIEVEMENTS.map((a) => {
              const got = state.achievements.crowns.includes(a.id) || state.achievements.badges.includes(a.id);
              return (
                <li key={a.id} className={`rounded-2xl border-2 p-3 ${got ? 'border-ink bg-gold/30' : 'border-ink/15 bg-white opacity-70'}`}>
                  <p className="font-display font-bold">{a.kind === 'crown' ? '♛ ' : '◆ '}{a.name}{got ? '' : ' (not yet)'}</p>
                  <p className="text-sm">{a.description}</p>
                  {a.scripture && <p className="text-xs text-ink/60 mt-1">Theme: {a.scripture.join('; ')}</p>}
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {tab === 'wardrobe' && (
        <div className="grid sm:grid-cols-[auto_1fr] gap-4">
          <div className="bg-sand rounded-2xl border-2 border-ink self-start"><CharacterPreview look={preview} size={4} /></div>
          <div className="space-y-3">
            {[['hair', HAIR_STYLES, 'Hairstyle'], ['hairColor', HAIR_COLORS.map((h) => ({ ...h, name: h.id })), 'Hair colour'], ['outfit', OUTFITS, 'Outfit']].map(([key, opts, label]) => (
              <label key={key} className="block">
                <span className="font-bold">{label}</span>
                <select className="mt-1 w-full rounded-xl border-2 border-ink px-3 py-2 bg-white capitalize" value={look[key]} onChange={(e) => setLook({ ...look, [key]: e.target.value })}>
                  {opts.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </label>
            ))}
            <Button disabled={busy} onClick={async () => { const r = await act('update_appearance', look); bridge.emit('look', r.character.state.profile); onClose(); }}>Change clothes</Button>
          </div>
        </div>
      )}
    </Panel>
  );
}

export function RestPanel({ onClose }) {
  const { state, act, busy, setPanel } = useGame();
  const run = (type, payload) => act(type, payload).then(() => onClose()).catch(() => {});
  return (
    <Panel title="Rest" icon={BedDouble} onClose={onClose}>
      <div className="grid gap-2">
        <Button disabled={busy} onClick={() => run('sleep')}>Sleep until morning</Button>
        <Button variant="paper" disabled={busy} onClick={() => run('nap')}>Take a two-hour nap</Button>
        <Button variant="paper" disabled={busy} onClick={() => run('wait', { hours: 3 })}>Relax for three hours</Button>
        <Button variant="indigo" disabled={busy || state.scenarios.pending.length > 0} onClick={() => run('live_month')}>Live the next month</Button>
        <p className="text-sm text-ink/70">
          “Live the next month” fast-forwards your routine: shifts at your job, your business, bills and life’s small surprises happen automatically. It’s how the years go by.
          {state.scenarios.pending.length > 0 && ' (A decision is waiting first.)'}
        </p>
        <Button variant="paper" onClick={() => setPanel({ id: 'prayer', place: 'home' })}>Pray before resting</Button>
      </div>
    </Panel>
  );
}

export function ClinicPanel({ onClose }) {
  const { state, act, busy } = useGame();
  return (
    <Panel title="Udoka Clinic" icon={Stethoscope} onClose={onClose}>
      <p className="mb-2">Health: {state.stats.health}/100 · Energy: {state.stats.energy}/100</p>
      <p className="mb-3">A check-up and treatment costs 3,000 LC and restores your health.</p>
      <Button disabled={busy || state.coins < 3000} onClick={() => act('clinic').then(onClose).catch(() => {})}>Get a check-up (3,000 LC)</Button>
    </Panel>
  );
}

export function BankPanel({ onClose }) {
  const { state, act, busy } = useGame();
  const [amount, setAmount] = useState(1000);
  const n = Math.max(0, Math.floor(Number(amount) || 0));
  return (
    <Panel title="Udoka Cooperative Bank" icon={Landmark} onClose={onClose}>
      <p className="mb-1">In hand: <Coins value={state.coins} /></p>
      <p className="mb-1">Savings: <Coins value={state.savings} /> <span className="text-sm text-ink/70">(earns 1% a month — a simplified game rate)</span></p>
      {state.stats.arrears > 0 && <p className="mb-1 text-laterite font-bold">Arrears: {state.stats.arrears.toLocaleString()} LC</p>}
      <label className="block my-3">
        <span className="font-bold">Amount</span>
        <input type="number" min="1" step="100" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 w-full rounded-xl border-2 border-ink px-3 py-2 bg-white" />
      </label>
      <div className="flex gap-2 flex-wrap">
        <Button disabled={busy || n < 1 || n > state.coins} onClick={() => act('bank', { op: 'deposit', amount: n })}>Deposit</Button>
        <Button variant="paper" disabled={busy || n < 1 || n > state.savings} onClick={() => act('bank', { op: 'withdraw', amount: n })}>Withdraw</Button>
        {state.stats.arrears > 0 && <Button variant="red" disabled={busy || state.coins < 1} onClick={() => act('bank', { op: 'pay_arrears', amount: state.stats.arrears })}>Pay arrears</Button>}
      </div>
    </Panel>
  );
}

export function PropertyPanel({ onClose }) {
  const { state, act, busy } = useGame();
  return (
    <Panel title="Udoka Homes — estate agent" icon={Home} onClose={onClose}>
      <ul className="space-y-2">
        {PROPERTIES.map((p) => {
          const owned = state.properties.includes(p.id);
          return (
            <li key={p.id} className="rounded-2xl border-2 border-ink/20 bg-white p-3">
              <p className="font-display font-bold text-lg leading-tight">{p.name}</p>
              <p className="text-sm">{p.effect}</p>
              <p className="mt-1"><Coins value={p.price} /></p>
              <Button className="mt-2 text-sm !py-1" disabled={busy || owned || state.coins < p.price} onClick={() => act('buy_property', { propertyId: p.id })}>
                {owned ? 'Owned' : state.coins < p.price ? 'Not enough coins' : 'Buy'}
              </Button>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

export function InfoPanel({ onClose, title, text }) {
  return (
    <Panel title={title || 'Look'} icon={Info} onClose={onClose}>
      <p>{text || 'Nothing special here.'}</p>
    </Panel>
  );
}
