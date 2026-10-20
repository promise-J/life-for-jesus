import { Settings } from 'lucide-react';
import { Panel } from '../components/ui.jsx';
import { useSettings } from '../state/AppContext.jsx';
import { audio } from '../audio/audio.js';

export function SettingsPanel({ onClose }) {
  const { settings, updateSettings } = useSettings();
  const slider = (key, label) => (
    <label className="block mb-4">
      <span className="flex justify-between font-bold">
        <span>{label}</span>
        <span>{Math.round(settings[key] * 100)}%</span>
      </span>
      <input
        type="range"
        min="0"
        max="1"
        step="0.05"
        value={settings[key]}
        onChange={(e) => {
          audio.unlock();
          updateSettings({ [key]: Number(e.target.value) });
          if (key === 'sfxVolume') audio.sfxPlay('coin');
        }}
        className="w-full accent-[#d18f12]"
      />
    </label>
  );
  const toggle = (key, label, hint) => (
    <label className="flex items-start gap-3 mb-4 cursor-pointer">
      <input type="checkbox" checked={!!settings[key]} onChange={(e) => updateSettings({ [key]: e.target.checked })} className="mt-1 w-5 h-5 accent-[#d18f12]" />
      <span>
        <span className="font-bold block">{label}</span>
        {hint && <span className="text-sm text-ink/70">{hint}</span>}
      </span>
    </label>
  );
  return (
    <Panel title="Audio & accessibility" icon={Settings} onClose={onClose}>
      <h3 className="font-display text-xl font-bold mb-2">Sound</h3>
      {slider('musicVolume', 'Music & ambience')}
      {slider('sfxVolume', 'Sound effects')}
      {toggle('muted', 'Mute everything')}
      <h3 className="font-display text-xl font-bold mb-2 mt-2">Comfort</h3>
      {toggle('reducedMotion', 'Reduce motion', 'Removes screen shake and shortens animations.')}
      <label className="block mb-4">
        <span className="font-bold">Text size</span>
        <select value={settings.textScale} onChange={(e) => updateSettings({ textScale: Number(e.target.value) })} className="mt-1 w-full rounded-xl border-2 border-ink px-3 py-2 bg-white">
          <option value={0.9}>Smaller</option>
          <option value={1}>Standard</option>
          <option value={1.15}>Larger</option>
          <option value={1.3}>Largest</option>
        </select>
      </label>
      <label className="block mb-2">
        <span className="font-bold">On-screen controls</span>
        <select value={settings.touchControls} onChange={(e) => updateSettings({ touchControls: e.target.value })} className="mt-1 w-full rounded-xl border-2 border-ink px-3 py-2 bg-white">
          <option value="auto">Automatic (touch devices)</option>
          <option value="on">Always show</option>
          <option value="off">Never show</option>
        </select>
      </label>
      <p className="text-sm text-ink/70 mt-3">Nothing in the game relies on sound alone: every cue also appears on screen.</p>
    </Panel>
  );
}
