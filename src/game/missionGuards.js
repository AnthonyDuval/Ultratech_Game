/** Guards partagés — éviter les hints obsolètes après complétion mission */

const ANON_SCAN_MAIL_ID = 'mail-anonymous-scan';
const LEGACY_ANON_MAIL_ID = 'mail-anon-scan-help';

export function isGhostSignalDone(completed = []) {
  return completed.includes('ghost-signal');
}

export function isBlackRelayDone(completed = []) {
  return completed.includes('black-relay');
}

export function hasAnonScanMailSent(flags = {}) {
  return Boolean(flags.anonymousScanMailSent || flags.anon_scan_help_sent);
}

export function hasAnonScanHelp(state) {
  const unlocked = state.unlockedMails ?? [];
  const read = state.readMails ?? [];
  return [ANON_SCAN_MAIL_ID, LEGACY_ANON_MAIL_ID].some(
    (id) => unlocked.includes(id) || read.includes(id)
  );
}

export function shouldRevealScanCommand(state, openApps = []) {
  if (hasAnonScanHelp(state)) return true;
  return openApps.includes('terminal') || openApps.includes('missions');
}

export function canTriggerAnonScanHelp(state) {
  const read = state.readMails ?? [];
  const unlocked = state.unlockedMails ?? [];
  const flags = state.narrativeFlags ?? {};
  const completed = state.completedMissions ?? [];

  const briefingRead = read.includes('mail-welcome') || read.includes('mail-ghost-brief');
  if (!briefingRead) return false;
  if (completed.includes('ghost-signal')) return false;
  if (flags.scan_0x7f) return false;
  if (hasAnonScanMailSent(flags)) return false;
  if (unlocked.includes(ANON_SCAN_MAIL_ID) || unlocked.includes(LEGACY_ANON_MAIL_ID)) return false;

  return true;
}

export { ANON_SCAN_MAIL_ID };
