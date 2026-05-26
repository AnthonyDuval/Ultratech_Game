import { useReducer, useEffect } from 'react';
import { loadGame } from '../utils/saveSystem.js';

export const PHASES = {
  BOOT: 'boot',
  LOGIN: 'login',
  DESKTOP: 'desktop',
};

/** État initial — champs compatibles avec anciennes sauvegardes */
export function createInitialState() {
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
    /** Nœuds repérés via scan/connect/decrypt */
    discoveredNodes: [],
    /** Indices textuels issus des mails lus */
    discoveredClues: [],
    /** Étapes complétées par mission : { 'ghost-signal': ['scan_0x7f', ...] } */
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

    case 'RESET_PROFILE':
      return { ...createInitialState(), phase: PHASES.BOOT };

    default:
      return state;
  }
}

function mergeSavedState(saved) {
  const base = createInitialState();
  return {
    ...base,
    ...saved,
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
