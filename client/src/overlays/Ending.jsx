import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ENDING_PASSAGES } from '@lfj/shared';
import { Api } from '../api/client.js';
import { audio } from '../audio/audio.js';
import { bridge } from '../game/bridge.js';
import { useGame } from '../state/GameContext.jsx';
import { useSettings } from '../state/AppContext.jsx';
import { Button, Spinner } from '../components/ui.jsx';
import { ScriptureCard } from '../components/ScriptureCard.jsx';
import { ReportView } from '../components/ReportView.jsx';

const STAGES = ['trumpet', 'return', 'review', 'account', 'report'];

/** The cinematic ending: trumpet → Scripture → life review → accountability & grace → report. */
export function EndingSequence() {
  const navigate = useNavigate();
  const { characterId, state } = useGame();
  const { settings } = useSettings();
  const [stage, setStage] = useState(0);
  const [report, setReport] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    bridge.emit('set-blocked', true);
    bridge.emit('trumpet');
    const ms = audio.trumpet();
    const t = setTimeout(() => setStage(1), settings.reducedMotion ? 1500 : ms);
    Api.report(characterId).then((r) => setReport(r.report)).catch(setError);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const next = () => setStage((s) => Math.min(STAGES.length - 1, s + 1));
  const name = state.profile.name;

  return (
    <div className="absolute inset-0 z-[60] overflow-y-auto" role="dialog" aria-modal="true" aria-label="The end of the journey">
      <div className={`min-h-full flex items-start sm:items-center justify-center p-4 transition-colors duration-1000 ${stage === 0 ? 'bg-transparent' : 'bg-[#fff8e6]'}`}>
        {stage === 0 && (
          <div className="mt-[30vh] text-center rise">
            <p className="font-display text-4xl sm:text-6xl font-extrabold text-ink [text-shadow:0_0_24px_#fff3c4]">The trumpet sounds.</p>
          </div>
        )}
        {stage === 1 && (
          <article className="max-w-2xl w-full rise">
            <p className="font-display text-3xl sm:text-4xl font-extrabold mb-1">{name}’s earthly journey has come to its end.</p>
            <p className="mb-4 text-ink/80">In this story, the moment came on {state.ending.date || 'an ordinary day'} — unannounced, in the middle of an ordinary life.</p>
            {ENDING_PASSAGES.slice(0, 2).map((p) => <ScriptureCard key={p.ref} refText={p.ref} />)}
            <p className="text-sm text-ink/70 my-3">Game commentary: Christians understand the order of end-time events in different ways. The game uses this moment as a point of reflection; it does not predict any real-world event or date.</p>
            <Button onClick={next}>Look back on this life</Button>
          </article>
        )}
        {stage === 2 && (
          <article className="max-w-2xl w-full rise">
            <p className="font-display text-3xl font-extrabold mb-3">A life, remembered</p>
            {error && <p className="text-laterite font-bold">The life review could not be loaded ({error.message}). The report is still saved.</p>}
            {!report && !error && <Spinner label="Gathering memories…" />}
            {report && (
              <ol className="border-l-4 border-gold pl-4 space-y-3 mb-4">
                {report.highlights.map((h, i) => (
                  <li key={i} className="rise" style={{ animationDelay: settings.reducedMotion ? '0ms' : `${i * 120}ms` }}>
                    <p className="text-xs font-bold text-ink/60">{h.date}</p>
                    <p className="font-bold leading-tight">{h.title}</p>
                    {h.detail && <p className="text-sm">{h.detail}</p>}
                  </li>
                ))}
              </ol>
            )}
            {report?.missed?.length > 0 && (
              <div className="mb-4">
                <p className="font-bold">Roads not taken</p>
                <ul className="list-disc pl-5 text-sm">{report.missed.map((m) => <li key={m}>{m}</li>)}</ul>
              </div>
            )}
            <Button onClick={next}>Continue</Button>
          </article>
        )}
        {stage === 3 && (
          <article className="max-w-2xl w-full rise">
            <p className="font-display text-3xl font-extrabold mb-1">Accountability and grace</p>
            <p className="mb-3 text-ink/80">Scripture speaks of every person giving account to God — and of salvation as God’s gift, received by grace through faith, not earned by works.</p>
            {ENDING_PASSAGES.slice(2).map((p) => (
              <div key={p.ref}>
                <ScriptureCard refText={p.ref} />
                {p.fullRef && <p className="text-xs text-ink/60 -mt-1 mb-2">Excerpt — the full passage is {p.fullRef}.</p>}
              </div>
            ))}
            <div className="sticker-sm bg-white rounded-2xl p-4 my-4">
              <p className="font-bold mb-1">A reflection (game commentary, not Scripture)</p>
              <p className="text-sm">This game cannot see a heart, and it does not decide anyone’s eternity. It added up coins and counted choices — the Bible’s judge sees far more than that. What the game can do is hold up a mirror: how did {name} use time, money, words and relationships? And where might your own life be asking the same questions?</p>
            </div>
            <Button onClick={next}>See the full life report</Button>
          </article>
        )}
        {stage === 4 && (
          <article className="max-w-3xl w-full rise py-4">
            <p className="font-display text-3xl font-extrabold mb-3">{name}: a life report</p>
            {report ? <ReportView report={report} ended /> : <Spinner label="Loading the report…" />}
            <div className="flex gap-2 flex-wrap mt-4 sticky bottom-0 bg-[#fff8e6] py-3 border-t-2 border-ink/10">
              <Button onClick={() => navigate('/new')}>Start a new life</Button>
              <Button variant="paper" onClick={() => navigate(`/report/${characterId}`)}>Open the report page</Button>
              <Button variant="paper" onClick={() => setStage(3)}>Read the Scripture again</Button>
              <Button variant="indigo" onClick={() => navigate('/')}>Main menu</Button>
            </div>
          </article>
        )}
      </div>
    </div>
  );
}
