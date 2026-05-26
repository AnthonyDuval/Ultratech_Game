import { MAILS } from '../data/mails.js';

export function getDefaultUnlockedMailIds() {
  return MAILS.filter((m) => m.unlockedByDefault).map((m) => m.id);
}

export function getReputationLabel(reputation) {
  if (reputation >= 50) return 'Opérateur Elite';
  if (reputation >= 25) return 'Runner Confirmé';
  if (reputation >= 10) return 'Contractuel';
  return 'Novice';
}
