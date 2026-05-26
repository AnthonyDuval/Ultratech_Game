import { useEffect, useRef } from 'react';
import { canTriggerAnonScanHelp, ANON_SCAN_MAIL_ID } from '../game/missionGuards.js';

/** Débloque le mail anonyme scan après 6–10 s (une seule fois) */
export function useAnonScanHelp(state, dispatch, onNotify) {
  const triggeredRef = useRef(false);

  useEffect(() => {
    if (triggeredRef.current) return undefined;
    if (!canTriggerAnonScanHelp(state)) return undefined;

    const delay = 6000 + Math.floor(Math.random() * 4000);
    const timer = setTimeout(() => {
      if (triggeredRef.current) return;
      triggeredRef.current = true;

      dispatch({ type: 'UNLOCK_MAILS', mailIds: [ANON_SCAN_MAIL_ID] });
      dispatch({ type: 'SET_NARRATIVE_FLAG', flag: 'anonymousScanMailSent', value: true });
      onNotify?.({
        type: 'mail-received',
        title: 'Nouveau message',
        message: 'Nouveau message anonyme reçu.',
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [
    state.readMails,
    state.unlockedMails,
    state.completedMissions,
    state.narrativeFlags,
    dispatch,
    onNotify,
  ]);
}
