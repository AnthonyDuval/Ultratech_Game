import { useCallback, useState, memo } from 'react';

function CurrentObjectiveWidget({ help, openApps, onOpenApp, onInsertCommand }) {
  const [copied, setCopied] = useState(false);

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
    if (help?.command && onInsertCommand) onInsertCommand(help.command);
  }, [help?.command, onInsertCommand]);

  const handleOpen = useCallback(() => {
    if (help?.targetApp) onOpenApp?.(help.targetApp);
  }, [help?.targetApp, onOpenApp]);

  if (!help) return null;

  const showOpen = help.targetApp && !openApps.includes(help.targetApp);

  return (
    <aside className="objective-widget objective-widget--compact" aria-label="Objectif actuel">
      <header className="objective-widget-header">
        <span className="objective-widget-badge">{help.title ?? 'Objectif actuel'}</span>
      </header>

      <p className="objective-widget-action">{help.message}</p>

      {help.revealCommand && help.command && (
        <code className="objective-widget-cmd objective-widget-cmd--inline">{help.command}</code>
      )}

      <div className="objective-widget-actions">
        {help.revealCommand && help.command && (
          <>
            <button type="button" className="btn objective-widget-btn-copy" onClick={handleCopy}>
              {copied ? 'Copié !' : 'Copier'}
            </button>
            <button type="button" className="btn btn-primary objective-widget-btn-insert" onClick={handleInsert}>
              Insérer
            </button>
          </>
        )}
        {showOpen && (
          <button type="button" className="btn btn-primary objective-widget-btn-open" onClick={handleOpen}>
            Ouvrir {help.actionLabel}
          </button>
        )}
      </div>
    </aside>
  );
}

export default memo(CurrentObjectiveWidget);
