import { formatSystemTime } from '../utils/time.js';
import { GAME_VERSION } from '../config/version.js';

export default function TopBar({ username, bittek, reputation, corruption, suspicion }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="topbar-logo">ULTRATECH OS</span>
        <span className="topbar-version">v{GAME_VERSION}</span>
        <span className="topbar-sep">|</span>
        <span className="topbar-user">{username || 'operateur'}</span>
      </div>

      <div className="topbar-network" aria-hidden="true">
        <span className="topbar-network-dot" />
        <span>ULTRATECH ONLINE — CONNEXION SÉCURISÉE</span>
      </div>

      <div className="topbar-stats">
        <span className="stat-bittek">{bittek} ₮</span>
        <span className="stat-rep">REP {reputation}</span>
        <span className="stat-corruption">COR {corruption}%</span>
        <span className={`stat-suspicion ${suspicion > 30 ? 'alert' : ''}`}>
          SURV {suspicion}%
        </span>
      </div>

      <div className="topbar-time">{formatSystemTime()}</div>
    </header>
  );
}
