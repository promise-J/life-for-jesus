import { useEffect, useMemo, useState } from 'react';
import { Ear, HelpCircle, Lightbulb, BookMarked, HandHelping, DoorOpen, HandHeart, Heart, Gift, AlertTriangle, MessageCircle, LogOut } from 'lucide-react';
import { DIALOGUES, NPC_BY_ID, check, ambientLine } from '@lfj/shared';
import { useGame } from '../state/GameContext.jsx';
import { CharacterPreview } from '../components/CharacterPreview.jsx';
import { ScriptureCard } from '../components/ScriptureCard.jsx';
import { audio } from '../audio/audio.js';

const KIND = {
  listen: { Icon: Ear, label: 'Listen' },
  ask: { Icon: HelpCircle, label: 'Ask' },
  explain: { Icon: Lightbulb, label: 'Explain' },
  scripture: { Icon: BookMarked, label: 'Share Scripture' },
  help: { Icon: HandHelping, label: 'Help' },
  invite: { Icon: DoorOpen, label: 'Invite' },
  pray: { Icon: HandHeart, label: 'Pray' },
  respect: { Icon: Heart, label: 'Respect' },
  gift: { Icon: Gift, label: 'Give' },
  pushy: { Icon: AlertTriangle, label: 'Push' },
  smalltalk: { Icon: MessageCircle, label: 'Chat' },
  end: { Icon: LogOut, label: 'Leave' },
};

/** Typewriter reveal (skipped with reduced motion or a click). */
function useReveal(text, reduced) {
  const [n, setN] = useState(reduced ? text.length : 0);
  useEffect(() => {
    if (reduced) {
      setN(text.length);
      return undefined;
    }
    setN(0);
    const t = setInterval(() => setN((x) => {
      if (x >= text.length) {
        clearInterval(t);
        return x;
      }
      if (x % 4 === 0) audio.sfxPlay('blip');
      return x + 2;
    }), 18);
    return () => clearInterval(t);
  }, [text, reduced]);
  return [text.slice(0, n), n >= text.length, () => setN(text.length)];
}

export function DialogueOverlay({ reducedMotion }) {
  const { state } = useGame();
  if (!state.dialogue) return null;
  return <Conversation key={`${state.dialogue.npcId}:${state.dialogue.tree}`} reducedMotion={reducedMotion} />;
}

function Conversation({ reducedMotion }) {
  const { state, act, busy } = useGame();
  const d = state.dialogue;
  const npc = NPC_BY_ID[d.npcId];
  const tree = DIALOGUES[d.tree];
  const node = tree.nodes[d.node];
  const text = node.ambientLine ? ambientLine(state, d.npcId) : node.text;
  const [shown, done, skip] = useReveal(text, reducedMotion);
  const choiceScripture = useMemo(() => (node.choices || []).flatMap((c) => c.scripture || []), [node]);
  const [showScripture, setShowScripture] = useState(null);

  const choose = async (c) => {
    try {
      await act('talk_choose', { choiceId: c.id });
      setShowScripture(c.scripture?.length ? c.scripture : null);
    } catch {
      /* toast */
    }
  };

  return (
    <div className="absolute inset-x-0 bottom-0 z-40 p-2 sm:p-4 flex justify-center" role="dialog" aria-modal="true" aria-label={`Conversation with ${npc.name}`}>
      <div className="pop-in sticker bg-paper rounded-3xl w-full max-w-3xl flex flex-col sm:flex-row gap-3 p-4 max-h-[70vh] overflow-y-auto scroll-thin">
        <div className="hidden sm:flex flex-col items-center w-28 shrink-0">
          <div className="bg-sand rounded-2xl border-2 border-ink px-1">
            <CharacterPreview look={npc.look} size={3} animate={false} label={npc.name} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display text-xl font-extrabold leading-tight">{npc.name}</p>
          <p className="text-xs text-ink/70 mb-2">{npc.occupation}{npc.historical ? ' · historical scenario (fictional character)' : ''}</p>
          <p className="text-[1.05rem] leading-relaxed min-h-[3.5rem]" onClick={skip} aria-live="polite">
            {shown}
            {!done && <span className="animate-pulse">▌</span>}
          </p>
          {showScripture && showScripture.map((r) => <ScriptureCard key={r} refText={r} compact onRead={(ref) => act('read_scripture', { ref }, { quiet: true }).catch(() => {})} />)}
          {done && (
            <ul className="mt-3 grid gap-2">
              {node.choices.map((c) => {
                const locked = c.requires && !check(c.requires, state, { npc: d.npcId });
                const k = KIND[c.kind] || KIND.smalltalk;
                return (
                  <li key={c.id}>
                    <button
                      type="button"
                      disabled={busy || locked}
                      onClick={() => choose(c)}
                      className={`w-full text-left sticker-sm rounded-2xl px-3 py-2 flex gap-2 items-start ${locked ? 'bg-ink/5 opacity-60' : c.kind === 'pushy' ? 'bg-white hover:bg-laterite/10' : 'bg-white hover:bg-gold'}`}
                    >
                      <k.Icon className="w-5 h-5 shrink-0 mt-0.5" aria-hidden />
                      <span>
                        <span className="text-xs font-extrabold block text-ink/60">{k.label}{locked ? ' — not available yet' : ''}</span>
                        {c.text}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {done && choiceScripture.length > 0 && !showScripture && (
            <p className="text-xs text-ink/60 mt-2">Choices marked “Share Scripture” or “Explain” will show the passage they refer to.</p>
          )}
          <p className="text-[11px] text-ink/50 mt-3">Game dialogue — fictional characters. Scripture appears only in the gold-edged cards.</p>
        </div>
      </div>
    </div>
  );
}
