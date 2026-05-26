import { useEffect, useRef } from 'react';
import {
  STUCK_THRESHOLD_MS,
  STUCK_CHECK_MS,
  shouldMonitorStuck,
  getProgressFingerprint,
} from '../game/stuckTimer.js';
import { buildNovaStuckHelp } from '../game/novaHints.js';

/** Surveille l'inactivité et déclenche une aide NOVA discrète */
export function useStuckTimer(state, dispatch, onHelpUpdate) {
  const fingerprintRef = useRef(getProgressFingerprint(state));
  const stuckTriggeredRef = useRef(false);

  useEffect(() => {
    const fp = getProgressFingerprint(state);
    if (fp !== fingerprintRef.current) {
      fingerprintRef.current = fp;
      stuckTriggeredRef.current = false;
      if (state.narrativeFlags?.stuck_hint_active) {
        dispatch({ type: 'SET_NARRATIVE_FLAG', flag: 'stuck_hint_active', value: false });
      }
    }
  }, [state, dispatch]);

  useEffect(() => {
    if (!shouldMonitorStuck(state)) return undefined;

    const interval = setInterval(() => {
      if (stuckTriggeredRef.current) return;
      if (state.narrativeFlags?.stuck_hint_active) return;

      const lastAt = state.narrativeFlags?.last_progress_at;
      if (!lastAt) return;

      const elapsed = Date.now() - new Date(lastAt).getTime();
      if (elapsed < STUCK_THRESHOLD_MS) return;

      stuckTriggeredRef.current = true;
      dispatch({ type: 'SET_NARRATIVE_FLAG', flag: 'stuck_hint_active', value: true });

      const help = buildNovaStuckHelp(state);
      onHelpUpdate?.({
        type: 'nova-whisper',
        title: 'NOVA',
        message: help.message,
      });
    }, STUCK_CHECK_MS);

    return () => clearInterval(interval);
  }, [
    state.tutorialCompleted,
    state.completedMissions,
    state.discoveredMissions,
    state.narrativeFlags,
    state.readMails,
    dispatch,
    onHelpUpdate,
  ]);
}
