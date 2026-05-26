import { useEffect, useRef } from 'react';
import { canTriggerAnonScanHelp } from '../game/missionGuards.js';

const ANON_MAIL_ID = 'mail-anon-scan-help';

/** Débloque le mail anonyme scan après 6–10 s (une seule fois) */
export function useAnonScanHelp(state, dispatch, onNotify) {
  const triggeredRef = useRef(false);

  useEffect(() => {
    if (triggeredRef.current) return undefined;
    if (state.narrativeFlags?.anon_scan_help_sent) return undefined;
    if (!canTriggerAnonScanHelp(state)) return undefined;

    const delay = 6000 + Math.floor(Math.random() * 4000);
    const timer = setTimeout(() => {
      if (triggeredRef.current) return;
      triggeredRef.current = true;

      dispatch({ type: 'UNLOCK_MAILS', mailIds: [ANON_MAIL_ID] });
      dispatch({ type: 'SET_NARRATIVE_FLAG', flag: 'anon_scan_help_sent', value: true });
      onNotify?.({
        type: 'mail-received',
        title: 'Nouveau message',
        message: 'Nouveau message anonyme reçu.',
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [
    state.tutorialCompleted,
    state.readMails,
    state.unlockedMails,
    state.completedMissions,
    state.narrativeFlags,
    dispatch,
    onNotify,
  ]);
}
