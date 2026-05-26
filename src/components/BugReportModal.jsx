import { useMemo, useState, useCallback } from 'react';
import { buildBugReport } from '../utils/bugReport.js';

export default function BugReportModal({ state, onClose }) {
  const report = useMemo(() => buildBugReport(state), [state]);
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }, [report]);

  return (
    <div className="bug-report-overlay" role="dialog" aria-modal="true" aria-labelledby="bug-report-title">
      <div className="bug-report-backdrop" onClick={onClose} aria-hidden="true" />
      <div className="bug-report-panel">
        <header className="bug-report-header">
          <h2 id="bug-report-title">Reporter un bug</h2>
          <p className="bug-report-subtitle">
            Copiez ce rapport et collez-le sur Discord pour aider au débogage.
          </p>
        </header>

        <textarea
          className="bug-report-text"
          readOnly
          value={report}
          aria-label="Rapport de bug"
        />

        <div className="bug-report-actions">
          <button type="button" className="btn btn-primary" onClick={handleCopy}>
            {copied ? 'Rapport copié !' : 'Copier le rapport'}
          </button>
          <button type="button" className="btn" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
