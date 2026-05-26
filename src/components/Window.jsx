export default function Window({ title, children, x, y, width, height, active, onFocus, onClose }) {
  return (
    <div
      className={`os-window ${active ? 'active' : ''}`}
      style={{ left: x, top: y, width, height }}
      onMouseDown={onFocus}
    >
      <div className="os-window-titlebar">
        <span className="os-window-title">{title}</span>
        <button type="button" className="os-window-close" onClick={onClose} aria-label="Fermer">
          ×
        </button>
      </div>
      <div className="os-window-body">{children}</div>
    </div>
  );
}
