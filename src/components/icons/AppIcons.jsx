/** Icônes SVG — style OS cyberpunk, taille bureau */

const props = {
  width: 72,
  height: 72,
  viewBox: '0 0 48 48',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

export function TerminalIcon(p) {
  return (
    <svg {...props} {...p}>
      <rect x="6" y="8" width="36" height="32" rx="2" />
      <polyline points="12 18 18 24 12 30" />
      <line x1="22" y1="30" x2="34" y2="30" />
    </svg>
  );
}

export function MissionsIcon(p) {
  return (
    <svg {...props} {...p}>
      <circle cx="24" cy="24" r="14" />
      <circle cx="24" cy="24" r="6" />
      <line x1="24" y1="10" x2="24" y2="16" />
      <line x1="24" y1="32" x2="24" y2="38" />
      <line x1="10" y1="24" x2="16" y2="24" />
      <line x1="32" y1="24" x2="38" y2="24" />
    </svg>
  );
}

export function MailIcon(p) {
  return (
    <svg {...props} {...p}>
      <rect x="6" y="12" width="36" height="24" rx="2" />
      <path d="M6 14L24 26L42 14" />
    </svg>
  );
}

export function ProfileIcon(p) {
  return (
    <svg {...props} {...p}>
      <circle cx="24" cy="18" r="8" />
      <path d="M10 40c0-8 6-14 14-14s14 6 14 14" />
    </svg>
  );
}

export const APP_ICONS = {
  terminal: TerminalIcon,
  missions: MissionsIcon,
  mail: MailIcon,
  profile: ProfileIcon,
};
