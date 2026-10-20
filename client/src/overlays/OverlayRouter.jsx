import { useGame } from '../state/GameContext.jsx';
import { useSettings } from '../state/AppContext.jsx';
import { DialogueOverlay } from './Dialogue.jsx';
import { InventoryPanel, ProfilePanel, RestPanel, ClinicPanel, BankPanel, PropertyPanel, InfoPanel } from './panels/Life.jsx';
import { CareersPanel, MarketPanel } from './panels/Work.jsx';
import { PrayerPanel, BiblePanel, BibleStudyPanel, ServicePanel, BoreholePanel, ScriptureSpotPanel, DecisionPanel } from './panels/Faith.jsx';
import { MapPanel, MissionsPanel, RelationshipsPanel, PausePanel, HistoryExitPanel } from './panels/World.jsx';

export function OverlayRouter() {
  const { panel, setPanel, state, ending } = useGame();
  const { settings } = useSettings();
  if (ending) return null;
  if (state.dialogue) return <DialogueOverlay reducedMotion={settings.reducedMotion} />;
  if (!panel) return null;
  const close = () => setPanel(null);
  const p = panel;
  switch (p.id) {
    case 'inventory': return <InventoryPanel onClose={close} filter={p.filter} />;
    case 'profile': return <ProfilePanel onClose={close} wardrobe={p.wardrobe} />;
    case 'rest': return <RestPanel onClose={close} />;
    case 'clinic': return <ClinicPanel onClose={close} />;
    case 'bank': return <BankPanel onClose={close} />;
    case 'property': return <PropertyPanel onClose={close} />;
    case 'info': return <InfoPanel onClose={close} title={p.title} text={p.text} />;
    case 'careers': return <CareersPanel onClose={close} tab={p.tab} mapId={p.mapId} />;
    case 'market': return <MarketPanel onClose={close} shopId={p.shopId} />;
    case 'prayer': return <PrayerPanel onClose={close} place={p.place} type={p.type} />;
    case 'bible': return <BiblePanel onClose={close} initialRefs={p.refs} />;
    case 'bibleStudy': return <BibleStudyPanel onClose={close} />;
    case 'service': return <ServicePanel onClose={close} service={p.service} />;
    case 'borehole': return <BoreholePanel onClose={close} />;
    case 'scriptureSpot': return <ScriptureSpotPanel onClose={close} refText={p.ref} title={p.title} />;
    case 'decision': return <DecisionPanel onClose={close} scenarioId={p.scenarioId} />;
    case 'map': return <MapPanel onClose={close} />;
    case 'missions': return <MissionsPanel onClose={close} tab={p.tab} />;
    case 'relationships': return <RelationshipsPanel onClose={close} />;
    case 'pause': return <PausePanel onClose={close} />;
    case 'historyExit': return <HistoryExitPanel onClose={close} />;
    default: return null;
  }
}
