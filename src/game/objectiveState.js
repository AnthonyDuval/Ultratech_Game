/**
 * État objectif partagé — widget bureau (fallback compact)
 */

import { getMissionForFlag } from '../data/missions.js';
import { getObjectiveWidgetData } from './activeHelp.js';

export { getObjectiveWidgetData };

export { getCurrentGuidance, getActiveHelp, shouldSuppressDesktopNotifs } from './activeHelp.js';

export function getProgressNotification(flagName, state) {
  const mission = getMissionForFlag(flagName);
  if (!mission) return null;

  const flags = { ...state.narrativeFlags, [flagName]: true };
  const done = mission.steps.filter((s) => flags[s.flag]).length;
  const isComplete = done >= mission.steps.length;

  if (flagName.includes('scan') && !isComplete) {
    const nextStep = mission.steps.find((s) => !flags[s.flag]);
    const nextCmd = nextStep?.suggestedCommand;
    return {
      type: 'objective-updated',
      title: 'Analyse terminée',
      message: nextCmd ? `Nouvelle étape : ${nextCmd}` : `${mission.title} — consultez Opérations.`,
    };
  }

  if (flagName.startsWith('connect_') && isComplete) {
    const r = mission.rewards ?? {};
    return {
      type: 'mission-complete',
      title: 'Mission terminée',
      message: 'Récompenses reçues.',
      rewards: { bittek: r.bittek ?? 0, reputation: r.reputation ?? 0 },
    };
  }

  return null;
}
