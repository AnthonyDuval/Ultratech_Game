import { useCallback, useState, useEffect, memo } from 'react';

const GuidanceHint = memo(function GuidanceHint({
  help,
  dispatch,
  openApps,
  onOpenApp,
  onInsertCommand,
}) {
  const [copied, setCopied] = useState(false);

  const handleDismiss = useCallback(() => {
    dispatch({ type: 'DISABLE_GUIDANCE' });
  }, [dispatch]);

  const handleOpen = useCallback((appId) => {
    if (appId && onOpenApp) onOpenApp(appId);
  }, [onOpenApp]);

  const handleCopy = useCallback(async () => {
    if (!help?.command) return;
    try {
      await navigator.clipboard.writeText(help.command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [help?.command]);

  const handleInsert = useCallback(() => {
    if (!help?.command || !onInsertCommand) return;
    onInsertCommand(help.command);
  }, [help?.command, onInsertCommand]);

  useEffect(() => {
    if (!help?.autoDismiss) return undefined;
    const timer = setTimeout(() => {
      dispatch({ type: 'DISABLE_GUIDANCE' });
    }, 8000);
    return () => clearTimeout(timer);
  }, [help?.id, help?.autoDismiss, dispatch]);

  if (!help) return null;

  const terminalOpen = openApps.includes('terminal');
  const targetApp = help.targetApp;
  const showOpen = targetApp && !openApps.includes(targetApp);
  const toneClass = help.tone === 'nova' ? 'guidance-hint--nova' : help.tone === 'cryptic' ? 'guidance-hint--cryptic' : '';

  return (
    <aside className={`guidance-hint ${toneClass}`} role="status" aria-live="polite">
      <div className="guidance-hint-inner">
        <span className="guidance-badge">{help.title ?? 'PROCHAINE ACTION'}</span>
        <p className="guidance-text">{help.message}</p>

        {(help.target || help.protocol) && (
          <div className="guidance-rp-tags">
            {help.target && (
              <span className="guidance-rp-tag">
                Cible <strong>{help.target}</strong>
              </span>
            )}
            {help.protocol && (
              <span className="guidance-rp-tag guidance-rp-tag--protocol">
                {help.tone === 'cryptic' || (help.guidanceLevel ?? 0) >= 1
                  ? <>Protocole observé <strong>{help.protocol}</strong></>
                  : <>Protocole <strong>{help.protocol}</strong></>}
              </span>
            )}
          </div>
        )}

        {help.revealCommand && help.command && (
          <div className="guidance-command-block">
            <span className="guidance-command-label">Commande probable</span>
            <div className="guidance-command-row">
              <code className="guidance-command">{help.command}</code>
              <button
                type="button"
                className="btn guidance-btn-copy"
                onClick={handleCopy}
              >
                {copied ? 'Copié !' : 'Copier'}
              </button>
              {!terminalOpen && (
                <button
                  type="button"
                  className="btn btn-primary guidance-btn-open"
                  onClick={() => handleOpen('terminal')}
                >
                  Ouvrir Terminal
                </button>
              )}
              <button
                type="button"
                className="btn btn-primary guidance-btn-insert"
                onClick={handleInsert}
              >
                Insérer
              </button>
            </div>
          </div>
        )}

        <div className="guidance-actions">
          {help.secondaryActions
            ?.filter(({ app }) => !openApps.includes(app))
            .map(({ app, label }) => (
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
              onClick={() => handleOpen(targetApp)}
            >
              Ouvrir {help.actionLabel}
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
