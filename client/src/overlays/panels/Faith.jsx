import { useEffect, useState } from 'react';
import { HandHeart, BookOpen, Search, Star, StarOff, ChevronLeft, ChevronRight, Users, Droplets, Scale, BookMarked } from 'lucide-react';
import {
  PRAYER_TYPES, PRAYER_PLACES, PRAYER_DISCLAIMER, NPC_BY_ID, check, SCENARIO_BY_ID, TOPICS, BOREHOLE_GOAL, DONATION_CAUSES, formatDate,
} from '@lfj/shared';
import { Api } from '../../api/client.js';
import { useGame } from '../../state/GameContext.jsx';
import { Panel, Button, Tabs, Empty, ErrorNote, Coins, Meter } from '../../components/ui.jsx';
import { ScriptureCard } from '../../components/ScriptureCard.jsx';

function placeFor(state, requested) {
  if (requested && PRAYER_PLACES[requested]?.mapId === state.location.mapId) return requested;
  return Object.entries(PRAYER_PLACES).find(([, p]) => p.mapId === state.location.mapId)?.[0] || null;
}

export function PrayerPanel({ onClose, place: requested, type: initialType }) {
  const { state, act, busy, characterId } = useGame();
  const place = placeFor(state, requested);
  const [tab, setTab] = useState('pray');
  const [type, setType] = useState(initialType || null);
  const [target, setTarget] = useState('');
  const [journal, setJournal] = useState('');
  const [done, setDone] = useState(false);
  const [entries, setEntries] = useState(null);
  const met = Object.entries(state.relationships).filter(([id, r]) => r.met && NPC_BY_ID[id] && !NPC_BY_ID[id].ambient);
  const def = PRAYER_TYPES.find((p) => p.id === type);
  useEffect(() => {
    if (tab === 'journal') Api.journal(characterId).then((r) => setEntries(r.items)).catch(() => setEntries([]));
  }, [tab, characterId]);

  const pray = async () => {
    try {
      await act('pray', { prayerType: type, place, target: def.needsTarget ? target : undefined, journal: journal.trim() || undefined });
      setDone(true);
    } catch {
      /* toast */
    }
  };

  return (
    <Panel title="Prayer" icon={HandHeart} onClose={onClose} wide>
      <Tabs tabs={[{ id: 'pray', label: 'Pray' }, { id: 'journal', label: 'Prayer journal' }]} value={tab} onChange={setTab} />
      {tab === 'pray' && !place && (
        <div>
          <p className="mb-2">Find a quiet place to pray:</p>
          <ul className="list-disc pl-5 mb-3">{Object.values(PRAYER_PLACES).map((p) => <li key={p.name}>{p.name}</li>)}</ul>
          <p className="text-sm text-ink/70">You can still read Scripture anywhere with the Bible Explorer (B).</p>
        </div>
      )}
      {tab === 'pray' && place && done && (
        <div className="text-center py-6">
          <p className="font-display text-2xl font-bold mb-2">Amen.</p>
          <p className="mb-4">You spent a quiet moment in prayer{def?.needsTarget && target ? ` for ${NPC_BY_ID[target].name}` : ''}.</p>
          <div className="flex gap-2 justify-center">
            <Button variant="paper" onClick={() => { setDone(false); setType(null); setJournal(''); }}>Pray again</Button>
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      )}
      {tab === 'pray' && place && !done && !def && (
        <div>
          <p className="mb-3 text-sm">{PRAYER_PLACES[place].name}. What would you like to bring to God?</p>
          <ul className="grid sm:grid-cols-2 gap-2">
            {PRAYER_TYPES.map((p) => {
              const ok = !p.requires || check(p.requires, state);
              return (
                <li key={p.id}>
                  <button type="button" disabled={!ok} onClick={() => setType(p.id)} className={`w-full text-left sticker-sm rounded-2xl p-3 ${ok ? 'bg-white hover:bg-gold' : 'bg-ink/5 opacity-50'}`}>
                    <span className="font-display font-bold block">{p.name}</span>
                    <span className="text-sm">{ok ? p.prompt : 'Not relevant right now.'}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="text-xs text-ink/60 mt-3">{PRAYER_DISCLAIMER}</p>
        </div>
      )}
      {tab === 'pray' && place && !done && def && (
        <div>
          <button type="button" className="text-sm font-bold underline mb-2" onClick={() => setType(null)}>← Choose a different prayer</button>
          <h3 className="font-display text-xl font-bold">{def.name}</h3>
          <p className="mb-2">{def.prompt}</p>
          {def.id === 'decision' && state.scenarios.pending[0] && <p className="text-sm bg-sand rounded-xl p-2 mb-2">On your mind: “{SCENARIO_BY_ID[state.scenarios.pending[0]].title}”. Prayer won’t choose for you — but it can help you think.</p>}
          {def.scripture.map((r) => <ScriptureCard key={r} refText={r} compact onRead={(ref) => act('read_scripture', { ref }, { quiet: true }).catch(() => {})} />)}
          {def.needsTarget && (
            <label className="block my-3">
              <span className="font-bold">Who are you praying for?</span>
              <select className="mt-1 w-full rounded-xl border-2 border-ink px-3 py-2 bg-white" value={target} onChange={(e) => setTarget(e.target.value)}>
                <option value="">Choose someone you’ve met…</option>
                {met.map(([id]) => <option key={id} value={id}>{NPC_BY_ID[id].name}</option>)}
              </select>
              {met.length === 0 && <span className="text-sm text-ink/70">You haven’t met anyone yet. Pray for your family instead, or go and say hello to your neighbours.</span>}
            </label>
          )}
          <label className="block my-3">
            <span className="font-bold">Journal (optional, private)</span>
            <textarea maxLength={1000} rows={3} value={journal} onChange={(e) => setJournal(e.target.value)} placeholder="Write your character’s prayer or reflection…" className="mt-1 w-full rounded-xl border-2 border-ink px-3 py-2 bg-white" />
          </label>
          <Button disabled={busy || (def.needsTarget && !target)} onClick={pray}>Pray (about 20 minutes)</Button>
        </div>
      )}
      {tab === 'journal' && (
        <div>
          {entries === null && <p>Loading…</p>}
          {entries?.length === 0 && <Empty>No journal entries yet. Write one the next time you pray.</Empty>}
          <ul className="space-y-2">
            {entries?.map((e) => (
              <li key={e._id} className="rounded-2xl border-2 border-ink/15 bg-white p-3">
                <p className="text-xs font-bold text-ink/60">{e.date} · {PRAYER_TYPES.find((p) => p.id === e.prayerType)?.name}{e.target ? ` · for ${NPC_BY_ID[e.target]?.name}` : ''}</p>
                <p className="whitespace-pre-wrap">{e.text}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}

function ChapterReader({ bookId, chapter, onNav, favorites, toggleFav, onRead }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    setData(null);
    setError(null);
    Api.chapter(bookId, chapter)
      .then((r) => {
        setData(r.chapter);
        onRead?.(`${r.chapter.book} ${chapter}`);
      })
      .catch(setError);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId, chapter]);
  if (error) return <ErrorNote error={error} />;
  if (!data) return <p>Loading…</p>;
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Button variant="paper" className="!px-2 !py-1" disabled={chapter <= 1} onClick={() => onNav(chapter - 1)} aria-label="Previous chapter"><ChevronLeft className="w-5 h-5" /></Button>
        <h3 className="font-display text-xl font-bold flex-1 text-center">{data.reference}</h3>
        <Button variant="paper" className="!px-2 !py-1" disabled={chapter >= data.chapters} onClick={() => onNav(chapter + 1)} aria-label="Next chapter"><ChevronRight className="w-5 h-5" /></Button>
      </div>
      <div className="scripture-card rounded-xl px-4 py-3">
        {data.verses.map((v) => {
          const ref = `${data.book} ${chapter}:${v.verse}`;
          const fav = favorites.includes(ref);
          return (
            <p key={v.verse} className="mb-1 group">
              <sup className="font-sans text-xs font-bold text-gold-deep mr-1">{v.verse}</sup>
              {v.text}
              <button type="button" onClick={() => toggleFav(ref)} aria-label={fav ? `Remove ${ref} from saved` : `Save ${ref}`} className={`ml-1 align-middle ${fav ? 'text-gold-deep' : 'text-ink/25 group-hover:text-ink/60'}`}>
                <Star className="w-4 h-4 inline" fill={fav ? 'currentColor' : 'none'} />
              </button>
            </p>
          );
        })}
      </div>
      <p className="text-xs text-ink/60 mt-2">{data.translation.name} — {data.translation.licence}.</p>
    </div>
  );
}

export function BiblePanel({ onClose, initialRefs }) {
  const { act } = useGame();
  const [tab, setTab] = useState(initialRefs ? 'refs' : 'read');
  const [books, setBooks] = useState([]);
  const [bookId, setBookId] = useState('jhn');
  const [chapter, setChapter] = useState(1);
  const [q, setQ] = useState('');
  const [results, setResults] = useState(null);
  const [page, setPage] = useState(1);
  const [topic, setTopic] = useState('prayer');
  const [entries, setEntries] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [error, setError] = useState(null);
  const record = (ref) => act('read_scripture', { ref }, { quiet: true }).catch(() => {});
  useEffect(() => {
    Api.books().then((r) => setBooks(r.books)).catch(setError);
    Api.favorites().then((r) => setFavorites(r.favorites.map((f) => f.ref))).catch(() => {});
  }, []);
  useEffect(() => {
    if (tab === 'topics') Api.entries(topic).then((r) => setEntries(r.entries)).catch(setError);
  }, [tab, topic]);
  const toggleFav = async (ref) => {
    try {
      if (favorites.includes(ref)) {
        await Api.removeFavorite(ref);
        setFavorites((f) => f.filter((x) => x !== ref));
      } else {
        const r = await Api.addFavorite(ref);
        setFavorites((f) => [r.ref, ...f]);
      }
    } catch (e) {
      setError(e);
    }
  };
  const runSearch = async (p = 1) => {
    if (q.trim().length < 2) return;
    try {
      setError(null);
      const r = await Api.search(q.trim(), p);
      setResults(r);
      setPage(p);
    } catch (e) {
      setError(e);
    }
  };
  const book = books.find((b) => b.id === bookId);
  return (
    <Panel title="Bible Explorer" icon={BookOpen} onClose={onClose} wide>
      <Tabs
        tabs={[...(initialRefs ? [{ id: 'refs', label: 'Passages' }] : []), { id: 'read', label: 'Read' }, { id: 'search', label: 'Search' }, { id: 'topics', label: 'Topics' }, { id: 'saved', label: `Saved (${favorites.length})` }]}
        value={tab}
        onChange={setTab}
      />
      <ErrorNote error={error} />
      {tab === 'refs' && initialRefs.map((r) => <ScriptureCard key={r.ref || r} refText={r.ref || r} why={r.why} onRead={record} />)}
      {tab === 'read' && (
        <div>
          <div className="flex gap-2 mb-3 flex-wrap">
            <label className="flex-1 min-w-40">
              <span className="sr-only">Book</span>
              <select className="w-full rounded-xl border-2 border-ink px-3 py-2 bg-white" value={bookId} onChange={(e) => { setBookId(e.target.value); setChapter(1); }}>
                <optgroup label="Old Testament">{books.filter((b) => b.testament === 'OT').map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</optgroup>
                <optgroup label="New Testament">{books.filter((b) => b.testament === 'NT').map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</optgroup>
              </select>
            </label>
            <label>
              <span className="sr-only">Chapter</span>
              <select className="rounded-xl border-2 border-ink px-3 py-2 bg-white" value={chapter} onChange={(e) => setChapter(Number(e.target.value))}>
                {Array.from({ length: book?.chapters || 1 }, (_, i) => <option key={i} value={i + 1}>Chapter {i + 1}</option>)}
              </select>
            </label>
          </div>
          {books.length > 0 && <ChapterReader bookId={bookId} chapter={chapter} onNav={setChapter} favorites={favorites} toggleFav={toggleFav} onRead={record} />}
        </div>
      )}
      {tab === 'search' && (
        <div>
          <form className="flex gap-2 mb-3" onSubmit={(e) => { e.preventDefault(); runSearch(1); }}>
            <label className="flex-1">
              <span className="sr-only">Search the Bible</span>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Words (e.g. “daily bread”) or a reference (e.g. John 3:16)" className="w-full rounded-xl border-2 border-ink px-3 py-2 bg-white" />
            </label>
            <button type="submit" className="btn btn-gold !px-3" aria-label="Search"><Search className="w-5 h-5" /></button>
          </form>
          {results?.reference && <ScriptureCard refText={results.reference.reference} onRead={record} />}
          {results && <p className="text-sm mb-2">{results.total.toLocaleString()} verses match “{q}” (full text of the World English Bible).</p>}
          <ul className="space-y-1.5">
            {results?.results.map((v) => (
              <li key={v.reference} className="rounded-xl bg-white border-2 border-ink/10 px-3 py-2">
                <button type="button" className="font-bold text-sm underline" onClick={() => { setBookId(v.bookId); setChapter(v.chapter); setTab('read'); }}>{v.reference}</button>
                <p className="font-serif">{v.text}</p>
              </li>
            ))}
          </ul>
          {results && results.total > results.pageSize && (
            <div className="flex gap-2 mt-3 items-center">
              <Button variant="paper" disabled={page <= 1} onClick={() => runSearch(page - 1)}>Previous</Button>
              <span className="text-sm">Page {page} of {Math.ceil(results.total / results.pageSize)}</span>
              <Button variant="paper" disabled={page * results.pageSize >= results.total} onClick={() => runSearch(page + 1)}>Next</Button>
            </div>
          )}
        </div>
      )}
      {tab === 'topics' && (
        <div>
          <div className="flex gap-1.5 flex-wrap mb-3">
            {TOPICS.map((t) => (
              <button key={t.id} type="button" onClick={() => setTopic(t.id)} className={`px-2.5 py-1 rounded-full text-sm font-bold border-2 border-ink ${topic === t.id ? 'bg-gold' : 'bg-white'}`}>{t.name}</button>
            ))}
          </div>
          <p className="text-xs text-ink/60 mb-2">A curated set of passages linked to the game. Context notes are the game’s commentary, not Scripture.</p>
          {entries.map((e) => (
            <div key={e.ref} className="mb-3">
              <ScriptureCard refText={e.ref} compact onRead={record} />
              <p className="text-sm"><span className="font-bold">Context (commentary):</span> {e.context}</p>
              <button type="button" className="text-sm font-bold underline" onClick={() => toggleFav(e.ref)}>{favorites.includes(e.ref) ? 'Remove from saved' : 'Save passage'}</button>
            </div>
          ))}
        </div>
      )}
      {tab === 'saved' && (
        <div>
          {favorites.length === 0 && <Empty>No saved passages yet. Tap the star next to any verse to save it.</Empty>}
          {favorites.map((r) => (
            <div key={r}>
              <ScriptureCard refText={r} compact />
              <button type="button" className="text-sm font-bold underline flex items-center gap-1" onClick={() => toggleFav(r)}><StarOff className="w-4 h-4" /> Remove</button>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

export function BibleStudyPanel({ onClose }) {
  const { act, busy, minutes } = useGame();
  const hour = Math.floor((minutes % 1440) / 60);
  const open = hour >= 16 && hour < 22;
  return (
    <Panel title="Bible study circle" icon={Users} onClose={onClose}>
      <p className="mb-2">Brother Sam’s circle reads a passage slowly, asks questions, and prays together. Evenings 16:00–22:00.</p>
      <ScriptureCard refText="Acts 2:42" compact />
      <Button disabled={busy || !open} onClick={() => act('bible_study').then(onClose).catch(() => {})}>{open ? 'Join tonight’s study (90 min)' : 'The circle meets from 16:00'}</Button>
    </Panel>
  );
}

export function ServicePanel({ onClose, service }) {
  const { state, act, busy } = useGame();
  const [amount, setAmount] = useState(1000);
  const isChurch = state.location.mapId === 'church';
  const causes = Object.entries(DONATION_CAUSES).filter(([, c]) => c.mapId === state.location.mapId);
  const n = Math.max(0, Math.floor(Number(amount) || 0));
  return (
    <Panel title={isChurch ? 'Serve & give at Grace Chapel' : 'Serve & give'} icon={HandHeart} onClose={onClose}>
      <h3 className="font-display text-lg font-bold">Volunteer</h3>
      <p className="mb-2 text-sm">{service === 'food_bank' ? 'Pack and hand out food parcels for three hours.' : 'Help children with homework for three hours.'}</p>
      <Button variant="leaf" disabled={busy || state.stats.energy < 20} onClick={() => act('service', { service }).catch(() => {})}>{state.stats.energy < 20 ? 'Too tired to volunteer' : 'Volunteer (3 hours)'}</Button>
      {causes.length > 0 && (
        <>
          <h3 className="font-display text-lg font-bold mt-4">Give</h3>
          <p className="text-sm mb-2">Giving is recorded in your life story. It doesn’t buy crowns or achievements.</p>
          <label className="block mb-2">
            <span className="font-bold text-sm">Amount (LC)</span>
            <input type="number" min="100" step="100" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 w-full rounded-xl border-2 border-ink px-3 py-2 bg-white" />
          </label>
          <div className="flex gap-2 flex-wrap">
            {causes.map(([id, c]) => <Button key={id} disabled={busy || n < 100 || n > state.coins} onClick={() => act('donate', { cause: id, amount: n }).catch(() => {})}>Give to {c.name}</Button>)}
          </div>
        </>
      )}
    </Panel>
  );
}

export function BoreholePanel({ onClose }) {
  const { state, act, busy, setPanel } = useGame();
  const [amount, setAmount] = useState(5000);
  const fund = Number(state.flags.borehole_fund) || 0;
  const done = !!state.flags.borehole_complete;
  const n = Math.max(0, Math.floor(Number(amount) || 0));
  return (
    <Panel title="Nkwo borehole project" icon={Droplets} onClose={onClose}>
      <Meter label={`Progress (${Math.min(fund, BOREHOLE_GOAL).toLocaleString()} of ${BOREHOLE_GOAL.toLocaleString()} LC equivalent)`} value={Math.min(fund, BOREHOLE_GOAL)} max={BOREHOLE_GOAL} color="bg-adire" />
      {done ? (
        <p className="font-bold my-3">The borehole is finished. Clean water flows in the square.</p>
      ) : (
        <>
          <p className="my-2 text-sm">The whole village contributes, a little every month. You can give money, or a day of hard labour — both count the same in Nkwo’s eyes.</p>
          <ScriptureCard refText="Mark 12:43-44" compact why="Jesus honours a small gift given wholeheartedly; the amount is not the measure." />
          <div className="flex gap-2 flex-wrap mt-3">
            <Button variant="leaf" disabled={busy || state.stats.energy < 35} onClick={() => act('borehole_labour').catch(() => {})}>{state.stats.energy < 35 ? 'Too tired for labour' : 'Give a day of labour'}</Button>
          </div>
          <div className="flex gap-2 items-end mt-3">
            <label className="flex-1">
              <span className="font-bold text-sm">Give money (LC)</span>
              <input type="number" min="100" step="500" value={amount} onChange={(e) => setAmount(e.target.value)} className="mt-1 w-full rounded-xl border-2 border-ink px-3 py-2 bg-white" />
            </label>
            <Button disabled={busy || n < 100 || n > state.coins} onClick={() => act('donate', { cause: 'borehole', amount: n }).catch(() => {})}>Give</Button>
          </div>
          {!state.missions.active.includes('generous_hands') && !state.missions.completed.includes('generous_hands') && (
            <Button variant="paper" className="mt-3 text-sm" onClick={() => setPanel({ id: 'missions', tab: 'board' })}>See the mission board</Button>
          )}
        </>
      )}
    </Panel>
  );
}

export function ScriptureSpotPanel({ onClose, refText, title }) {
  const { act } = useGame();
  return (
    <Panel title={title} icon={BookMarked} onClose={onClose}>
      <p className="mb-2 text-sm">You sit by the water outside the city gate. This is how Luke describes what happened at a place like this:</p>
      <ScriptureCard refText={refText} onRead={(ref) => act('read_scripture', { ref }, { quiet: true }).catch(() => {})} />
      <p className="text-sm text-ink/70">The exact location of this place of prayer is not known; the riverside here is the game’s reconstruction.</p>
    </Panel>
  );
}

export function DecisionPanel({ onClose, scenarioId }) {
  const { state, act, busy, setPanel } = useGame();
  const sc = SCENARIO_BY_ID[scenarioId];
  const [outcome, setOutcome] = useState(null);
  if (!sc) return null;
  if (outcome)
    return (
      <Panel title={sc.title} icon={Scale} onClose={onClose}>
        <p className="mb-4 text-lg">{outcome}</p>
        <p className="text-sm text-ink/70 mb-3">Some consequences may show up later.</p>
        <Button onClick={onClose}>Continue</Button>
      </Panel>
    );
  const prayed = state.flags[`prayed_before_${sc.id}`];
  const canPray = Object.values(PRAYER_PLACES).some((p) => p.mapId === state.location.mapId);
  return (
    <Panel title={sc.title} icon={Scale} onClose={onClose} wide>
      <p className="mb-3 text-[1.05rem]">{sc.context}</p>
      <details className="mb-3">
        <summary className="font-bold cursor-pointer">Scripture to consider ({sc.scripture.length})</summary>
        {sc.scripture.map((s) => <ScriptureCard key={s.ref} refText={s.ref} compact why={s.why} />)}
      </details>
      {prayed && <p className="text-sm bg-mist/50 rounded-xl px-3 py-2 mb-2">You prayed before deciding. The choice is still yours.</p>}
      <ul className="grid gap-2">
        {sc.choices.map((c) => {
          const locked = c.requires && !check(c.requires, state);
          return (
            <li key={c.id}>
              <button
                type="button"
                disabled={busy || locked}
                onClick={async () => {
                  try {
                    await act('resolve_scenario', { scenarioId: sc.id, choiceId: c.id }, { quiet: true });
                    setOutcome(c.outcome);
                  } catch {
                    /* toast */
                  }
                }}
                className={`w-full text-left sticker-sm rounded-2xl px-3 py-2 ${locked ? 'bg-ink/5 opacity-60' : 'bg-white hover:bg-gold'}`}
              >
                {c.text}
                {locked && <span className="block text-xs font-bold text-laterite">Not possible for you right now.</span>}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="flex gap-2 mt-4 flex-wrap">
        {canPray && !prayed && <Button variant="indigo" onClick={() => setPanel({ id: 'prayer', type: 'decision' })}>Pray first</Button>}
        <Button variant="paper" onClick={onClose}>Decide later</Button>
      </div>
    </Panel>
  );
}

export { formatDate, Coins };
