/**
 * État objectif partagé — widget bureau
 */

import {
  getMissionById,
  getPrimaryActiveMission,
  getCurrentStep,
  getSuggestedCommand,
  getNextStepText,
  getCurrentObjective,
  isGuidedMission,
  getMissionForFlag,
} from '../data/missions.js';
import { isMailUnlocked } from '../data/mails.js';
import {
  isGhostSignalDone,
  isBlackRelayDone,
  hasAnonScanHelp,
  shouldRevealScanCommand,
} from './missionGuards.js';

const APP_LABELS = {
  mail: 'Mails',
  missions: 'Opérations',
  terminal: 'Terminal',
};

export function getObjectiveWidgetData(state, ui = {}) {
  if (!state.tutorialCompleted) return null;

  const openApps = ui.openApps ?? [];
  const selectedMailId = ui.selectedMailId ?? null;
  const has = (app) => openApps.includes(app);
  const read = state.readMails ?? [];
  const discovered = state.discoveredMissions ?? [];
  const completed = state.completedMissions ?? [];
  const flags = state.narrativeFlags ?? {};

  if (!read.includes('mail-welcome')) {
    return widget({
      id: 'welcome',
      action: 'Ouvrez Mails et lisez le briefing de bienvenue.',
      app: has('mail') ? null : 'mail',
      appLabel: 'Mails',
    });
  }

  if (!read.includes('mail-ghost-brief')) {
    if (!has('mail')) {
      return widget({ id: 'ghost-mail', action: 'Lisez le brief « Signal fantôme détecté ».', app: 'mail', appLabel: 'Mails' });
    }
    if (isMailUnlocked('mail-ghost-brief', state.unlockedMails ?? []) && selectedMailId !== 'mail-ghost-brief') {
      return widget({ id: 'select-ghost', action: 'Sélectionnez le brief Signal fantôme.', app: 'mail', appLabel: 'Mails' });
    }
    return widget({ id: 'read-ghost', action: 'Lisez le brief — notez cible et protocole.' });
  }

  // ── Mission 1 terminée : ignorer totalement ghost-signal ──
  if (isGhostSignalDone(completed)) {
    return widgetAfterGhostSignal(state, ui);
  }

  if (discovered.includes('ghost-signal')) {
    return widgetFromMission(getMissionById('ghost-signal'), state, flags, openApps);
  }

  return widget({ id: 'wait-ops', action: 'Consultez Opérations pour valider la mission.', app: 'missions', appLabel: 'Opérations' });
}

function widgetAfterGhostSignal(state, ui) {
  const read = state.readMails ?? [];
  const completed = state.completedMissions ?? [];
  const discovered = state.discoveredMissions ?? [];
  const has = (app) => (ui.openApps ?? []).includes(app);

  if (!read.includes('mail-relay-hint')) {
    return widget({
      id: 'relay-mail',
      action: 'Lisez le fragment Black-07 dans Mails.',
      app: has('mail') ? null : 'mail',
      appLabel: 'Mails',
    });
  }

  if (isBlackRelayDone(completed)) {
    const active = getPrimaryActiveMission(discovered, completed);
    if (active) return widgetFromMission(active, state, state.narrativeFlags ?? {}, ui.openApps ?? []);
    return widget({ id: 'idle', action: 'Consultez vos nouveaux messages.' });
  }

  if (discovered.includes('black-relay')) {
    return widgetFromMission(getMissionById('black-relay'), state, state.narrativeFlags ?? {}, ui.openApps ?? []);
  }

  return widget({ id: 'post-ghost', action: 'Consultez vos nouveaux messages.' });
}

function widgetFromMission(mission, state, flags, openApps) {
  if (!mission) return null;

  if (mission.id === 'ghost-signal' && isGhostSignalDone(state.completedMissions)) return null;
  if (mission.id === 'black-relay' && isBlackRelayDone(state.completedMissions)) return null;

  const step = getCurrentStep(mission, flags);
  if (!step) return null;

  const guided = isGuidedMission(mission);
  const hasOps = openApps.includes('missions');
  const hasTerm = openApps.includes('terminal');
  const isConnect = step.flag.startsWith('connect');
  const isScanStep = step.flag.includes('scan');

  let canShowCommand = false;
  if (guided && mission.id === 'ghost-signal' && isScanStep && !flags.scan_0x7f) {
    canShowCommand = shouldRevealScanCommand(state, openApps);
  } else if (guided) {
    canShowCommand = hasOps || hasTerm || hasAnonScanHelp(state);
  }

  const command = canShowCommand ? getSuggestedCommand(mission, flags) : undefined;

  let action = getNextStepText(mission, flags) ?? getCurrentObjective(mission, flags);
  let app = null;

  if (mission.id === 'ghost-signal' && isScanStep && !flags.scan_0x7f) {
    action = hasAnonScanHelp(state)
      ? 'Un contact anonyme a confirmé la commande à taper.'
      : 'Analyser la cible 0x7f dans le Terminal.';
    if (!hasTerm) app = 'terminal';
  } else if (flags.scan_0x7f && step.flag === 'connect_0x7f') {
    action = 'Connexion contrôlée vers 0x7f';
    if (!hasTerm) app = 'terminal';
  } else if (hasOps && !hasTerm && !isConnect) {
    action = 'Ouvrir le Terminal';
    app = 'terminal';
  } else if (!hasOps && !hasTerm) {
    app = 'missions';
  } else if (!hasTerm && !isConnect) {
    app = 'terminal';
  }

  return widget({
    id: `${mission.id}-${step.flag}-${flags.scan_0x7f ? '1' : '0'}`,
    action,
    target: step.target,
    protocol: step.protocol,
    command,
    showCommand: canShowCommand && Boolean(command),
    app,
    appLabel: app ? APP_LABELS[app] : undefined,
    missionTitle: mission.title,
  });
}

function widget(fields) {
  return { label: 'Objectif actuel', ...fields };
}

export { getCurrentGuidance } from './guidance.js';

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
