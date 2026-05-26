import { memo } from 'react';

const ChoiceModal = memo(function ChoiceModal({ event, onSelect, onClose }) {
  if (!event) return null;

  return (
    <div className="choice-overlay" role="dialog" aria-modal="true" aria-labelledby="choice-title">
      <div className="choice-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="choice-panel">
        <span className="choice-badge">DÉCISION REQUISE</span>
        <h2 id="choice-title" className="choice-title">{event.title}</h2>
        <p className="choice-prompt">{event.prompt}</p>

        <div className="choice-options">
          {event.options.map((opt, i) => (
            <button
              key={opt.id}
              type="button"
              className="choice-option"
              onClick={() => onSelect(opt.id)}
            >
              <span className="choice-option-key">{String.fromCharCode(65 + i)}</span>
              <span className="choice-option-text">
                <strong>{opt.label}</strong>
                <span className="choice-option-desc">{opt.description}</span>
              </span>
            </button>
          ))}
        </div>

        <p className="choice-warning">Cette action est irréversible.</p>
      </div>
    </div>
  );
});

export default ChoiceModal;
