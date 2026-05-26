import { useState, useCallback, useMemo, useEffect } from 'react';
import TopBar from './TopBar.jsx';
import DesktopIcon from './DesktopIcon.jsx';
import Window from './Window.jsx';
import TutorialOverlay from './TutorialOverlay.jsx';
import BetaNotice, { hasSeenBetaNotice } from './BetaNotice.jsx';
import GuidanceHint from './GuidanceHint.jsx';
import CurrentObjectiveWidget from './CurrentObjectiveWidget.jsx';
import DesktopToast from './DesktopToast.jsx';
import CorruptionOverlay from './CorruptionOverlay.jsx';
import TerminalApp from '../apps/TerminalApp.jsx';
import MailApp from '../apps/MailApp.jsx';
import MissionApp from '../apps/MissionApp.jsx';
import ProfileApp from '../apps/ProfileApp.jsx';
import { useAutoSave } from '../hooks/useAutoSave.js';
import { useAnonScanHelp } from '../hooks/useAnonScanHelp.js';
import { useStuckTimer } from '../hooks/useStuckTimer.js';
import { markProgress } from '../game/stuckTimer.js';
import { getUnlockedMails } from '../data/mails.js';
import { getActiveHelp, shouldSuppressDesktopNotifs } from '../game/activeHelp.js';

const APPS = [
  { id: 'terminal', label: 'Terminal', iconType: 'terminal', accent: 'cyan', title: 'Terminal — ULTRATECH OS', width: 920, height: 620 },
  { id: 'missions', label: 'Opérations', iconType: 'missions', accent: 'magenta', title: 'Opérations — Journal', width: 880, height: 640 },
  { id: 'mail', label: 'Mails', iconType: 'mail', accent: 'cyan', title: 'Messagerie', width: 900, height: 600 },
  { id: 'profile', label: 'Profil', iconType: 'profile', accent: 'red', title: 'Profil opérateur', width: 560, height: 600 },
];

export default function Desktop({ state, dispatch }) {
  const [windows, setWindows] = useState([]);
  const [activeWindow, setActiveWindow] = useState(null);
  const [selectedMailId, setSelectedMailId] = useState(null);
  const [terminalInsert, setTerminalInsert] = useState(null);
  const [toast, setToast] = useState(null);
  const [betaNoticeOpen, setBetaNoticeOpen] = useState(() => !hasSeenBetaNotice());

  useAutoSave(state);

  const openApp = useCallback((appId) => {
    const app = APPS.find((a) => a.id === appId);
    if (!app) return;

    if (appId === 'terminal') {
      const count = state.narrativeFlags?.terminal_open_count ?? 0;
      dispatch({ type: 'SET_NARRATIVE_FLAG', flag: 'terminal_open_count', value: count + 1 });
    }

    setWindows((prev) => {
      if (prev.some((w) => w.id === appId)) {
        setActiveWindow(appId);
        return prev;
      }
      const offset = prev.length * 24;
      return [
        ...prev,
        { id: appId, title: app.title, x: 48 + offset, y: 40 + offset, width: app.width, height: app.height },
      ];
    });
    setActiveWindow(appId);
  }, [state.narrativeFlags, dispatch]);

  const closeWindow = useCallback((id) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
    setActiveWindow((prev) => (prev === id ? null : prev));
    if (id === 'mail') setSelectedMailId(null);
  }, []);

  const handleSelectMail = useCallback((mailId) => {
    setSelectedMailId(mailId);
  }, []);

  const handleInsertCommand = useCallback((command) => {
    openApp('terminal');
    setTerminalInsert(`${command}::${Date.now()}`);
  }, [openApp]);

  const handleNotification = useCallback((notification) => {
    setToast(notification);
  }, []);

  const dismissToast = useCallback(() => setToast(null), []);

  useAnonScanHelp(state, dispatch, setToast);
  useStuckTimer(state, dispatch, setToast);

  useEffect(() => {
    if (!state.tutorialCompleted) return;
    if (!state.narrativeFlags?.session_started_at) {
      dispatch({ type: 'SET_NARRATIVE_FLAG', flag: 'session_started_at', value: new Date().toISOString() });
    }
    if (!state.narrativeFlags?.last_progress_at) {
      markProgress(state, dispatch);
    }
  }, [state.tutorialCompleted, state.narrativeFlags, state, dispatch]);

  const unreadCount = useMemo(
    () => getUnlockedMails(state.unlockedMails, state).filter(
      (m) => !state.readMails.includes(m.id)
    ).length,
    [state.unlockedMails, state.readMails, state.choices, state.narrativeFlags]
  );

  const activeOps = useMemo(
    () => (state.discoveredMissions ?? []).filter(
      (id) => !state.completedMissions.includes(id)
    ).length,
    [state.discoveredMissions, state.completedMissions]
  );

  const openApps = useMemo(() => windows.map((w) => w.id), [windows]);

  const ghostSignalDone = useMemo(
    () => (state.completedMissions ?? []).includes('ghost-signal'),
    [state.completedMissions]
  );

  const activeHelp = useMemo(
    () => {
      if (!state.tutorialCompleted || betaNoticeOpen) return null;
      return getActiveHelp(state, { openApps, selectedMailId });
    },
    [
      state.tutorialCompleted,
      state.guidanceDisabled,
      state.readMails,
      state.unlockedMails,
      state.discoveredMissions,
      state.completedMissions,
      state.narrativeFlags,
      openApps,
      selectedMailId,
      betaNoticeOpen,
    ]
  );

  const notifSuppress = useMemo(
    () => shouldSuppressDesktopNotifs(activeHelp),
    [activeHelp]
  );

  const terminalInsertCmd = useMemo(
    () => terminalInsert?.split('::')[0] ?? null,
    [terminalInsert]
  );

  const renderContent = useCallback((id) => {
    switch (id) {
      case 'terminal':
        return (
          <TerminalApp
            state={state}
            dispatch={dispatch}
            insertCommand={terminalInsertCmd}
            onNotification={handleNotification}
          />
        );
      case 'mail':
        return (
          <MailApp
            state={state}
            dispatch={dispatch}
            onSelectMail={handleSelectMail}
            onOpenApp={openApp}
            onInsertCommand={handleInsertCommand}
            onNotification={handleNotification}
          />
        );
      case 'missions':
        return <MissionApp state={state} openApps={openApps} />;
      case 'profile':
        return <ProfileApp state={state} />;
      default:
        return null;
    }
  }, [state, dispatch, terminalInsertCmd, handleSelectMail, handleNotification, openApp, handleInsertCommand, openApps]);

  return (
    <div className="desktop">
      <CorruptionOverlay
        corruption={state.corruption}
        suspicion={state.suspicionUltraTech ?? 0}
      />

      <TopBar
        username={state.username}
        bittek={state.bittek}
        reputation={state.reputation}
        corruption={state.corruption}
        suspicion={state.suspicionUltraTech ?? 0}
      />

      {activeHelp?.type === 'objective' && !ghostSignalDone && (
        <CurrentObjectiveWidget
          help={activeHelp}
          openApps={openApps}
          onOpenApp={openApp}
          onInsertCommand={handleInsertCommand}
        />
      )}

      <div className="desktop-area">
        <div className="desktop-icons">
          {APPS.map((app) => (
            <DesktopIcon
              key={app.id}
              label={app.label}
              iconType={app.iconType}
              accent={app.accent}
              onOpen={(e) => { e.stopPropagation(); openApp(app.id); }}
            />
          ))}
        </div>

        {windows.map((win) => (
          <Window
            key={win.id}
            title={win.title}
            x={win.x}
            y={win.y}
            width={win.width}
            height={win.height}
            active={activeWindow === win.id}
            onFocus={() => setActiveWindow(win.id)}
            onClose={() => closeWindow(win.id)}
          >
            {renderContent(win.id)}
          </Window>
        ))}
      </div>

      {unreadCount > 0 && !notifSuppress.unread && (
        <div className="desktop-notif desktop-notif--subtle">{unreadCount} message(s) non lu(s)</div>
      )}

      {activeOps > 0 && !notifSuppress.ops && (
        <div className="desktop-notif desktop-notif--ops desktop-notif--subtle">
          {activeOps} opération(s) active(s)
        </div>
      )}

      <DesktopToast toast={toast} onDismiss={dismissToast} />

      {betaNoticeOpen && (
        <BetaNotice onDismiss={() => setBetaNoticeOpen(false)} />
      )}

      {!state.tutorialCompleted && !betaNoticeOpen && (
        <TutorialOverlay dispatch={dispatch} />
      )}

      {activeHelp?.type === 'guidance' && (
        <GuidanceHint
          help={activeHelp}
          dispatch={dispatch}
          openApps={openApps}
          onOpenApp={openApp}
          onInsertCommand={handleInsertCommand}
        />
      )}
    </div>
  );
}
