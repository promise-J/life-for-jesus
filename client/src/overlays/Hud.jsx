import { useState } from 'react';
import { Sun, Moon, Cloud, CloudOff, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { calendar, formatDate, getMap, levelOf, lifeStageFor, ageAt, missionView, MISSION_BY_ID, ERA_BY_ID } from '@lfj/shared';
import { useGame } from '../state/GameContext.jsx';
import { Coins } from '../components/ui.jsx';

function Bar({ label, value, color }) {
  return (
    <div className="flex items-center gap-1.5" title={`${label}: ${Math.round(value)}`}>
      <span className="text-[11px] font-extrabold w-14 hidden sm:inline">{label}</span><span className="text-[11px] font-extrabold sm:hidden" aria-hidden>{label[0]}</span>
      <div className="h-2.5 w-16 sm:w-20 rounded-full bg-ink/20 border-2 border-ink overflow-hidden" role="meter" aria-label={label} aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100}>
        <div className={`h-full ${color}`} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}

export function Hud() {
  const { state, minutes, saveStatus, setPanel } = useGame();
  const [open, setOpen] = useState(() => typeof window === 'undefined' || window.innerWidth >= 640);
  const c = calendar(minutes);
  const night = c.hour >= 19 || c.hour < 6;
  const map = getMap(state.location.mapId);
  const age = Math.floor(ageAt(state, minutes));
  const era = state.history?.active ? ERA_BY_ID[state.history.active.eraId] : null;
  const tracked = state.missions.active[0] ? missionView(state, state.missions.active[0]) : null;
  const nextObj = tracked?.objectives.find((o) => !o.done && !o.optional);

  return (
    <div className="absolute left-2 top-2 z-20 flex flex-col gap-2 max-w-[calc(100%-4.5rem)] pointer-events-none">
      <div className="sticker bg-paper rounded-2xl px-2.5 py-1.5 sm:px-3 sm:py-2 pointer-events-auto text-[0.92em] sm:text-base">
        <div className="flex items-center gap-2 flex-wrap">
          {night ? <Moon className="w-5 h-5 text-adire" aria-hidden /> : <Sun className="w-5 h-5 text-gold-deep" aria-hidden />}
          <p className="font-display font-extrabold text-lg leading-none pt-0.5" aria-label="Time">
            {era ? era.name : `${String(c.hour).padStart(2, '0')}:${String(c.minute).padStart(2, '0')}`}
          </p>
          <p className="text-sm font-bold">{era ? 'Your own time is paused' : formatDate(minutes)}</p>
          <span className="ml-auto" aria-label={`Save status: ${saveStatus}`} title={saveStatus === 'saved' ? 'All progress saved' : saveStatus === 'saving' ? 'Saving…' : 'Not saved yet — will retry'}>
            {saveStatus === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> : saveStatus === 'error' ? <CloudOff className="w-4 h-4 text-laterite" /> : <Cloud className="w-4 h-4 text-leaf" />}
          </span>
        </div>
        <div className="flex items-center gap-3 mt-1 text-sm flex-wrap">
          <span className="font-bold">{map?.name}</span>
          <span>
            {state.profile.name}, {age} · {lifeStageFor(age).name}
          </span>
          <span className="font-bold">Lv {levelOf(state.stats.xp)}</span>
          <Coins value={state.coins} />
        </div>
        <div className="flex gap-3 mt-1.5 flex-wrap">
          <Bar label="Energy" value={state.stats.energy} color={state.stats.energy < 25 ? 'bg-laterite' : 'bg-gold'} />
          <Bar label="Health" value={state.stats.health} color="bg-leaf" />
          <Bar label="Wellbeing" value={state.stats.wellbeing} color="bg-adire" />
        </div>
      </div>
      {tracked && (
        <div className="sticker-sm bg-indigo text-paper rounded-2xl px-3 py-2 pointer-events-auto max-w-xs">
          <button type="button" className="w-full flex items-center gap-2 text-left" onClick={() => setOpen(!open)} aria-expanded={open}>
            <span className="font-display font-bold flex-1 leading-tight">{MISSION_BY_ID[tracked.id].title}</span>
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {open && (
            <button type="button" className="text-left text-sm text-mist mt-0.5" onClick={() => setPanel({ id: 'missions' })}>
              {nextObj ? `Next: ${nextObj.text}${nextObj.target > 1 ? ` (${Math.min(nextObj.count, nextObj.target)}/${nextObj.target})` : ''}` : 'All set — finishing up'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
