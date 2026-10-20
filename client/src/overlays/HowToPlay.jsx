import { BookOpen } from 'lucide-react';
import { Panel } from '../components/ui.jsx';

const KEYS = [
  ['W A S D / arrows', 'Walk'],
  ['E or Space', 'Talk / interact'],
  ['I', 'Inventory'],
  ['M', 'World map & travel'],
  ['J', 'Missions journal'],
  ['P', 'Pray'],
  ['B', 'Bible Explorer'],
  ['C', 'Character profile'],
  ['Esc', 'Pause / close'],
];

export function HowToPlay({ onClose }) {
  return (
    <Panel title="How to play" icon={BookOpen} onClose={onClose} wide>
      <div className="grid sm:grid-cols-2 gap-5">
        <div>
          <h3 className="font-display text-xl font-bold mb-2">Living your life</h3>
          <ul className="list-disc pl-5 space-y-1.5 mb-4">
            <li>Walk around Udoka, enter buildings and talk to people. A gold outline shows what you can use.</li>
            <li>Get a job from a vacancies board, study at the Learning Centre, run a business, shop, save and give.</li>
            <li>Time passes as you walk and as you do things. Eat and sleep to keep your energy up. Bills are paid each month.</li>
            <li>At home you can let a whole month pass, which is how years go by.</li>
            <li>People’s stories unfold over many days. Listening, helping and respecting their pace matter more than winning arguments.</li>
            <li>Decisions arrive as your life unfolds. Some cost you something now and pay off later — or the other way round.</li>
          </ul>
          <h3 className="font-display text-xl font-bold mb-2">The trumpet</h3>
          <p className="mb-2">With the “unexpected trumpet” setting, your character’s earthly journey ends at a moment you are never told in advance. You will then see a life review, Scripture on accountability and grace, and a record of your simulated life.</p>
          <p>An ended character can’t be continued, but their report stays, and your other characters are never affected.</p>
        </div>
        <div>
          <h3 className="font-display text-xl font-bold mb-2">Controls</h3>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 mb-4">
            {KEYS.map(([k, v]) => (
              <div key={k} className="contents">
                <dt><kbd className="sticker-sm bg-white rounded-md px-1.5 py-0.5 text-sm font-bold whitespace-nowrap">{k}</kbd></dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mb-4">On phones and tablets use the on-screen pad and the round action button.</p>
          <h3 className="font-display text-xl font-bold mb-2">A note on the game’s scoring</h3>
          <p className="text-sm">Life Coins, experience, crowns and badges are game mechanics. They record what happened in the simulation. They are not salvation, they are not merit before God, and the game cannot see anyone’s heart. Scripture is shown in the World English Bible (public domain), clearly separated from game dialogue and commentary.</p>
        </div>
      </div>
    </Panel>
  );
}
