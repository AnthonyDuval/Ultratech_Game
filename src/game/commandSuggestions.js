/**
 * Suggestions de correction pour commandes terminal
 */

const TYPO_MAP = {
  scna: 'scan',
  scann: 'scan',
  scane: 'scan',
  conect: 'connect',
  connec: 'connect',
  connet: 'connect',
  hep: 'help',
  hlep: 'help',
  halp: 'help',
  statu: 'status',
  stats: 'status',
  decypt: 'decrypt',
  decript: 'decrypt',
  trac: 'trace',
};

const KNOWN_COMMANDS = [
  'help', 'clear', 'status', 'scan', 'connect', 'decrypt', 'trace', 'logs',
  'objectif', 'hint', 'apps',
];

export function suggestCommandCorrection(rawCmd) {
  const trimmed = rawCmd.trim();
  if (!trimmed) return null;

  const parts = trimmed.split(/\s+/);
  const verb = parts[0].toLowerCase();

  if (KNOWN_COMMANDS.includes(verb)) return null;

  if (TYPO_MAP[verb]) {
    const rest = parts.slice(1).join(' ');
    const corrected = rest ? `${TYPO_MAP[verb]} ${rest}` : TYPO_MAP[verb];
    return corrected;
  }

  for (const known of KNOWN_COMMANDS) {
    if (levenshtein(verb, known) <= 2 && verb.length >= 3) {
      const rest = parts.slice(1).join(' ');
      return rest ? `${known} ${rest}` : known;
    }
  }

  return null;
}

/** Suggestion de cible si scan/connect raté en début de jeu */
export function suggestTargetCorrection(command, arg, state) {
  if (!arg) return null;
  const flags = state.narrativeFlags ?? {};
  const completed = state.completedMissions ?? [];

  if (command === 'scan' && !completed.includes('ghost-signal') && !flags.scan_0x7f) {
    if (arg.includes('7') || arg.includes('0x') || arg.includes('ghost')) {
      return 'scan 0x7f';
    }
  }

  if (command === 'connect' && flags.scan_0x7f && !flags.connect_0x7f) {
    if (arg.includes('7') || arg.includes('0x')) {
      return 'connect 0x7f';
    }
  }

  if (command === 'scan' && completed.includes('ghost-signal') && !flags.scan_black07) {
    if (arg.includes('black') || arg.includes('07') || arg.includes('relay')) {
      return 'scan black-07';
    }
  }

  if (command === 'connect' && flags.scan_black07 && !flags.connect_black07) {
    if (arg.includes('black') || arg.includes('07')) {
      return 'connect black-07';
    }
  }

  return null;
}

function levenshtein(a, b) {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}
