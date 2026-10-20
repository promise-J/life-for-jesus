import { Coins } from './ui.jsx';

function Section({ title, children }) {
  return (
    <section className="mb-5">
      <h3 className="font-display text-xl font-bold mb-1.5">{title}</h3>
      {children}
    </section>
  );
}

const Stat = ({ label, value }) => (
  <div className="rounded-2xl bg-white border-2 border-ink/15 px-3 py-2">
    <p className="text-xs font-bold text-ink/60">{label}</p>
    <p className="font-display text-xl font-extrabold">{value}</p>
  </div>
);

/** The life report: a record of simulated gameplay, with its disclaimer always visible. */
export function ReportView({ report, ended }) {
  const r = report;
  return (
    <div>
      <p className="bg-sand border-2 border-ink/20 rounded-2xl p-3 text-sm mb-4">{r.disclaimer}</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
        <Stat label="Simulated time" value={r.yearsSimulated >= 1 ? `${r.yearsSimulated} years` : `${r.daysSimulated} days`} />
        <Stat label={ended ? 'Age at the end' : 'Age now'} value={r.ageAtEnd} />
        <Stat label="Missions completed" value={r.missions.length} />
        <Stat label="People known" value={r.relationships.length} />
      </div>
      <Section title="Highlights of this life">
        <ol className="border-l-4 border-gold pl-4 space-y-2">
          {r.highlights.map((h, i) => (
            <li key={i}>
              <p className="text-xs font-bold text-ink/60">{h.date}</p>
              <p className="font-bold leading-tight">{h.title}</p>
              {h.detail && <p className="text-sm">{h.detail}</p>}
            </li>
          ))}
        </ol>
      </Section>
      <Section title="Work & learning">
        {r.careers.length ? <ul className="list-disc pl-5">{r.careers.map((c, i) => <li key={i}>{c.job} — {c.employer}</li>)}</ul> : <p>No paid work in this story.</p>}
        <p className="mt-1"><span className="font-bold">Education:</span> {r.education.join(', ') || 'none'}</p>
        {r.businesses.length > 0 && <p><span className="font-bold">Businesses:</span> {r.businesses.map((b) => `${b.name} (${b.days} days, ${b.profit.toLocaleString()} LC)`).join('; ')}</p>}
      </Section>
      <Section title="Money & possessions">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <Stat label="Earned" value={<Coins value={r.wealth.earned} />} />
          <Stat label="Spent" value={<Coins value={r.wealth.spent} />} />
          <Stat label="Given away" value={<Coins value={r.wealth.given} />} />
          <Stat label="In hand" value={<Coins value={r.wealth.finalCoins} />} />
          <Stat label="Saved" value={<Coins value={r.wealth.finalSavings} />} />
          <Stat label="Peak wealth" value={<Coins value={r.wealth.peak} />} />
        </div>
        {r.properties.length > 0 && <p className="mt-2"><span className="font-bold">Property:</span> {r.properties.join(', ')}</p>}
      </Section>
      <Section title="People">
        {r.relationships.length ? (
          <ul className="grid sm:grid-cols-2 gap-1">
            {r.relationships.map((p) => (
              <li key={p.id}>{p.name} — {p.label}{p.storyline ? ` · ${p.storyline === 'conversion' ? 'chose to follow Jesus (fictional)' : 'honest friendship'}` : ''}</li>
            ))}
          </ul>
        ) : (
          <p>This character didn’t get to know anyone well.</p>
        )}
      </Section>
      <Section title="Faith & service in the story">
        <p>
          Prayers: {r.faith.prayers} · Scripture passages read: {r.faith.scriptureRead} · Bible studies: {r.faith.bibleStudies} · faith conversations: {r.faith.conversations} · acts of service: {r.service.acts} · gifts: {r.service.donations}
        </p>
        {r.faith.storylines.length > 0 && (
          <ul className="list-disc pl-5 mt-1">
            {r.faith.storylines.map((s) => <li key={s.name}>{s.name}: {s.outcome === 'conversion' ? 'chose to follow Jesus' : 'remained a friend without being persuaded'}{s.discipled ? ', and grew in fellowship' : ''}</li>)}
          </ul>
        )}
      </Section>
      <Section title="Major choices">
        {r.choices.length ? (
          <ul className="space-y-2">
            {r.choices.map((c, i) => (
              <li key={i} className="rounded-2xl bg-white border-2 border-ink/15 px-3 py-2">
                <p className="font-bold">{c.title}{c.prayedFirst ? ' · prayed first' : ''}</p>
                <p className="text-sm">{c.choice}</p>
                <p className="text-sm italic">{c.outcome}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No major decisions came up.</p>
        )}
      </Section>
      <Section title="Achievements (gameplay recognitions)">
        <p>{r.achievements.length ? r.achievements.map((a) => `${a.kind === 'crown' ? '♛' : '◆'} ${a.name}`).join(' · ') : 'None in this story.'}</p>
      </Section>
      {r.missed.length > 0 && (
        <Section title="Roads not taken">
          <ul className="list-disc pl-5">{r.missed.map((m) => <li key={m}>{m}</li>)}</ul>
        </Section>
      )}
    </div>
  );
}
