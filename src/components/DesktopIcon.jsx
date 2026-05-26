import { APP_ICONS } from './icons/AppIcons.jsx';

/**
 * Icône bureau — grande zone cliquable, ouverture au clic simple
 */
export default function DesktopIcon({ label, iconType, accent = 'cyan', onOpen }) {
  const Icon = APP_ICONS[iconType];

  return (
    <button
      type="button"
      className={`desktop-icon desktop-icon--${accent}`}
      onClick={onOpen}
      aria-label={`Ouvrir ${label}`}
    >
      <span className="desktop-icon-frame">
        {Icon && <Icon className="desktop-icon-svg" aria-hidden="true" />}
      </span>
      <span className="desktop-icon-label">{label}</span>
    </button>
  );
}
