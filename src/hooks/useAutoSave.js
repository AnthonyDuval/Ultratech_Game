import { useEffect, useMemo, useRef } from 'react';
import { extractSaveData, saveGame } from '../utils/saveSystem.js';

function serializeDeps(state) {
  return [
    state.username,
    state.bittek,
    state.reputation,
    state.corruption,
    state.suspicionUltraTech,
    state.tutorialCompleted,
    state.guidanceDisabled,
    JSON.stringify(state.completedMissions),
    JSON.stringify(state.discoveredMissions),
    JSON.stringify(state.unlockedMails),
    JSON.stringify(state.readMails),
    JSON.stringify(state.narrativeFlags),
    JSON.stringify(state.discoveredNodes),
    JSON.stringify(state.discoveredClues),
    JSON.stringify(state.missionSteps),
    JSON.stringify(state.terminalLogs),
    JSON.stringify(state.choices),
    state.factionAlignment,
    state.trustUltraTech,
    state.trustNova,
  ];
}

/** Sauvegarde debouncée 400 ms — n'écrit que si le snapshot a changé */
export function useAutoSave(state, delayMs = 400) {
  const saveData = useMemo(() => extractSaveData(state), serializeDeps(state));
  const snapshot = useMemo(() => JSON.stringify(saveData), [saveData]);
  const lastSavedRef = useRef(snapshot);

  useEffect(() => {
    if (snapshot === lastSavedRef.current) return undefined;

    const timer = setTimeout(() => {
      if (saveGame(saveData)) {
        lastSavedRef.current = snapshot;
      }
    }, delayMs);

    return () => clearTimeout(timer);
  }, [snapshot, saveData, delayMs]);
}
