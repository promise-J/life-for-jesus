import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import {
  SKIN_TONES, HAIR_STYLES, HAIR_COLORS, OUTFITS, GENDERS, START_AGES, BACKGROUNDS, DIFFICULTIES, GAME_MODES, ENDING_MODES, COUNTRIES, validateCreation,
} from '@lfj/shared';
import { Api } from '../api/client.js';
import { Button, ErrorNote } from '../components/ui.jsx';
import { CharacterPreview } from '../components/CharacterPreview.jsx';

const STEPS = ['Who you are', 'Where you start', 'How you play'];

function Choice({ options, value, onChange, name, render }) {
  return (
    <div role="radiogroup" aria-label={name} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className={`sticker-sm rounded-xl px-3 py-2 text-left font-bold ${value === o.id ? 'bg-gold' : 'bg-white'}`}
        >
          {render ? render(o) : o.name}
        </button>
      ))}
    </div>
  );
}

function BigChoice({ options, value, onChange, name }) {
  return (
    <div role="radiogroup" aria-label={name} className="grid sm:grid-cols-2 gap-2">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="radio"
          aria-checked={value === o.id}
          onClick={() => onChange(o.id)}
          className={`sticker-sm rounded-2xl p-3 text-left ${value === o.id ? 'bg-gold' : 'bg-white'}`}
        >
          <span className="font-display font-bold text-lg block leading-tight">{o.name}{o.age ? ` · ${o.age}` : ''}</span>
          <span className="text-sm">{o.blurb}</span>
        </button>
      ))}
    </div>
  );
}

export function NewGame() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [f, setF] = useState({
    name: '', gender: 'female', skin: 'chestnut', hair: 'braids', hairColor: 'black', outfit: 'ankara_blue',
    country: 'ng', city: 'udoka', startAge: 'student', background: 'trader_family', mode: 'mission', endingMode: 'surprise', difficulty: 'standard',
  });
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const look = { gender: f.gender, skin: f.skin, hair: f.hair, hairColor: f.hairColor, outfit: f.outfit };
  const nameOk = f.name.trim().length >= 2 && validateCreation(f).every((e) => !e.startsWith('Name'));

  const create = async () => {
    const errs = validateCreation(f);
    if (errs.length) return setError({ message: errs.join(' ') });
    setBusy(true);
    setError(null);
    try {
      const { character } = await Api.createCharacter(f);
      navigate(`/play/${character.id}`);
    } catch (e) {
      setError(e);
      setBusy(false);
    }
  };

  return (
    <main className="adire-bg min-h-full overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-4 text-paper">
          <Button variant="paper" onClick={() => (step ? setStep(step - 1) : navigate('/'))} aria-label="Back"><ArrowLeft className="w-5 h-5" /></Button>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold">A new life</h1>
          <ol className="ml-auto hidden sm:flex gap-2" aria-label="Steps">
            {STEPS.map((s, i) => (
              <li key={s} aria-current={i === step ? 'step' : undefined} className={`px-3 py-1 rounded-full font-bold text-sm ${i === step ? 'bg-gold text-ink' : 'bg-indigo-soft text-mist'}`}>{i + 1}. {s}</li>
            ))}
          </ol>
        </div>
        <div className="grid md:grid-cols-[260px_1fr] gap-5 items-start">
          <aside className="sticker bg-sand rounded-3xl p-4 flex flex-col items-center md:sticky md:top-4">
            <CharacterPreview look={look} size={5} label={`Preview of ${f.name || 'your character'}`} />
            <p className="font-display text-2xl font-extrabold mt-1 text-center">{f.name.trim() || 'Your name'}</p>
            <p className="text-sm text-center">{START_AGES.find((a) => a.id === f.startAge).age} years old · Udoka, Nigeria</p>
          </aside>
          <section className="sticker bg-paper rounded-3xl p-5">
            {step === 0 && (
              <div className="space-y-5">
                <label className="block">
                  <span className="font-display text-xl font-bold">Name</span>
                  <input autoFocus maxLength={24} value={f.name} onChange={(e) => set('name')(e.target.value)} placeholder="e.g. Chiamaka, Tunde, Zainab" className="mt-1 w-full rounded-xl border-2 border-ink px-3 py-2 text-lg bg-white" />
                </label>
                <div>
                  <p className="font-display text-xl font-bold mb-1">Character</p>
                  <Choice name="Gender" options={GENDERS} value={f.gender} onChange={set('gender')} />
                  <p className="text-sm text-ink/70 mt-1">Every career, ministry and opportunity is open to every character.</p>
                </div>
                <div>
                  <p className="font-display text-xl font-bold mb-1">Skin tone</p>
                  <Choice name="Skin tone" options={SKIN_TONES} value={f.skin} onChange={set('skin')} render={(o) => <span className="flex items-center gap-2"><span className="w-5 h-5 rounded-full border-2 border-ink" style={{ background: o.color }} />{o.name}</span>} />
                </div>
                <div>
                  <p className="font-display text-xl font-bold mb-1">Hair</p>
                  <Choice name="Hairstyle" options={HAIR_STYLES} value={f.hair} onChange={set('hair')} />
                  <div className="mt-2">
                    <Choice name="Hair colour" options={HAIR_COLORS.map((h) => ({ ...h, name: h.id }))} value={f.hairColor} onChange={set('hairColor')} render={(o) => <span className="flex items-center gap-2 capitalize"><span className="w-5 h-5 rounded-full border-2 border-ink" style={{ background: o.color }} />{o.id}</span>} />
                  </div>
                </div>
                <div>
                  <p className="font-display text-xl font-bold mb-1">Clothing</p>
                  <Choice name="Outfit" options={OUTFITS} value={f.outfit} onChange={set('outfit')} render={(o) => <span className="flex items-center gap-2"><span className="w-5 h-5 rounded border-2 border-ink" style={{ background: `linear-gradient(135deg, ${o.top} 60%, ${o.accent} 60%)` }} />{o.name}</span>} />
                </div>
                <Button disabled={!nameOk} onClick={() => setStep(1)} className="text-lg">Next: where you start</Button>
                {!nameOk && f.name && <p className="text-sm text-laterite font-bold">Use 2–24 letters (spaces, apostrophes and hyphens are fine).</p>}
              </div>
            )}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <p className="font-display text-xl font-bold mb-1">Country & city</p>
                  <Choice name="Country" options={COUNTRIES} value={f.country} onChange={set('country')} render={(o) => `${o.name} — ${o.cities[0].name}`} />
                  <p className="text-sm text-ink/70 mt-1">More countries are planned; only Nigeria is built so far.</p>
                </div>
                <div>
                  <p className="font-display text-xl font-bold mb-1">Life stage</p>
                  <BigChoice name="Starting age" options={START_AGES} value={f.startAge} onChange={set('startAge')} />
                </div>
                <div>
                  <p className="font-display text-xl font-bold mb-1">Background</p>
                  <BigChoice name="Background" options={BACKGROUNDS.map((b) => ({ ...b, blurb: `${b.blurb} Starts with ${b.coins.toLocaleString()} LC.` }))} value={f.background} onChange={set('background')} />
                </div>
                <Button onClick={() => setStep(2)} className="text-lg">Next: how you play</Button>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <p className="font-display text-xl font-bold mb-1">Game mode</p>
                  <BigChoice name="Game mode" options={GAME_MODES} value={f.mode} onChange={set('mode')} />
                </div>
                <div>
                  <p className="font-display text-xl font-bold mb-1">The end of the journey</p>
                  <BigChoice name="Ending" options={ENDING_MODES} value={f.endingMode} onChange={set('endingMode')} />
                  <p className="text-sm mt-2 bg-sand rounded-xl p-3 border-2 border-ink/20">
                    When the trumpet sounds, this character’s story is complete and cannot be resumed. You will see a life review and report, and you can start a new life at any time. The ending is a game mechanic — it doesn’t predict anything about the real world.
                  </p>
                </div>
                <div>
                  <p className="font-display text-xl font-bold mb-1">Challenge</p>
                  <BigChoice name="Difficulty" options={DIFFICULTIES} value={f.difficulty} onChange={set('difficulty')} />
                </div>
                <ErrorNote error={error} />
                <Button disabled={busy} onClick={create} className="text-xl">{busy ? 'Creating…' : f.name.trim() ? `Begin ${f.name.trim()}’s life` : 'Begin this life'}</Button>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
