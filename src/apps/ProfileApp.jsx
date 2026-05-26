import { memo, useMemo, useRef, useState } from 'react';
import { MISSIONS } from '../data/missions.js';
import { getReputationLabel } from '../utils/gameHelpers.js';
import { resetSave } from '../utils/saveSystem.js';
import { exportSaveToFile, importSaveFromFile } from '../utils/saveExport.js';
import { GAME_VERSION } from '../config/version.js';
import { getRelayChoiceLabel } from '../data/narrativeChoices.js';
import BugReportModal from '../components/BugReportModal.jsx';

const RESET_MSG = 'Cette action supprimera toute progression locale et rechargera le jeu depuis zéro.';

const ProfileApp = memo(function ProfileApp({ state }) {
  const rank = getReputationLabel(state.reputation);
  const relayChoice = getRelayChoiceLabel(state.choices);
  const profileNote = state.narrativeFlags?.profileNote;
  const fileInputRef = useRef(null);
  const [importError, setImportError] = useState(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [bugReportOpen, setBugReportOpen] = useState(false);

  const knownMissions = useMemo(
    () => MISSIONS.filter(
      (m) => state.discoveredMissions?.includes(m.id) || state.completedMissions.includes(m.id)
    ),
    [state.discoveredMissions, state.completedMissions]
  );

  const alignmentLabel = useMemo(() => {
    switch (state.factionAlignment) {
      case 'ultratech': return 'Corporate';
      case 'nova': return 'Underground';
      case 'rogue': return 'Fantôme';
      default: return 'Neutre';
    }
  }, [state.factionAlignment]);

  const handleReset = () => {
    if (window.confirm(`${RESET_MSG}\n\nConfirmer la réinitialisation ?`)) {
      resetSave();
      window.location.reload();
    }
  };

  const handleExport = () => {
    exportSaveToFile(state);
  };

  const handleImportClick = () => {
    setImportError(null);
    setImportSuccess(false);
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    try {
      await importSaveFromFile(file);
      setImportSuccess(true);
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      setImportError(err.message ?? 'Import impossible.');
      setImportSuccess(false);
    }
  };

  return (
    <div className="profile-app">
      <div className="profile-header">
        <div className="profile-avatar">◈</div>
        <div>
          <div className="profile-name">{state.username}</div>
          <div className="profile-rank">{rank}</div>
          <div className="profile-version">ULTRATECH OS v{GAME_VERSION}</div>
        </div>
      </div>

      <div className="profile-stats">
        <div className="profile-stat">
          <label>BitTek</label>
          <span>{state.bittek} ₮</span>
        </div>
        <div className="profile-stat">
          <label>Réputation</label>
          <span>{state.reputation}</span>
        </div>
        <div className="profile-stat">
          <label>Corruption</label>
          <span>{state.corruption}%</span>
        </div>
        <div className="profile-stat">
          <label>Surveillance</label>
          <span className={state.suspicionUltraTech > 30 ? 'stat-alert' : ''}>
            {state.suspicionUltraTech ?? 0}%
          </span>
        </div>
        <div className="profile-stat">
          <label>Confiance UltraTech</label>
          <span>{state.trustUltraTech ?? 50}%</span>
        </div>
        <div className="profile-stat">
          <label>Confiance NOVA</label>
          <span>{state.trustNova ?? 30}%</span>
        </div>
        <div className="profile-stat">
          <label>Alignement</label>
          <span className="profile-alignment">{alignmentLabel}</span>
        </div>
      </div>

      {(relayChoice || profileNote) && (
        <section className="profile-dossier">
          <strong>Dossier narratif</strong>
          {relayChoice && (
            <p className="profile-dossier-choice">
              <span className="profile-dossier-tag">black-07</span>
              {relayChoice}
            </p>
          )}
          {profileNote && (
            <p className="profile-dossier-note">{profileNote}</p>
          )}
        </section>
      )}

      <div className="profile-missions">
        <strong>Opérations connues</strong>
        {knownMissions.length === 0 ? (
          <p className="profile-empty">Aucune opération découverte.</p>
        ) : (
          <ul>
            {knownMissions.map((m) => (
              <li key={m.id} className={state.completedMissions.includes(m.id) ? 'done' : ''}>
                {state.completedMissions.includes(m.id) ? '[OK]' : '[→]'} {m.title}
              </li>
            ))}
          </ul>
        )}
      </div>

      <section className="profile-settings">
        <strong className="profile-settings-title">Paramètres bêta</strong>
        <p className="profile-settings-hint">
          Exportez votre sauvegarde pour la partager, ou importez une progression existante.
        </p>

        <div className="profile-settings-actions">
          <button type="button" className="btn btn-primary" onClick={handleExport}>
            Exporter la sauvegarde
          </button>
          <button type="button" className="btn" onClick={handleImportClick}>
            Importer une sauvegarde
          </button>
          <button type="button" className="btn profile-btn-danger" onClick={handleReset}>
            Réinitialiser la progression
          </button>
          <button type="button" className="btn" onClick={() => setBugReportOpen(true)}>
            Signaler un bug
          </button>
        </div>

        {importError && <p className="profile-import-error">{importError}</p>}
        {importSuccess && <p className="profile-import-success">Import réussi — rechargement…</p>}

        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={handleImportFile}
        />
      </section>

      {bugReportOpen && (
        <BugReportModal state={state} onClose={() => setBugReportOpen(false)} />
      )}
    </div>
  );
});

export default ProfileApp;
