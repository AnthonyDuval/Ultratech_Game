import BootScreen from './components/BootScreen.jsx';
import LoginScreen from './components/LoginScreen.jsx';
import Desktop from './components/Desktop.jsx';
import { useGameState, PHASES } from './hooks/useGameState.js';
import { saveGame, hasSave } from './utils/saveSystem.js';
import { getDefaultUnlockedMailIds } from './utils/gameHelpers.js';

export default function App() {
  const { state, dispatch } = useGameState();

  const handleLogin = (username) => {
    const mailIds = getDefaultUnlockedMailIds();
    dispatch({ type: 'SET_USERNAME', username });
    dispatch({ type: 'UNLOCK_MAILS', mailIds });
    dispatch({ type: 'SET_PHASE', phase: PHASES.DESKTOP });
    saveGame({ ...state, username, unlockedMails: mailIds, phase: PHASES.DESKTOP });
  };

  if (state.phase === PHASES.BOOT) {
    return <BootScreen />;
  }

  if (state.phase === PHASES.LOGIN) {
    return <LoginScreen onLogin={handleLogin} hadPreviousSave={hasSave()} />;
  }

  return <Desktop state={state} dispatch={dispatch} />;
}
