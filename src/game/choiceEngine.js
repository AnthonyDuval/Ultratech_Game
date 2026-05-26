/**
 * Moteur de choix narratifs — applique conséquences et branches
 */

import { getChoiceEvent } from '../data/narrativeChoices.js';
import { markProgress } from './stuckTimer.js';

export function applyNarrativeChoice(state, dispatch, eventId, optionId, onNotify) {
  const event = getChoiceEvent(eventId);
  if (!event) return { ok: false, error: 'Événement inconnu.' };

  const option = event.options.find((o) => o.id === optionId);
  if (!option) return { ok: false, error: 'Option invalide.' };

  if (state.choices?.[option.choiceKey]) {
    return { ok: false, error: 'Décision déjà prise.' };
  }

  dispatch({
    type: 'APPLY_NARRATIVE_CHOICE',
    eventId,
    option,
  });

  if (option.terminalLog) {
    dispatch({ type: 'ADD_TERMINAL_LOG', log: option.terminalLog });
  }

  const nextState = buildNextState(state, option);
  markProgress(nextState, dispatch);

  onNotify?.({
    type: 'choice-made',
    title: 'Décision enregistrée',
    message: 'Le réseau a pris note de votre action.',
  });

  return { ok: true, option };
}

function buildNextState(state, option) {
  const blocked = [...(state.narrativeFlags?.blocked_mails ?? []), ...(option.blockMails ?? [])];
  const flags = {
    ...state.narrativeFlags,
    ...(option.flags ?? {}),
    blocked_mails: [...new Set(blocked)],
    [`choice_${option.choiceKey}`]: option.choiceValue,
  };

  return {
    ...state,
    choices: { ...state.choices, [option.choiceKey]: option.choiceValue },
    narrativeFlags: flags,
    unlockedMails: [...new Set([...state.unlockedMails, ...(option.unlockMails ?? [])])],
  };
}
