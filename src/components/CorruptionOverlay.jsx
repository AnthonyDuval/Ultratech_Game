/** Overlay glitch — intensité liée à corruption / surveillance UltraTech */
export default function CorruptionOverlay({ corruption, suspicion }) {
  const intensity = Math.max(corruption, suspicion) / 100;
  if (intensity < 0.15) return null;

  const level = intensity > 0.5 ? 'high' : intensity > 0.3 ? 'medium' : 'low';

  return (
    <div
      className={`corruption-overlay corruption-overlay--${level}`}
      aria-hidden="true"
      style={{ '--glitch-intensity': intensity }}
    />
  );
}
