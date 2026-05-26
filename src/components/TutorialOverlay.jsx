import { useState } from 'react';
import { TUTORIAL_STEPS } from '../data/tutorial.js';

export default function TutorialOverlay({ dispatch }) {
  const [stepIndex, setStepIndex] = useState(0);
  const step = TUTORIAL_STEPS[stepIndex];
  const isLast = stepIndex >= TUTORIAL_STEPS.length - 1;

  const finish = () => {
    dispatch({ type: 'COMPLETE_TUTORIAL' });
  };

  const handleNext = () => {
    if (isLast) {
      finish();
    } else {
      setStepIndex((i) => i + 1);
    }
  };

  return (
    <div className="tutorial-overlay" role="dialog" aria-modal="true" aria-labelledby="tutorial-title">
      <div className="tutorial-backdrop" onClick={finish} aria-hidden="true" />
      <div className="tutorial-panel">
        <div className="tutorial-header">
          <span className="tutorial-badge">GUIDE OPÉRATEUR</span>
          <span className="tutorial-step">
            {stepIndex + 1} / {TUTORIAL_STEPS.length}
          </span>
        </div>

        <h2 id="tutorial-title" className="tutorial-title">{step.title}</h2>
        <p className="tutorial-body">{step.body}</p>

        <div className="tutorial-progress">
          {TUTORIAL_STEPS.map((s, i) => (
            <span
              key={s.id}
              className={`tutorial-dot ${i === stepIndex ? 'active' : ''} ${i < stepIndex ? 'done' : ''}`}
            />
          ))}
        </div>

        <div className="tutorial-actions">
          <button type="button" className="btn tutorial-btn-skip" onClick={finish}>
            Passer
          </button>
          <div className="tutorial-actions-right">
            {!isLast && (
              <button type="button" className="btn tutorial-btn-next" onClick={handleNext}>
                Suivant
              </button>
            )}
            {isLast && (
              <button type="button" className="btn btn-primary tutorial-btn-finish" onClick={finish}>
                Terminer
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
