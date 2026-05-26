import { useMemo, useCallback, useState, memo } from 'react';
import { getCurrentGuidance } from '../game/guidance.js';

const GuidanceHint = memo(function GuidanceHint({
  state,
  dispatch,
  openApps,
  selectedMailId,
  onOpenApp,
  onInsertCommand,
}) {
  const hint = useMemo(
    () => getCurrentGuidance(state, { openApps, selectedMailId }),
    [
      state.guidanceDisabled,
      state.tutorialCompleted,
      state.readMails,
      state.unlockedMails,
      state.discoveredMissions,
      state.completedMissions,
      state.narrativeFlags,
      openApps,
      selectedMailId,
    ]
  );

  const [copied, setCopied] = useState(false);

  const handleDismiss = useCallback(() => {
    dispatch({ type: 'DISABLE_GUIDANCE' });
  }, [dispatch]);

  const handleOpen = useCallback((appId) => {
    if (appId && onOpenApp) onOpenApp(appId);
  }, [onOpenApp]);

  const handleCopy = useCallback(async () => {
    if (!hint?.command) return;
    try {
      await navigator.clipboard.writeText(hint.command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [hint?.command]);

  const handleInsert = useCallback(() => {
    if (!hint?.command || !onInsertCommand) return;
    onInsertCommand(hint.command);
  }, [hint?.command, onInsertCommand]);

  if (!hint) return null;

  const terminalOpen = openApps.includes('terminal');
  const showOpen = hint.action && !openApps.includes(hint.action);

  return (
    <aside className="guidance-hint" role="status" aria-live="polite">
      <div className="guidance-hint-inner">
        <span className="guidance-badge">{hint.label ?? 'AIDE'}</span>
        <p className="guidance-text">{hint.text}</p>

        {(hint.target || hint.protocol) && (
          <div className="guidance-rp-tags">
            {hint.target && (
              <span className="guidance-rp-tag">
                Cible <strong>{hint.target}</strong>
              </span>
            )}
            {hint.protocol && (
              <span className="guidance-rp-tag guidance-rp-tag--protocol">
                Protocole <strong>{hint.protocol}</strong>
              </span>
            )}
          </div>
        )}

        {hint.revealCommand && hint.command && (
          <div className="guidance-command-block">
            <span className="guidance-command-label">Commande probable</span>
            <div className="guidance-command-row">
              <code className="guidance-command">{hint.command}</code>
              <button
                type="button"
                className="btn guidance-btn-copy"
                onClick={handleCopy}
              >
                {copied ? 'Copié !' : 'Copier'}
              </button>
              {terminalOpen && (
                <button
                  type="button"
                  className="btn btn-primary guidance-btn-insert"
                  onClick={handleInsert}
                >
                  Insérer
                </button>
              )}
            </div>
          </div>
        )}

        <div className="guidance-actions">
          {hint.secondaryActions?.map(({ app, label }) => (
            <button
              key={app}
              type="button"
              className="btn btn-primary guidance-btn-open"
              onClick={() => handleOpen(app)}
            >
              Ouvrir {label}
            </button>
          ))}
          {showOpen && (
            <button
              type="button"
              className="btn btn-primary guidance-btn-open"
              onClick={() => handleOpen(hint.action)}
            >
              Ouvrir {hint.actionLabel}
            </button>
          )}
          <button type="button" className="btn guidance-btn-dismiss" onClick={handleDismiss}>
            Masquer l&apos;aide
          </button>
        </div>
      </div>
    </aside>
  );
});

export default GuidanceHint;
