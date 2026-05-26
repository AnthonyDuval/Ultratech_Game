import { useMemo, useCallback, useState, memo } from 'react';
import { getObjectiveWidgetData } from '../game/objectiveState.js';

function CurrentObjectiveWidget({
  state,
  openApps,
  selectedMailId,
  onOpenApp,
  onInsertCommand,
}) {
  const data = useMemo(
    () => getObjectiveWidgetData(state, { openApps, selectedMailId }),
    [
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

  const handleCopy = useCallback(async () => {
    if (!data?.command) return;
    try {
      await navigator.clipboard.writeText(data.command);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [data?.command]);

  const handleInsert = useCallback(() => {
    if (data?.command && onInsertCommand) onInsertCommand(data.command);
  }, [data?.command, onInsertCommand]);

  const handleOpen = useCallback(() => {
    if (data?.app) onOpenApp?.(data.app);
  }, [data?.app, onOpenApp]);

  if (!data) return null;

  const showOpen = data.app && !openApps.includes(data.app);

  return (
    <aside className="objective-widget" aria-label="Objectif actuel">
      <header className="objective-widget-header">
        <span className="objective-widget-badge">{data.label}</span>
        {data.missionTitle && (
          <span className="objective-widget-mission">{data.missionTitle}</span>
        )}
      </header>

      <p className="objective-widget-action">{data.action}</p>

      {(data.target || data.protocol) && (
        <div className="objective-widget-tags">
          {data.target && (
            <span className="objective-widget-tag">
              Cible <strong>{data.target}</strong>
            </span>
          )}
          {data.protocol && (
            <span className="objective-widget-tag objective-widget-tag--protocol">
              Protocole <strong>{data.protocol}</strong>
            </span>
          )}
        </div>
      )}

      {data.showCommand && data.command && (
        <div className="objective-widget-cmd-block">
          <span className="objective-widget-cmd-label">Commande probable</span>
          <code className="objective-widget-cmd">{data.command}</code>
        </div>
      )}

      <div className="objective-widget-actions">
        {data.showCommand && data.command && (
          <>
            <button type="button" className="btn objective-widget-btn-copy" onClick={handleCopy}>
              {copied ? 'Copié !' : 'Copier commande'}
            </button>
            <button type="button" className="btn btn-primary objective-widget-btn-insert" onClick={handleInsert}>
              Insérer dans le terminal
            </button>
          </>
        )}
        {showOpen && (
          <button type="button" className="btn btn-primary objective-widget-btn-open" onClick={handleOpen}>
            Ouvrir {data.appLabel}
          </button>
        )}
      </div>
    </aside>
  );
}

export default memo(CurrentObjectiveWidget);
