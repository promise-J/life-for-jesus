import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Plus, Settings, BookOpen, LogOut, Trash2, ScrollText, UserPlus } from 'lucide-react';
import { useAuth } from '../state/AppContext.jsx';
import { Api } from '../api/client.js';
import { audio } from '../audio/audio.js';
import { Button, Panel, ErrorNote, Tabs, Coins } from '../components/ui.jsx';
import { SettingsPanel } from '../overlays/SettingsPanel.jsx';
import { HowToPlay } from '../overlays/HowToPlay.jsx';

function Skyline() {
  // An original dawn skyline: a big rising sun behind Udoka's rooftops and palms.
  return (
    <svg viewBox="0 0 600 200" className="w-full h-auto" aria-hidden="true">
      <circle cx="300" cy="150" r="110" fill="#f2b632" />
      <circle cx="300" cy="150" r="110" fill="none" stroke="#fdf6e3" strokeWidth="3" strokeDasharray="4 10" opacity="0.6" />
      <g fill="#141a4a">
        <rect x="0" y="150" width="600" height="50" />
        <rect x="20" y="120" width="60" height="40" />
        <polygon points="14,122 50,98 86,122" />
        <rect x="95" y="105" width="70" height="55" />
        <rect x="180" y="125" width="45" height="35" />
        <rect x="245" y="88" width="40" height="72" />
        <rect x="262" y="58" width="6" height="32" />
        <rect x="254" y="66" width="22" height="6" />
        <rect x="300" y="112" width="80" height="48" />
        <rect x="395" y="96" width="55" height="64" />
        <rect x="460" y="122" width="45" height="38" />
        <polygon points="455,124 482,104 510,124" />
        <rect x="520" y="110" width="70" height="50" />
        <path d="M545 110 q8 -40 4 -60" stroke="#141a4a" strokeWidth="5" fill="none" />
        <path d="M150 105 q6 -36 2 -54" stroke="#141a4a" strokeWidth="5" fill="none" />
      </g>
      <g fill="#141a4a">
        {[[549, 50], [152, 51]].map(([x, y]) =>
          [0, 1, 2, 3, 4].map((i) => <ellipse key={`${x}${i}`} cx={x + Math.cos(i * 1.25) * 13} cy={y + Math.sin(i * 1.25) * 6} rx="15" ry="4.5" transform={`rotate(${i * 72} ${x + Math.cos(i * 1.25) * 13} ${y + Math.sin(i * 1.25) * 6})`} />),
        )}
      </g>
    </svg>
  );
}

function AuthCard() {
  const { guest, login, register } = useAuth();
  const [tab, setTab] = useState('guest');
  const [form, setForm] = useState({ email: '', password: '', displayName: '' });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const run = async (fn) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (e) {
      setError(e.details?.length ? { message: e.details.map((d) => d.message).join(' ') } : e);
    } finally {
      setBusy(false);
    }
  };
  const field = (name, label, type = 'text', autoComplete) => (
    <label className="block mb-3">
      <span className="font-bold text-sm">{label}</span>
      <input
        type={type}
        name={name}
        autoComplete={autoComplete}
        value={form[name]}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
        className="mt-1 w-full rounded-xl border-2 border-ink px-3 py-2 bg-white"
        required
      />
    </label>
  );
  return (
    <div className="sticker bg-paper rounded-3xl p-5">
      <Tabs tabs={[{ id: 'guest', label: 'Play now' }, { id: 'login', label: 'Sign in' }, { id: 'register', label: 'Create account' }]} value={tab} onChange={setTab} />
      {tab === 'guest' && (
        <div>
          <p className="mb-4">Start straight away. Your game saves to this browser. You can turn it into a full account later without losing anything.</p>
          <Button className="w-full text-lg" disabled={busy} onClick={() => run(guest)}>
            Play as guest
          </Button>
        </div>
      )}
      {tab === 'login' && (
        <form onSubmit={(e) => { e.preventDefault(); run(() => login({ email: form.email, password: form.password })); }}>
          {field('email', 'Email', 'email', 'email')}
          {field('password', 'Password', 'password', 'current-password')}
          <button type="submit" className="btn btn-gold w-full" disabled={busy}>Sign in</button>
        </form>
      )}
      {tab === 'register' && (
        <form onSubmit={(e) => { e.preventDefault(); run(() => register(form)); }}>
          {field('displayName', 'Your name', 'text', 'nickname')}
          {field('email', 'Email', 'email', 'email')}
          {field('password', 'Password (8+ characters)', 'password', 'new-password')}
          <button type="submit" className="btn btn-gold w-full" disabled={busy}>Create account</button>
        </form>
      )}
      <ErrorNote error={error} />
    </div>
  );
}

function UpgradePanel({ onClose }) {
  const { upgrade } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  return (
    <Panel title="Keep your progress" icon={UserPlus} onClose={onClose}>
      <p className="mb-3">Add an email and password so you can sign in from any device. All your characters stay exactly as they are.</p>
      <form onSubmit={async (e) => { e.preventDefault(); try { await upgrade(form); onClose(); } catch (err) { setError(err); } }}>
        <label className="block mb-3"><span className="font-bold text-sm">Email</span><input type="email" autoComplete="email" className="mt-1 w-full rounded-xl border-2 border-ink px-3 py-2" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>
        <label className="block mb-3"><span className="font-bold text-sm">Password (8+ characters)</span><input type="password" autoComplete="new-password" className="mt-1 w-full rounded-xl border-2 border-ink px-3 py-2" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></label>
        <button type="submit" className="btn btn-gold w-full">Save my account</button>
      </form>
      <ErrorNote error={error} />
    </Panel>
  );
}

function Lives() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [chars, setChars] = useState(null);
  const [error, setError] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [upgrade, setUpgrade] = useState(false);
  const load = () => Api.characters().then((r) => setChars(r.characters)).catch(setError);
  useEffect(() => {
    load();
  }, []);
  return (
    <div className="sticker bg-paper rounded-3xl p-5">
      <div className="flex items-baseline justify-between gap-2 mb-3">
        <h2 className="font-display text-2xl font-extrabold">Your lives</h2>
        <span className="text-sm text-ink/70">{user.displayName}{user.isGuest ? ' (guest)' : ''}</span>
      </div>
      <ErrorNote error={error} />
      {chars === null && !error && <p>Loading…</p>}
      {chars?.length === 0 && <p className="mb-3">No characters yet. Every journey starts with a single step out of the front door.</p>}
      <ul className="space-y-2 mb-4">
        {chars?.map((c) => (
          <li key={c.id} className="flex items-center gap-3 rounded-2xl border-2 border-ink/20 bg-white px-3 py-2">
            <div className="flex-1 min-w-0">
              <p className="font-display font-bold text-lg leading-tight truncate">{c.name}</p>
              <p className="text-sm text-ink/70">
                {c.status === 'ended' ? 'Story ended' : `${c.mode === 'mission' ? 'Mission Mode' : 'Free Life'} · age ${c.summary?.age ?? '?'} · ${c.summary?.mapId ?? ''}`}
              </p>
              {c.status !== 'ended' && <Coins value={c.summary?.coins} className="text-sm" />}
            </div>
            {c.status === 'ended' ? (
              <Button variant="paper" onClick={() => navigate(`/report/${c.id}`)} aria-label={`Life report for ${c.name}`}><ScrollText className="w-5 h-5" /></Button>
            ) : (
              <Button onClick={() => navigate(`/play/${c.id}`)} aria-label={`Continue as ${c.name}`}><Play className="w-5 h-5" /></Button>
            )}
            <Button variant="paper" onClick={() => setConfirm(c)} aria-label={`Delete ${c.name}`}><Trash2 className="w-5 h-5" /></Button>
          </li>
        ))}
      </ul>
      <Button className="w-full text-lg flex items-center justify-center gap-2" onClick={() => navigate('/new')} disabled={chars?.length >= 10}>
        <Plus className="w-5 h-5" /> Start a new life
      </Button>
      <div className="flex gap-2 mt-3 flex-wrap">
        {user.isGuest && <Button variant="indigo" onClick={() => setUpgrade(true)}>Keep progress with an account</Button>}
        <Button variant="paper" onClick={logout} className="flex items-center gap-2"><LogOut className="w-4 h-4" /> Sign out</Button>
      </div>
      {upgrade && <UpgradePanel onClose={() => setUpgrade(false)} />}
      {confirm && (
        <Panel title={`Delete ${confirm.name}?`} icon={Trash2} onClose={() => setConfirm(null)}>
          <p className="mb-4">This permanently deletes this character, their journal and life history. Your other characters are not affected.</p>
          <div className="flex gap-2">
            <Button variant="red" onClick={async () => { await Api.deleteCharacter(confirm.id); setConfirm(null); load(); }}>Delete character</Button>
            <Button variant="paper" onClick={() => setConfirm(null)}>Keep</Button>
          </div>
        </Panel>
      )}
    </div>
  );
}

export function MainMenu() {
  const { user } = useAuth();
  const [panel, setPanel] = useState(null);
  useEffect(() => {
    audio.play('menu', null);
  }, []);
  return (
    <main className="adire-bg min-h-full overflow-y-auto" onPointerDown={() => audio.unlock()}>
      <div className="max-w-5xl mx-auto px-4 py-6 sm:py-10 grid gap-6 md:grid-cols-[1.1fr_1fr] items-center">
        <div className="text-paper">
          <Skyline />
          <h1 className="font-display font-extrabold leading-[0.9] text-[clamp(2.6rem,7vw,4.6rem)] mt-2 [text-shadow:4px_4px_0_#141a4a]">
            Life for Jesus
          </h1>
          <p className="font-display text-gold text-2xl font-bold -mt-1">The Journey</p>
          <p className="mt-3 text-mist max-w-[52ch]">
            Live a whole life in Udoka, a fictional Nigerian city. Work, study, trade, love your neighbours, pray, and share your faith — then, one day, without warning, the trumpet sounds.
          </p>
          <div className="flex gap-2 mt-4 flex-wrap">
            <Button variant="paper" className="flex items-center gap-2" onClick={() => setPanel('how')}><BookOpen className="w-5 h-5" /> How to play</Button>
            <Button variant="paper" className="flex items-center gap-2" onClick={() => setPanel('settings')}><Settings className="w-5 h-5" /> Settings</Button>
          </div>
        </div>
        <div>{user ? <Lives /> : <AuthCard />}</div>
      </div>
      <p className="text-center text-mist/70 text-xs pb-4 px-4">
        A game. Coins, crowns and reports describe a simulation — not anyone’s standing before God. Scripture: World English Bible (public domain).
      </p>
      {panel === 'settings' && <SettingsPanel onClose={() => setPanel(null)} />}
      {panel === 'how' && <HowToPlay onClose={() => setPanel(null)} />}
    </main>
  );
}
