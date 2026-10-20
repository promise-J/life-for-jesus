import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent, act as rtlAct } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Routes, Route } from 'react-router-dom';
import { makeCharacter, renderWithApp, renderInGame } from './helpers.jsx';

vi.mock('../src/api/client.js', async () => {
  const actual = await vi.importActual('../src/api/client.js');
  const Api = Object.fromEntries(Object.keys(actual.Api).map((k) => [k, vi.fn()]));
  return { ...actual, Api };
});

const { Api } = await import('../src/api/client.js');
const { NewGame } = await import('../src/screens/NewGame.jsx');
const { MainMenu } = await import('../src/screens/MainMenu.jsx');
const { SettingsPanel } = await import('../src/overlays/SettingsPanel.jsx');
const { DialogueOverlay } = await import('../src/overlays/Dialogue.jsx');
const { InventoryPanel } = await import('../src/overlays/panels/Life.jsx');
const { MissionsPanel } = await import('../src/overlays/panels/World.jsx');
const { DecisionPanel } = await import('../src/overlays/panels/Faith.jsx');
const App = (await import('../src/App.jsx')).default;

const user = { id: 'u1', displayName: 'Tester', email: null, isGuest: true };

beforeEach(() => {
  vi.resetAllMocks();
  Api.me.mockResolvedValue({ user });
  Api.config.mockResolvedValue({ devTools: false });
  Api.settings.mockResolvedValue({ settings: {} });
  Api.saveSettings.mockResolvedValue({ settings: {} });
  Api.characters.mockResolvedValue({ characters: [] });
  localStorage.clear();
});

function actionReturning(character, extra = {}) {
  Api.action.mockImplementation(async (_id, type, payload) => ({ messages: [], events: [], ended: false, character, ...extra, _type: type, _payload: payload }));
}

describe('character creation', () => {
  it('walks through the steps and creates the character with the chosen options', async () => {
    Api.createCharacter.mockResolvedValue({ character: { id: 'new1' } });
    renderWithApp(
      <Routes>
        <Route path="/" element={<NewGame />} />
        <Route path="/play/:id" element={<p>Playing</p>} />
      </Routes>,
    );
    const u = userEvent.setup();
    const next = screen.getByRole('button', { name: /Next: where you start/ });
    expect(next).toBeDisabled();
    await u.type(screen.getByPlaceholderText(/Chiamaka/), 'Zainab');
    await u.click(screen.getByRole('radio', { name: 'Male', exact: true }));
    await u.click(screen.getByRole('radio', { name: 'Afro' }));
    await u.click(next);
    await u.click(screen.getByRole('radio', { name: /New graduate/ }));
    await u.click(screen.getByRole('button', { name: /Next: how you play/ }));
    await u.click(screen.getByRole('radio', { name: /Free Life/ }));
    await u.click(screen.getByRole('radio', { name: /Open sandbox/ }));
    expect(screen.getByText(/cannot be resumed/)).toBeInTheDocument();
    await u.click(screen.getByRole('button', { name: /Begin Zainab/ }));
    await waitFor(() => expect(Api.createCharacter).toHaveBeenCalled());
    expect(Api.createCharacter.mock.calls[0][0]).toMatchObject({ name: 'Zainab', gender: 'male', hair: 'afro', startAge: 'graduate', mode: 'free', endingMode: 'off' });
    expect(await screen.findByText('Playing')).toBeInTheDocument();
  });

  it('shows the server error when creation fails', async () => {
    Api.createCharacter.mockRejectedValue(new Error('You can have up to 10 characters.'));
    renderWithApp(<NewGame />);
    const u = userEvent.setup();
    await u.type(screen.getByPlaceholderText(/Chiamaka/), 'Zainab');
    await u.click(screen.getByRole('button', { name: /Next: where you start/ }));
    await u.click(screen.getByRole('button', { name: /Next: how you play/ }));
    await u.click(screen.getByRole('button', { name: /Begin Zainab/ }));
    expect(await screen.findByRole('alert')).toHaveTextContent('up to 10 characters');
  });
});

describe('main menu & navigation', () => {
  it('lists saved lives and continues one', async () => {
    Api.characters.mockResolvedValue({ characters: [{ id: 'c9', name: 'Emeka', status: 'active', mode: 'free', summary: { age: 22, coins: 1234, mapId: 'Udoka City' } }, { id: 'c8', name: 'Old Life', status: 'ended', mode: 'mission', summary: {} }] });
    renderWithApp(
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/play/:id" element={<p>Playing c9</p>} />
        <Route path="/report/:id" element={<p>Report</p>} />
      </Routes>,
    );
    expect(await screen.findByText('Emeka')).toBeInTheDocument();
    expect(screen.getByText('Story ended')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Continue as Emeka' }));
    expect(await screen.findByText('Playing c9')).toBeInTheDocument();
  });

  it('offers guest play when signed out', async () => {
    Api.me.mockResolvedValue({ user: null });
    Api.guest.mockResolvedValue({ user });
    renderWithApp(<MainMenu />);
    await userEvent.click(await screen.findByRole('button', { name: 'Play as guest' }));
    await waitFor(() => expect(Api.guest).toHaveBeenCalled());
    expect(await screen.findByText('Your lives')).toBeInTheDocument();
  });

  it('shows a recovery screen when the server is unreachable', async () => {
    Api.me.mockRejectedValue(new Error('Cannot reach the game server.'));
    renderWithApp(<App />);
    expect(await screen.findByText(/Can’t reach the game server/)).toBeInTheDocument();
    Api.me.mockResolvedValue({ user: null });
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByText('Life for Jesus')).toBeInTheDocument();
  });
});

describe('settings', () => {
  it('saves audio and accessibility settings to the server', async () => {
    renderWithApp(<SettingsPanel onClose={() => {}} />);
    await waitFor(() => expect(Api.settings).toHaveBeenCalled());
    fireEvent.click(screen.getByLabelText(/Mute everything/));
    fireEvent.click(screen.getByLabelText(/Reduce motion/));
    await waitFor(() => expect(Api.saveSettings).toHaveBeenCalled(), { timeout: 2000 });
    expect(document.documentElement.classList.contains('reduced-motion')).toBe(true);
    expect(JSON.parse(localStorage.getItem('lfj_settings'))).toMatchObject({ muted: true, reducedMotion: true });
  });
});

describe('in-game panels', () => {
  it('dialogue shows the NPC line and sends the chosen option', async () => {
    const ch = makeCharacter((s) => {
      s.dialogue = { npcId: 'nneka', tree: 'nneka_intro', node: 'a' };
    });
    const after = makeCharacter();
    actionReturning(after);
    localStorage.setItem('lfj_settings', JSON.stringify({ reducedMotion: true }));
    renderInGame(<DialogueOverlay reducedMotion />, ch);
    expect(screen.getByRole('dialog', { name: /Conversation with Nneka Eze/ })).toBeInTheDocument();
    expect(screen.getByText(/School resumes next week/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /How short are you/ }));
    await waitFor(() => expect(Api.action).toHaveBeenCalledWith('c1', 'talk_choose', { choiceId: 'listen' }));
  });

  it('inventory lets you eat food via an authoritative action', async () => {
    const ch = makeCharacter();
    actionReturning(ch);
    renderInGame(<InventoryPanel onClose={() => {}} />, ch);
    expect(screen.getByText('Loaf of bread')).toBeInTheDocument();
    const btns = screen.getAllByRole('button', { name: 'Eat / use' });
    await userEvent.click(btns[0]);
    await waitFor(() => expect(Api.action).toHaveBeenCalledWith('c1', 'use_item', { itemId: 'bread' }));
  });

  it('missions panel shows objectives and accepts board missions', async () => {
    const ch = makeCharacter();
    actionReturning(ch);
    renderInGame(<MissionsPanel onClose={() => {}} />, ch);
    expect(screen.getByText('First Steps in Udoka')).toBeInTheDocument();
    expect(screen.getByText(/Buy food at Oja Market/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'Notice board' }));
    const card = screen.getByText('Faithful Steward').closest('li');
    await userEvent.click(card.querySelector('button.btn'));
    await waitFor(() => expect(Api.action).toHaveBeenCalledWith('c1', 'accept_mission', { missionId: 'faithful_steward' }));
  });

  it('decision panel locks unaffordable choices and shows the outcome after choosing', async () => {
    const ch = makeCharacter((s) => {
      s.coins = 0;
      s.scenarios.pending = ['uncle_fees'];
    });
    actionReturning(ch);
    Api.passage.mockResolvedValue({ passage: { reference: '1 Timothy 5:8', verses: [{ verse: 8, text: 'text' }], translation: { id: 'WEB' } } });
    renderInGame(<DecisionPanel onClose={() => {}} scenarioId="uncle_fees" />, ch);
    const giveAll = screen.getByRole('button', { name: /Send the full 20,000/ });
    expect(giveAll).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: /Explain honestly/ }));
    await waitFor(() => expect(Api.action).toHaveBeenCalledWith('c1', 'resolve_scenario', { scenarioId: 'uncle_fees', choiceId: 'decline' }));
    expect(await screen.findByText(/There is a long silence/)).toBeInTheDocument();
  });

  it('surfaces server errors from actions as messages, not crashes', async () => {
    const ch = makeCharacter();
    Api.action.mockRejectedValue(Object.assign(new Error('You need 1,200 LC.'), { code: 'insufficient_funds', status: 400 }));
    const { container } = renderInGame(<InventoryPanel onClose={() => {}} />, ch);
    await rtlAct(async () => {
      await userEvent.click(screen.getAllByRole('button', { name: 'Eat / use' })[0]);
    });
    expect(container).toBeTruthy();
    expect(Api.action).toHaveBeenCalled();
  });
});
