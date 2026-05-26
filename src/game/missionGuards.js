/** Guards partagés — éviter les hints obsolètes après complétion mission */

export function isGhostSignalDone(completed = []) {
  return completed.includes('ghost-signal');
}

export function isBlackRelayDone(completed = []) {
  return completed.includes('black-relay');
}

export function hasAnonScanHelp(state) {
  const unlocked = state.unlockedMails ?? [];
  const read = state.readMails ?? [];
  return unlocked.includes('mail-anon-scan-help') || read.includes('mail-anon-scan-help');
}

export function shouldRevealScanCommand(state, openApps = []) {
  if (hasAnonScanHelp(state)) return true;
  return openApps.includes('terminal') || openApps.includes('missions');
}

export function canTriggerAnonScanHelp(state) {
  if (!state.tutorialCompleted) return false;
  if (!state.readMails?.includes('mail-welcome')) return false;

  const unlocked = state.unlockedMails ?? [];
  const read = state.readMails ?? [];
  const flags = state.narrativeFlags ?? {};
  const completed = state.completedMissions ?? [];

  const ghostBriefReady = read.includes('mail-ghost-brief')
    || unlocked.includes('mail-ghost-brief');

  if (!ghostBriefReady) return false;
  if (completed.includes('ghost-signal')) return false;
  if (flags.scan_0x7f) return false;
  if (flags.anon_scan_help_sent) return false;
  if (unlocked.includes('mail-anon-scan-help')) return false;

  return true;
}
