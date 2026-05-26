import { useReducer, useEffect } from 'react';
import { loadGame } from '../utils/saveSystem.js';
import { mergeNarrativeDefaults, computeFactionAlignment } from '../game/narrativeState.js';

export const PHASES = {
  BOOT: 'boot',
  LOGIN: 'login',
  DESKTOP: 'desktop',
};

/** État initial — champs compatibles avec anciennes sauvegardes */
export function createInitialState() {
  const narrative = mergeNarrativeDefaults();
  return {
    phase: PHASES.BOOT,
    username: '',
    bittek: 100,
    reputation: 0,
    corruption: 0,
    suspicionUltraTech: 0,
    completedMissions: [],
    discoveredMissions: [],
    unlockedMails: [],
    readMails: [],
    narrativeFlags: {},
    choices: narrative.choices,
    factionAlignment: narrative.factionAlignment,
    trustUltraTech: narrative.trustUltraTech,
    trustNova: narrative.trustNova,
    discoveredNodes: [],
    discoveredClues: [],
    missionSteps: {},
    terminalLogs: [],
    tutorialCompleted: false,
    guidanceDisabled: false,
    lastSave: null,
  };
}

function clampStat(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function gameReducer(state, action) {
  switch (action.type) {
    case 'SET_PHASE':
      return { ...state, phase: action.phase };

    case 'SET_USERNAME':
      return { ...state, username: action.username };

    case 'UPDATE_STATS':
      return {
        ...state,
        bittek: action.bittek ?? state.bittek,
        reputation: action.reputation ?? state.reputation,
        corruption: clampStat(action.corruption ?? state.corruption),
        suspicionUltraTech: clampStat(action.suspicionUltraTech ?? state.suspicionUltraTech),
      };

    case 'ADD_SUSPICION':
      return {
        ...state,
        suspicionUltraTech: clampStat(state.suspicionUltraTech + action.amount),
      };

    case 'COMPLETE_MISSION':
      return {
        ...state,
        completedMissions: [...state.completedMissions, action.missionId],
      };

    case 'DISCOVER_MISSION':
      return {
        ...state,
        discoveredMissions: [...new Set([...state.discoveredMissions, action.missionId])],
      };

    case 'UNLOCK_MAILS':
      return {
        ...state,
        unlockedMails: [...new Set([...state.unlockedMails, ...action.mailIds])],
      };

    case 'MARK_MAIL_READ':
      return {
        ...state,
        readMails: [...new Set([...state.readMails, action.mailId])],
      };

    case 'SET_NARRATIVE_FLAG':
      return {
        ...state,
        narrativeFlags: { ...state.narrativeFlags, [action.flag]: action.value },
      };

    case 'ADD_DISCOVERED_NODE':
      return {
        ...state,
        discoveredNodes: [...new Set([...state.discoveredNodes, action.nodeId])],
      };

    case 'ADD_DISCOVERED_CLUE':
      return {
        ...state,
        discoveredClues: state.discoveredClues.includes(action.clue)
          ? state.discoveredClues
          : [...state.discoveredClues, action.clue],
      };

    case 'RECORD_MISSION_STEP': {
      const prev = state.missionSteps[action.missionId] ?? [];
      if (prev.includes(action.stepFlag)) return state;
      return {
        ...state,
        missionSteps: {
          ...state.missionSteps,
          [action.missionId]: [...prev, action.stepFlag],
        },
      };
    }

    case 'ADD_TERMINAL_LOG':
      return {
        ...state,
        terminalLogs: [...state.terminalLogs.slice(-49), action.log],
      };

    case 'COMPLETE_TUTORIAL':
      return { ...state, tutorialCompleted: true };

    case 'DISABLE_GUIDANCE':
      return { ...state, guidanceDisabled: true };

    case 'APPLY_NARRATIVE_CHOICE': {
      const { option } = action;
      const effects = option.effects ?? {};
      const newChoices = { ...state.choices, [option.choiceKey]: option.choiceValue };
      const newFlags = {
        ...state.narrativeFlags,
        ...(option.flags ?? {}),
        [`choice_${option.choiceKey}`]: option.choiceValue,
        blocked_mails: [
          ...new Set([...(state.narrativeFlags?.blocked_mails ?? []), ...(option.blockMails ?? [])]),
        ],
      };
      const trustUltraTech = clampStat((state.trustUltraTech ?? 50) + (effects.trustUltraTech ?? 0));
      const trustNova = clampStat((state.trustNova ?? 30) + (effects.trustNova ?? 0));

      return {
        ...state,
        choices: newChoices,
        narrativeFlags: newFlags,
        trustUltraTech,
        trustNova,
        factionAlignment: computeFactionAlignment(trustUltraTech, trustNova),
        reputation: state.reputation + (effects.reputation ?? 0),
        corruption: clampStat(state.corruption + (effects.corruption ?? 0)),
        suspicionUltraTech: clampStat(state.suspicionUltraTech + (effects.suspicionUltraTech ?? 0)),
        unlockedMails: [...new Set([...state.unlockedMails, ...(option.unlockMails ?? [])])],
      };
    }

    case 'RESET_PROFILE':
      return { ...createInitialState(), phase: PHASES.BOOT };

    default:
      return state;
  }
}

function mergeSavedState(saved) {
  const base = createInitialState();
  const narrative = mergeNarrativeDefaults(saved);
  return {
    ...base,
    ...saved,
    ...narrative,
    discoveredMissions: saved.discoveredMissions ?? [],
    narrativeFlags: saved.narrativeFlags ?? {},
    discoveredNodes: saved.discoveredNodes ?? [],
    discoveredClues: saved.discoveredClues ?? [],
    missionSteps: saved.missionSteps ?? {},
    suspicionUltraTech: saved.suspicionUltraTech ?? 0,
    guidanceDisabled: saved.guidanceDisabled ?? false,
    phase: PHASES.BOOT,
  };
}

export function useGameState() {
  const saved = loadGame();
  const [state, dispatch] = useReducer(
    gameReducer,
    saved ? mergeSavedState(saved) : createInitialState()
  );

  useEffect(() => {
    if (state.phase === PHASES.BOOT) {
      const timer = setTimeout(() => {
        dispatch({ type: 'SET_PHASE', phase: PHASES.LOGIN });
      }, 2800);
      return () => clearTimeout(timer);
    }
  }, [state.phase]);

  return { state, dispatch };
}
