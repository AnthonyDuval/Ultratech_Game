import { extractSaveData, sanitizeSave, saveGame } from './saveSystem.js';
import { GAME_VERSION } from '../config/version.js';

export function getSaveFilename() {
  return `ultratech-save-v${GAME_VERSION}.json`;
}

/** Valide qu'un objet ressemble à une sauvegarde UltraTech */
export function validateImportData(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, error: 'Fichier invalide : ce n\'est pas une sauvegarde UltraTech OS.' };
  }

  const hasGameFields = 'username' in raw
    || 'completedMissions' in raw
    || 'bittek' in raw
    || 'narrativeFlags' in raw
    || raw.saveVersion !== undefined;

  if (!hasGameFields) {
    return { ok: false, error: 'Fichier invalide : aucune donnée de progression reconnue.' };
  }

  const sanitized = sanitizeSave(raw);
  if (!sanitized) {
    return { ok: false, error: 'Fichier corrompu : impossible de restaurer la sauvegarde.' };
  }

  return { ok: true, data: sanitized };
}

export function exportSaveToFile(state) {
  const data = extractSaveData(state);
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = getSaveFilename();
  link.click();
  URL.revokeObjectURL(url);
}

export function importSaveFromFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('Aucun fichier sélectionné.'));
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        const result = validateImportData(parsed);
        if (!result.ok) {
          reject(new Error(result.error));
          return;
        }
        saveGame(result.data);
        resolve(result.data);
      } catch {
        reject(new Error('Fichier JSON illisible ou corrompu.'));
      }
    };

    reader.onerror = () => reject(new Error('Impossible de lire le fichier.'));
    reader.readAsText(file);
  });
}
