import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { createInitialState, bootstrapState } from '@lfj/shared';
import { AppProvider } from '../src/state/AppContext.jsx';
import { GameProvider } from '../src/state/GameContext.jsx';

export const INPUT = {
  name: 'Ada Obi', gender: 'female', skin: 'umber', hair: 'braids', hairColor: 'black', outfit: 'ankara_blue',
  startAge: 'student', background: 'trader_family', difficulty: 'standard', mode: 'mission', endingMode: 'surprise', country: 'ng',
};

export function makeCharacter(patch = (s) => s) {
  const state = bootstrapState(createInitialState(INPUT, 'ui-test'));
  patch(state);
  const { seed, rngCounter, ...rest } = state;
  return { id: 'c1', name: 'Ada Obi', status: 'active', mode: 'mission', rev: 1, state: rest };
}

export function renderWithApp(ui, { route = '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AppProvider>{ui}</AppProvider>
    </MemoryRouter>,
  );
}

export function renderInGame(ui, character = makeCharacter()) {
  return render(
    <MemoryRouter>
      <AppProvider>
        <GameProvider characterId={character.id} initial={character}>
          {ui}
        </GameProvider>
      </AppProvider>
    </MemoryRouter>,
  );
}
