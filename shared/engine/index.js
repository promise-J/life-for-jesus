import { ACTIONS, DIALOGUE_SAFE } from './actions.js';
import { createRun, ActionError, logLife, emit } from './core.js';
import { postProcess } from './tracking.js';
import { shouldEnd } from './ending.js';
import { formatDate } from './time.js';

export const ACTION_TYPES = Object.keys(ACTIONS);

/**
 * Apply one player action to a game state. Pure with respect to its input: the input state is
 * not mutated. ctx: { endAtMinutes, realElapsedMs, forceEnding }.
 * Returns { state, events, messages, logs, ledger, journal, ended }.
 */
export function applyAction(inputState, action, ctx = {}) {
  if (!action || typeof action.type !== 'string' || !ACTIONS[action.type]) {
    throw new ActionError('unknown_action', 'Unknown action.');
  }
  if (inputState.ending.status !== 'none') throw new ActionError('ended', 'This character’s story has ended.', 409);
  const state = structuredClone(inputState);
  const R = createRun(state, ctx);
  if (state.dialogue && !DIALOGUE_SAFE.has(action.type)) {
    throw new ActionError('in_dialogue', 'Finish your conversation first.', 409);
  }
  ACTIONS[action.type](R, action.payload || {});
  postProcess(R);
  let ended = false;
  if (ctx.forceEnding || shouldEnd(state, ctx.endAtMinutes)) {
    if (state.history.active) {
      state.location = state.history.active.returnLocation;
      state.history.active = null;
    }
    state.dialogue = null;
    state.ending = { status: 'triggered', atMinutes: state.time.minutes, date: formatDate(state.time.minutes) };
    emit(R, 'ending');
    logLife(R, { kind: 'ending', title: 'The trumpet sounded', detail: 'The earthly journey of this character came to its end.', weight: 5, tags: ['ending'] });
    ended = true;
  }
  return { state, events: R.events, messages: R.messages, logs: R.logs, ledger: R.ledger, journal: R.journal, ended };
}

/** Run the post-action checks once on a brand-new state (offers Mission Mode's first missions). */
export function bootstrapState(inputState) {
  const state = structuredClone(inputState);
  const R = createRun(state, {});
  postProcess(R);
  return state;
}

export { ActionError };
