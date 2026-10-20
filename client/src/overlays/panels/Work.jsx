import { useState } from 'react';
import { Briefcase, Store } from 'lucide-react';
import { JOBS, JOB_BY_ID, COURSES, COURSE_BY_ID, BUSINESSES, BUSINESS_BY_ID, meetsRequirements, SHOPS, ITEM_BY_ID, SELL_RATIO, getMap, qualificationName } from '@lfj/shared';
import { useGame } from '../../state/GameContext.jsx';
import { Panel, Button, Coins, Tabs, Empty, Meter } from '../../components/ui.jsx';

function WorkTab({ mapId }) {
  const { state, act, busy, minutes } = useGame();
  const job = JOB_BY_ID[state.career.jobId];
  const here = state.location.mapId;
  const hour = Math.floor((minutes % 1440) / 60);
  return (
    <div>
      {job ? (
        <div className="rounded-2xl border-2 border-ink/20 bg-white p-3 mb-3">
          <p className="font-display text-lg font-bold">{job.name}</p>
          <p className="text-sm">{job.employer} · {job.pay.toLocaleString()} LC a shift{job.variablePay ? ' (varies)' : ''} · {job.hours}h · shifts start {job.schedule[0]}:00–{job.schedule[1] - 1}:00</p>
          <Meter label="Performance" value={state.career.performance} color="bg-leaf" />
          <p className="text-sm mb-2">Shifts in this job: {state.career.shiftsInJob}{job.promotesTo ? ` · promotion to ${JOB_BY_ID[job.promotesTo].name} after 20 shifts with performance 60+` : ''}</p>
          {here === job.mapId ? (
            <Button disabled={busy || hour < job.schedule[0] || hour >= job.schedule[1] || state.stats.energy < job.energy} onClick={() => act('work_shift').catch(() => {})}>
              {hour < job.schedule[0] || hour >= job.schedule[1] ? `Closed now — come back at ${job.schedule[0]}:00` : state.stats.energy < job.energy ? 'Too tired — eat or rest first' : 'Work a shift'}
            </Button>
          ) : (
            <p className="text-sm font-bold">Go to {getMap(job.mapId).name} to work your shift.</p>
          )}
          <Button variant="paper" className="ml-2 text-sm !py-1" disabled={busy} onClick={() => act('quit_job')}>Quit job</Button>
        </div>
      ) : (
        <Empty>You don’t have a job yet. Check the vacancies on the “Find work” tab.</Empty>
      )}
      {here === 'shop' && state.career.jobId !== 'shop_assistant' && (mapId === 'shop' || !mapId) && (
        <div className="rounded-2xl border-2 border-ink/20 bg-white p-3">
          <p className="font-bold">Help out in Mama Ngozi’s store room</p>
          <p className="text-sm mb-2">Unpaid volunteering — about four hours.</p>
          <Button variant="leaf" disabled={busy || state.stats.energy < 15} onClick={() => act('volunteer', { mapId: 'shop' }).catch(() => {})}>Volunteer</Button>
        </div>
      )}
    </div>
  );
}

function JobsTab() {
  const { state, act, busy } = useGame();
  return (
    <ul className="space-y-2">
      {JOBS.filter((j) => !j.requires.promotionOnly).map((j) => {
        const missing = meetsRequirements(state, j.requires);
        const current = state.career.jobId === j.id;
        return (
          <li key={j.id} className="rounded-2xl border-2 border-ink/20 bg-white p-3">
            <div className="flex justify-between gap-2 flex-wrap">
              <p className="font-display font-bold text-lg leading-tight">{j.name}</p>
              <span className="text-sm font-bold"><Coins value={j.pay} /> / shift</span>
            </div>
            <p className="text-sm">{j.employer} · {getMap(j.mapId).name} · {j.blurb}</p>
            {missing.length > 0 && <p className="text-sm text-laterite font-bold mt-1">Needs: {missing.join(', ')}</p>}
            <Button className="mt-2 text-sm !py-1" disabled={busy || current || missing.length > 0} onClick={() => act('apply_job', { jobId: j.id }).catch(() => {})}>
              {current ? 'Your current job' : 'Apply'}
            </Button>
          </li>
        );
      })}
    </ul>
  );
}

function EducationTab() {
  const { state, act, busy } = useGame();
  const enrolled = state.education.enrolled;
  const course = enrolled && COURSE_BY_ID[enrolled.courseId];
  const atHall = state.location.mapId === 'university_hall';
  const canStudy = atHall || (state.location.mapId === 'home' && state.inventory.some((s) => s.itemId === 'laptop'));
  return (
    <div>
      <p className="text-sm mb-2"><span className="font-bold">Qualifications:</span> {state.education.completed.map(qualificationName).join(', ') || 'none yet'}</p>
      {course && (
        <div className="rounded-2xl border-2 border-ink bg-gold/20 p-3 mb-3">
          <p className="font-display font-bold text-lg">{course.name}</p>
          <Meter label="Progress (hours)" value={enrolled.progress} max={course.hours} color="bg-adire" />
          <p className="text-sm mb-2">{enrolled.progress} of {course.hours} hours</p>
          <Button disabled={busy || !canStudy || state.stats.energy < 12} onClick={() => act('study').catch(() => {})}>{canStudy ? (state.stats.energy < 12 ? 'Too tired to study' : 'Study for 3 hours') : 'Study at the Learning Centre'}</Button>
          <Button variant="paper" className="ml-2 text-sm !py-1" disabled={busy} onClick={() => act('drop_course')}>Drop course</Button>
        </div>
      )}
      {!atHall && !course && <p className="mb-2 text-sm font-bold">Enrol at the registrar in the Udoka University & Learning Centre (north-east of the city).</p>}
      <ul className="space-y-2">
        {COURSES.map((c) => {
          const done = state.education.completed.includes(c.id);
          const missing = (c.requires || []).filter((q) => !state.education.completed.includes(q));
          return (
            <li key={c.id} className="rounded-2xl border-2 border-ink/20 bg-white p-3">
              <div className="flex justify-between gap-2 flex-wrap">
                <p className="font-display font-bold leading-tight">{c.name}</p>
                <span className="text-sm"><Coins value={c.fee} /> · {c.hours}h</span>
              </div>
              <p className="text-sm">{c.blurb}</p>
              {missing.length > 0 && <p className="text-sm text-laterite font-bold">Needs: {missing.map(qualificationName).join(', ')}</p>}
              <Button className="mt-2 text-sm !py-1" disabled={busy || done || !!enrolled || !atHall || missing.length > 0 || state.coins < c.fee} onClick={() => act('enroll', { courseId: c.id }).catch(() => {})}>
                {done ? 'Completed' : enrolled ? 'Finish your current course first' : 'Enrol'}
              </Button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function BusinessTab() {
  const { state, act, busy } = useGame();
  const [qty, setQty] = useState(20);
  const b = state.business;
  const def = b && BUSINESS_BY_ID[b.type];
  if (b) {
    const atSite = state.location.mapId === def.mapId;
    return (
      <div className="rounded-2xl border-2 border-ink bg-white p-3">
        <p className="font-display font-bold text-lg">{def.name}</p>
        <p className="text-sm mb-2">{def.blurb}</p>
        <p className="text-sm">Days run: {b.daysRun} · total profit: <Coins value={b.totalProfit} /> · reputation {b.reputation}/100{def.usesStock ? ` · stock: ${b.stock} units` : ''}</p>
        {!atSite && <p className="font-bold text-sm mt-2">Go to {getMap(def.mapId).name} to run your business.</p>}
        {def.usesStock && (
          <div className="flex items-end gap-2 mt-3">
            <label className="block">
              <span className="text-sm font-bold">Units (400 LC each)</span>
              <input type="number" min="1" max="200" value={qty} onChange={(e) => setQty(e.target.value)} className="mt-1 w-28 rounded-xl border-2 border-ink px-2 py-1 bg-white block" />
            </label>
            <Button variant="paper" disabled={busy || !atSite} onClick={() => act('restock', { qty: Math.floor(Number(qty)) }).catch(() => {})}>Buy stock</Button>
          </div>
        )}
        <div className="flex gap-2 mt-3 flex-wrap">
          <Button disabled={busy || !atSite || state.stats.energy < def.energy || (def.usesStock && b.stock <= 0)} onClick={() => act('run_business').catch(() => {})}>Run a business day</Button>
          <Button variant="red" disabled={busy} onClick={() => act('close_business')}>Close business</Button>
        </div>
      </div>
    );
  }
  return (
    <ul className="space-y-2">
      {BUSINESSES.map((x) => {
        const missing = meetsRequirements(state, x.requires);
        const here = state.location.mapId === x.mapId;
        return (
          <li key={x.id} className="rounded-2xl border-2 border-ink/20 bg-white p-3">
            <div className="flex justify-between gap-2 flex-wrap">
              <p className="font-display font-bold leading-tight">{x.name}</p>
              <span className="text-sm">Start-up <Coins value={x.startup} /></span>
            </div>
            <p className="text-sm">{x.blurb}</p>
            {missing.length > 0 && <p className="text-sm text-laterite font-bold">Needs: {missing.join(', ')}</p>}
            <Button className="mt-2 text-sm !py-1" disabled={busy || missing.length > 0 || !here || state.coins < x.startup} onClick={() => act('start_business', { type: x.id }).catch(() => {})}>
              {here ? 'Start this business' : `Start it at ${getMap(x.mapId).name}`}
            </Button>
          </li>
        );
      })}
    </ul>
  );
}

export function CareersPanel({ onClose, tab: initialTab = 'work', mapId }) {
  const [tab, setTab] = useState(initialTab);
  return (
    <Panel title="Work & study" icon={Briefcase} onClose={onClose} wide>
      <Tabs tabs={[{ id: 'work', label: 'My work' }, { id: 'jobs', label: 'Find work' }, { id: 'education', label: 'Education' }, { id: 'business', label: 'Business' }]} value={tab} onChange={setTab} />
      {tab === 'work' && <WorkTab mapId={mapId} />}
      {tab === 'jobs' && <JobsTab />}
      {tab === 'education' && <EducationTab />}
      {tab === 'business' && <BusinessTab />}
    </Panel>
  );
}

export function MarketPanel({ onClose, shopId }) {
  const { state, act, busy } = useGame();
  const shop = SHOPS[shopId];
  const [tab, setTab] = useState('buy');
  const [qty, setQty] = useState({});
  const sellable = state.inventory.filter((s) => {
    const it = ITEM_BY_ID[s.itemId];
    return it.sellable !== false && shop.buysCategories.includes(it.category);
  });
  return (
    <Panel title={shop.name} icon={Store} onClose={onClose} wide>
      <p className="mb-3">You have <Coins value={state.coins} />. Inventory {state.inventory.length} slots used.</p>
      {shop.buysCategories.length > 0 && <Tabs tabs={[{ id: 'buy', label: 'Buy' }, { id: 'sell', label: 'Sell' }]} value={tab} onChange={setTab} />}
      {tab === 'buy' && (
        <ul className="grid sm:grid-cols-2 gap-2">
          {shop.items.map((id) => {
            const it = ITEM_BY_ID[id];
            const q = Math.max(1, Math.min(10, Number(qty[id]) || 1));
            const owned = !it.stackable && state.inventory.some((s) => s.itemId === id);
            return (
              <li key={id} className="rounded-2xl border-2 border-ink/20 bg-white p-3 flex flex-col">
                <p className="font-bold leading-tight">{it.name}</p>
                <p className="text-sm text-ink/70 flex-1">{it.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <Coins value={it.price * q} />
                  {it.stackable && (
                    <input aria-label={`Quantity of ${it.name}`} type="number" min="1" max="10" value={qty[id] ?? 1} onChange={(e) => setQty({ ...qty, [id]: e.target.value })} className="w-14 rounded-lg border-2 border-ink px-1 py-0.5 bg-white" />
                  )}
                  <Button className="ml-auto text-sm !py-1" disabled={busy || owned || state.coins < it.price * q} onClick={() => act('buy', { shopId, itemId: id, qty: q }).catch(() => {})}>
                    {owned ? 'Owned' : 'Buy'}
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {tab === 'sell' && (
        <>
          {sellable.length === 0 && <Empty>Nothing you own that this shop will buy.</Empty>}
          <ul className="grid sm:grid-cols-2 gap-2">
            {sellable.map((s) => {
              const it = ITEM_BY_ID[s.itemId];
              return (
                <li key={s.itemId} className="rounded-2xl border-2 border-ink/20 bg-white p-3">
                  <p className="font-bold">{it.name} ×{s.qty}</p>
                  <p className="text-sm">They’ll pay <Coins value={Math.floor(it.price * SELL_RATIO)} /> each.</p>
                  <Button className="mt-2 text-sm !py-1" disabled={busy} onClick={() => act('sell', { shopId, itemId: s.itemId, qty: 1 }).catch(() => {})}>Sell one</Button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </Panel>
  );
}
