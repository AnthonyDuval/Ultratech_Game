import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { getUnlockedMails, getMailsUnlockedByReading, getMailBody } from '../data/mails.js';
import { isMission1Phase } from '../game/guidanceLevel.js';
import { getChoiceEventForMail, isChoiceResolved } from '../data/narrativeChoices.js';
import { applyNarrativeChoice } from '../game/choiceEngine.js';
import { onMailRead } from '../game/missionEngine.js';
import ChoiceModal from '../components/ChoiceModal.jsx';

const READ_DELAY_MS = { min: 800, max: 1200 };

const MailBriefActions = memo(function MailBriefActions({
  meta,
  showCommandActions,
  onOpenApp,
  onInsertCommand,
}) {
  const [copiedTarget, setCopiedTarget] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

  const copyText = useCallback(async (text, setter) => {
    try {
      await navigator.clipboard.writeText(text);
      setter(true);
      setTimeout(() => setter(false), 2000);
    } catch {
      setter(false);
    }
  }, []);

  if (!meta) return null;

  return (
    <div className="mail-brief-actions">
      <div className="mail-brief-highlight">
        <div className="mail-brief-row">
          <span className="mail-brief-label">CIBLE RÉSEAU</span>
          <code className="mail-brief-value">{meta.target}</code>
        </div>
        <div className="mail-brief-row">
          <span className="mail-brief-label">PROTOCOLE RECOMMANDÉ</span>
          <code className="mail-brief-value mail-brief-value--protocol">{meta.protocol}</code>
        </div>
      </div>
      <div className="mail-brief-buttons">
        <button
          type="button"
          className="btn mail-brief-btn"
          onClick={() => copyText(meta.target, setCopiedTarget)}
        >
          {copiedTarget ? 'Cible copiée !' : 'Copier cible'}
        </button>
        {showCommandActions && meta.probableCommand && (
          <button
            type="button"
            className="btn mail-brief-btn"
            onClick={() => copyText(meta.probableCommand, setCopiedCmd)}
          >
            {copiedCmd ? 'Commande copiée !' : 'Copier commande probable'}
          </button>
        )}
        <button type="button" className="btn btn-primary mail-brief-btn" onClick={() => onOpenApp('terminal')}>
          Ouvrir Terminal
        </button>
        <button type="button" className="btn btn-primary mail-brief-btn" onClick={() => onOpenApp('missions')}>
          Ouvrir Opérations
        </button>
        {showCommandActions && onInsertCommand && meta.probableCommand && (
          <button
            type="button"
            className="btn mail-brief-btn mail-brief-btn--insert"
            onClick={() => onInsertCommand(meta.probableCommand)}
          >
            Insérer commande
          </button>
        )}
      </div>
    </div>
  );
});

const MailApp = memo(function MailApp({ state, dispatch, onSelectMail, onOpenApp, onInsertCommand, onNotification }) {
  const { unlockedMails, readMails } = state;
  const mails = getUnlockedMails(unlockedMails, state);
  const [selectedId, setSelectedId] = useState(null);
  const [choiceModal, setChoiceModal] = useState(null);
  const stateRef = useRef(state);
  const pendingReadRef = useRef(null);

  stateRef.current = state;

  const selected = mails.find((m) => m.id === selectedId) ?? mails[0] ?? null;
  const selectedChoiceEvent = selected?.choiceEventId
    ? getChoiceEventForMail(selected.id)
    : null;
  const choicePending = selectedChoiceEvent
    && !isChoiceResolved(state, selectedChoiceEvent.id);

  const markMailAsRead = useCallback((mailId) => {
    const current = stateRef.current;
    if (!mailId || current.readMails.includes(mailId)) return;
    if (pendingReadRef.current === mailId) return;

    const mail = mails.find((m) => m.id === mailId) ?? getUnlockedMails(current.unlockedMails, current).find((m) => m.id === mailId);
    if (mail?.choiceEventId && !isChoiceResolved(current, mail.choiceEventId)) {
      const event = getChoiceEventForMail(mailId);
      if (event) setChoiceModal(event);
      return;
    }

    pendingReadRef.current = mailId;

    dispatch({ type: 'MARK_MAIL_READ', mailId });

    const chained = getMailsUnlockedByReading(mailId);
    if (chained.length) {
      dispatch({ type: 'UNLOCK_MAILS', mailIds: chained });
    }

    const nextState = {
      ...current,
      readMails: [...current.readMails, mailId],
      unlockedMails: [...new Set([...current.unlockedMails, ...chained])],
    };
    onMailRead(mailId, nextState, dispatch);
  }, [dispatch, mails]);

  const handleChoiceSelect = useCallback((optionId) => {
    if (!choiceModal) return;
    const result = applyNarrativeChoice(
      stateRef.current,
      dispatch,
      choiceModal.id,
      optionId,
      onNotification
    );
    if (result.ok && choiceModal.mailId) {
      pendingReadRef.current = null;
      dispatch({ type: 'MARK_MAIL_READ', mailId: choiceModal.mailId });
      const current = stateRef.current;
      onMailRead(choiceModal.mailId, {
        ...current,
        readMails: [...current.readMails, choiceModal.mailId],
      }, dispatch);
    }
    setChoiceModal(null);
  }, [choiceModal, dispatch, onNotification]);

  useEffect(() => {
    if (selected?.id) onSelectMail?.(selected.id);
  }, [selected?.id, onSelectMail]);

  useEffect(() => {
    if (!selectedId && mails[0]) {
      setSelectedId(mails[0].id);
    }
  }, [mails, selectedId]);

  useEffect(() => {
    const mailId = selected?.id;
    if (!mailId || readMails.includes(mailId)) {
      if (mailId && readMails.includes(mailId)) pendingReadRef.current = null;
      return undefined;
    }

    const delay = READ_DELAY_MS.min + Math.floor(
      Math.random() * (READ_DELAY_MS.max - READ_DELAY_MS.min)
    );

    const timer = setTimeout(() => {
      markMailAsRead(mailId);
    }, delay);

    return () => clearTimeout(timer);
  }, [selected?.id, readMails, markMailAsRead]);

  const unreadCount = mails.filter((m) => !readMails.includes(m.id)).length;

  const handleSelect = useCallback((mail) => {
    pendingReadRef.current = null;
    setSelectedId(mail.id);
    onSelectMail?.(mail.id);
  }, [onSelectMail]);

  if (!mails.length) {
    return <div className="mail-app empty">Aucun message.</div>;
  }

  return (
    <div className="mail-app">
      <aside className="mail-list">
        {unreadCount > 0 && (
          <p className="mail-list-notice">{unreadCount} message(s) non lu(s)</p>
        )}
        {mails.map((mail) => {
          const isUnread = !readMails.includes(mail.id);
          return (
            <button
              key={mail.id}
              type="button"
              className={`mail-item ${selected?.id === mail.id ? 'active' : ''} ${isUnread ? 'unread' : 'read'}`}
              onClick={() => handleSelect(mail)}
            >
              <div className="mail-item-top">
                <span className="mail-item-from">{mail.senderName ?? mail.from}</span>
                {isUnread && (
                  <span className="mail-item-badge">NOUVEAU</span>
                )}
              </div>
              <span className="mail-item-subject">{mail.subject}</span>
            </button>
          );
        })}
      </aside>
      {selected && (
        <article className="mail-view">
          <header className="mail-view-header">
            {!readMails.includes(selected.id) && (
              <span className="mail-view-badge">NOUVEAU MESSAGE</span>
            )}
            <h3>{selected.subject}</h3>
            <p>{selected.senderName ?? selected.from} — {selected.date} {selected.time}</p>
          </header>
          {selected.briefMeta && (
            <MailBriefActions
              meta={selected.briefMeta}
              showCommandActions={isMission1Phase(state)}
              onOpenApp={onOpenApp}
              onInsertCommand={onInsertCommand}
            />
          )}
          <pre className="mail-view-body">{getMailBody(selected, state)}</pre>
          {choicePending && (
            <div className="mail-choice-pending">
              <p>Une décision est requise avant de clôturer ce message.</p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setChoiceModal(selectedChoiceEvent)}
              >
                Répondre
              </button>
            </div>
          )}
        </article>
      )}
      {choiceModal && (
        <ChoiceModal
          event={choiceModal}
          onSelect={handleChoiceSelect}
          onClose={() => setChoiceModal(null)}
        />
      )}
    </div>
  );
});

export default MailApp;
