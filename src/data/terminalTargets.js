/**
 * Cibles terminal — scan, connect, decrypt
 * nodeId : enregistré dans discoveredNodes à la découverte
 */

export const SCAN_TARGETS = {
  '0x7f': {
    aliases: ['sector-0x7f', 'ghost', '0x7F'],
    nodeId: '0x7f',
    flag: 'scan_0x7f',
    requiresFlag: null,
    responses: [
      '[SCAN] Secteur 0x7F — signal fantôme',
      '[SCAN] Amplitude : 0.002 — non catalogué',
      '[SCAN] Fréquence : 440.2 THz',
      '[WARN] Protocole auto-efface actif',
    ],
  },
  'black-07': {
    aliases: ['black07', 'relay-07', 'relay07'],
    nodeId: 'black-07',
    flag: 'scan_black07',
    requiresFlag: null,
    responses: [
      '[SCAN] Cible : Black-07',
      '[SCAN] Statut : ACTIF — non autorisé',
      '[SCAN] Tunnel chiffré instable',
      '[SCAN] Fréquence : 880.4 THz',
      '[WARN] Relais non corporate — trace possible',
    ],
  },
};

export const CONNECT_TARGETS = {
  '0x7f': {
    aliases: ['sector-0x7f', 'ghost', '0x7F'],
    nodeId: '0x7f',
    flag: 'connect_0x7f',
    requiresFlag: 'scan_0x7f',
    responses: [
      '[CONNECT] Handshake secteur 0x7F...',
      '[CONNECT] Paquet fantôme capturé',
      '[OK] Signal stabilisé — données partielles extraites',
      '[WARN] UltraTech peut détecter cette connexion',
    ],
  },
  'black-07': {
    aliases: ['black07', 'relay-07'],
    nodeId: 'black-07',
    flag: 'connect_black07',
    requiresFlag: 'scan_black07',
    responses: [
      '[CONNECT] Handshake Black-07...',
      '[CONNECT] Clé de secours acceptée',
      '[OK] Tunnel instable — session ouverte',
      '[WARN] UltraTech peut détecter cette connexion',
    ],
  },
};

export const DECRYPT_TARGETS = {
  archive_2077: {
    aliases: ['archive-2077', 'archive2077'],
    nodeId: 'archive-2077',
    flag: 'decrypt_archive2077',
    requiresFlag: null,
    responses: [
      '[DECRYPT] Protocole EFFACE-ALPHA — compatible',
      '[DECRYPT] Extraction en cours...',
      '[DECRYPT] Coordonnées : Archive Sector 12 / Baie 7',
      '[DECRYPT] Code accès : EFFACE-ALPHA-77',
      '[DECRYPT] "...NOVA n\'est pas un protocole. C\'est un nom."',
    ],
  },
};

function normalizeKey(arg) {
  return arg.toLowerCase().trim().replace(/\s+/g, '-');
}

export function resolveScanTarget(arg) {
  const key = normalizeKey(arg);
  for (const [id, cfg] of Object.entries(SCAN_TARGETS)) {
    if (id === key || cfg.aliases?.includes(key)) return { id, cfg };
  }
  return null;
}

export function resolveConnectTarget(arg) {
  const key = normalizeKey(arg);
  for (const [id, cfg] of Object.entries(CONNECT_TARGETS)) {
    if (id === key || cfg.aliases?.includes(key)) return { id, cfg };
  }
  return null;
}

export function resolveDecryptTarget(arg) {
  const key = arg.toLowerCase().trim().replace(/\s+/g, '_');
  for (const [id, cfg] of Object.entries(DECRYPT_TARGETS)) {
    if (id === key || cfg.aliases?.includes(key)) return { id, cfg };
  }
  return null;
}
