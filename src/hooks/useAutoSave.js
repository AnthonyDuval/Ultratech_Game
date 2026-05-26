/** Sauvegarde debouncée — n'écrit que si le snapshot a changé */

import { useEffect, useMemo, useRef } from 'react';
import { extractSaveData, saveGame } from '../utils/saveSystem.js';

const SAVE_DELAY_MS = 1500;

function serializeDeps(state) {
  return [
    state.username,
    state.bittek,
    state.reputation,
    state.corruption,
    state.suspicionUltraTech,
    state.tutorialCompleted,
    state.guidanceDisabled,
    state.factionAlignment,
    state.trustUltraTech,
    state.trustNova,
    JSON.stringify(state.completedMissions),
    JSON.stringify(state.discoveredMissions),
    JSON.stringify(state.unlockedMails),
    JSON.stringify(state.readMails),
    JSON.stringify(state.narrativeFlags),
    JSON.stringify(state.discoveredNodes),
    JSON.stringify(state.discoveredClues),
    JSON.stringify(state.missionSteps),
    JSON.stringify(state.choices),
  ];
}

export function useAutoSave(state, delayMs = SAVE_DELAY_MS) {
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
