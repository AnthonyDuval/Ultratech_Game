const SAVE_KEY = 'ultratech-os-save';
const SAVE_VERSION = 1;
const MAX_TERMINAL_LOGS = 50;

const PERSIST_FIELDS = [
  'username',
  'bittek',
  'reputation',
  'corruption',
  'suspicionUltraTech',
  'completedMissions',
  'discoveredMissions',
  'unlockedMails',
  'readMails',
  'narrativeFlags',
  'discoveredNodes',
  'discoveredClues',
  'missionSteps',
  'terminalLogs',
  'tutorialCompleted',
  'guidanceDisabled',
  'lastSave',
];

export function extractSaveData(state) {
  const data = { saveVersion: SAVE_VERSION };
  for (const field of PERSIST_FIELDS) {
    if (state[field] !== undefined) data[field] = state[field];
  }
  if (Array.isArray(data.terminalLogs) && data.terminalLogs.length > MAX_TERMINAL_LOGS) {
    data.terminalLogs = data.terminalLogs.slice(-MAX_TERMINAL_LOGS);
  }
  data.lastSave = new Date().toISOString();
  return data;
}

export function saveGame(stateOrData) {
  try {
    const data = stateOrData?.phase !== undefined
      ? extractSaveData(stateOrData)
      : stateOrData;
    const json = JSON.stringify(data);
    if (json === saveGame._last) return true;
    saveGame._last = json;
    localStorage.setItem(SAVE_KEY, json);
    return true;
  } catch {
    return false;
  }
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

function asNumber(value, fallback = 0) {
  return typeof value === 'number' && !Number.isNaN(value) ? value : fallback;
}

function asString(value, fallback = '') {
  return typeof value === 'string' ? value : fallback;
}

/** Valide et nettoie une sauvegarde — retourne null si irrécupérable */
export function sanitizeSave(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const logs = asArray(raw.terminalLogs).filter((l) => typeof l === 'string');

  return {
    username: asString(raw.username),
    bittek: asNumber(raw.bittek, 100),
    reputation: asNumber(raw.reputation, 0),
    corruption: asNumber(raw.corruption, 0),
    suspicionUltraTech: asNumber(raw.suspicionUltraTech, 0),
    completedMissions: asArray(raw.completedMissions),
    discoveredMissions: asArray(raw.discoveredMissions),
    unlockedMails: asArray(raw.unlockedMails),
    readMails: asArray(raw.readMails),
    narrativeFlags: asObject(raw.narrativeFlags),
    discoveredNodes: asArray(raw.discoveredNodes),
    discoveredClues: asArray(raw.discoveredClues),
    missionSteps: asObject(raw.missionSteps),
    terminalLogs: logs.slice(-MAX_TERMINAL_LOGS),
    tutorialCompleted: Boolean(raw.tutorialCompleted),
    guidanceDisabled: Boolean(raw.guidanceDisabled),
    lastSave: asString(raw.lastSave) || null,
  };
}

export function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const sanitized = sanitizeSave(parsed);
    if (!sanitized) {
      localStorage.removeItem(SAVE_KEY);
      return null;
    }
    return sanitized;
  } catch {
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch {
      /* ignore */
    }
    return null;
  }
}

export function resetSave() {
  localStorage.removeItem(SAVE_KEY);
  saveGame._last = null;
}

export function hasSave() {
  return localStorage.getItem(SAVE_KEY) !== null;
}

/** @deprecated Préférer useAutoSave */
export function autoSave(state, delayMs = 1200) {
  clearTimeout(autoSave._timer);
  autoSave._timer = setTimeout(() => saveGame(state), delayMs);
}
