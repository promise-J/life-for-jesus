import { createInitialState, bootstrapState, applyAction, TILE } from '../index.js';

export const BASE_INPUT = {
  name: 'Ada Obi',
  gender: 'female',
  skin: 'umber',
  hair: 'braids',
  hairColor: 'black',
  outfit: 'ankara_blue',
  startAge: 'student',
  background: 'trader_family',
  difficulty: 'standard',
  mode: 'free',
  endingMode: 'surprise',
  country: 'ng',
};

export function newState(overrides = {}, seed = 'test-seed') {
  return bootstrapState(createInitialState({ ...BASE_INPUT, ...overrides }, seed));
}

/** A tiny driver that applies actions sequentially and keeps the latest state. */
export function driver(state, ctx = {}) {
  const d = {
    state,
    last: null,
    act(type, payload = {}, extraCtx = {}) {
      d.last = applyAction(d.state, { type, payload }, { ...ctx, ...extraCtx });
      d.state = d.last.state;
      return d.last;
    },
    at(mapId, region) {
      d.state = { ...d.state, location: { ...d.state.location, mapId, region: region || (mapId === 'nkwo' ? 'nkwo' : mapId === 'philippi' ? 'philippi' : 'udoka') } };
      return d;
    },
    setTime(hour, day = Math.floor(d.state.time.minutes / 1440)) {
      d.state = { ...d.state, time: { ...d.state.time, minutes: day * 1440 + hour * 60 } };
      return d;
    },
    patch(fn) {
      const s = structuredClone(d.state);
      fn(s);
      d.state = s;
      return d;
    },
  };
  return d;
}

export const tileCentre = (tx, ty) => ({ x: tx * TILE + TILE / 2, y: ty * TILE + TILE - 1 });
