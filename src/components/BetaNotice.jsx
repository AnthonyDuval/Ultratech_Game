import { GAME_VERSION } from '../config/version.js';

const BETA_NOTICE_KEY = 'ultratech-beta-notice-seen';

export function hasSeenBetaNotice() {
  try {
    return localStorage.getItem(BETA_NOTICE_KEY) === '1';
  } catch {
    return false;
  }
}

export function markBetaNoticeSeen() {
  try {
    localStorage.setItem(BETA_NOTICE_KEY, '1');
  } catch {
    /* ignore */
  }
}

export default function BetaNotice({ onDismiss }) {
  const handleDismiss = () => {
    markBetaNoticeSeen();
    onDismiss?.();
  };

  return (
    <div className="beta-notice-overlay" role="dialog" aria-modal="true" aria-labelledby="beta-notice-title">
      <div className="beta-notice-backdrop" onClick={handleDismiss} aria-hidden="true" />
      <div className="beta-notice-panel">
        <span className="beta-notice-badge">BÊTA {GAME_VERSION}</span>
        <h2 id="beta-notice-title" className="beta-notice-title">Version bêta locale</h2>
        <p className="beta-notice-body">
          Ce jeu est en test. Vos retours sur les bugs, la lisibilité et la compréhension
          des missions sont précieux.
        </p>
        <p className="beta-notice-hint">
          Utilisez Profil → « Reporter un bug » pour envoyer un rapport copiable sur Discord.
        </p>
        <button type="button" className="btn btn-primary beta-notice-btn" onClick={handleDismiss}>
          Compris
        </button>
      </div>
    </div>
  );
}
