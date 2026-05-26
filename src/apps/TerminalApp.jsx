import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { TERMINAL_WELCOME } from '../data/lore.js';
import { executeTerminalCommand } from '../game/terminalEngine.js';

const MAX_DISPLAY_LINES = 80;

const TerminalApp = memo(function TerminalApp({ state, dispatch, insertCommand, onNotification }) {
  const [input, setInput] = useState('');
  const [lines, setLines] = useState(
    TERMINAL_WELCOME.map((text) => ({ text, type: 'system' }))
  );
  const [busy, setBusy] = useState(false);
  const outputRef = useRef(null);
  const inputRef = useRef(null);
  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);
  const stateRef = useRef(state);

  stateRef.current = state;

  const displayLines = lines.length > MAX_DISPLAY_LINES
    ? lines.slice(-MAX_DISPLAY_LINES)
    : lines;

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [lines, busy]);

  useEffect(() => {
    if (insertCommand) {
      setInput(insertCommand);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [insertCommand]);

  const addLine = useCallback((text, type = 'info') => {
    setLines((prev) => {
      const next = [...prev, { text, type }];
      return next.length > MAX_DISPLAY_LINES
        ? next.slice(-MAX_DISPLAY_LINES)
        : next;
    });
  }, []);

  const execute = useCallback(async (cmd) => {
    if (!cmd.trim() || busy) return;
    setBusy(true);
    addLine(`> ${cmd}`, 'system');
    historyRef.current.push(cmd);
    historyIndexRef.current = historyRef.current.length;

    const result = await executeTerminalCommand(
      cmd,
      stateRef.current,
      dispatch,
      addLine
    );
    if (result?.action === 'clear') setLines([]);

    if (result?.notification) {
      onNotification?.(result.notification);
    }

    setBusy(false);
  }, [busy, dispatch, addLine, onNotification]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    const cmd = input;
    setInput('');
    execute(cmd);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!historyRef.current.length) return;
      const idx = Math.max(0, historyIndexRef.current - 1);
      historyIndexRef.current = idx;
      setInput(historyRef.current[idx] ?? '');
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const idx = historyIndexRef.current + 1;
      if (idx >= historyRef.current.length) {
        historyIndexRef.current = historyRef.current.length;
        setInput('');
      } else {
        historyIndexRef.current = idx;
        setInput(historyRef.current[idx] ?? '');
      }
    }
  };

  return (
    <div className="terminal-app">
      <div className="terminal-output" ref={outputRef}>
        {displayLines.map((line, i) => (
          <div key={`${i}-${line.text.slice(0, 24)}`} className={`terminal-line ${line.type}`}>
            {line.text}
          </div>
        ))}
        {busy && <div className="terminal-line info terminal-busy">...</div>}
      </div>
      <form className="terminal-input-row" onSubmit={handleSubmit}>
        <span className="terminal-prompt">{state.username || 'operateur'}@ultratech:~$</span>
        <input
          ref={inputRef}
          className="terminal-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={busy}
          placeholder="help"
          spellCheck={false}
          autoFocus
        />
      </form>
    </div>
  );
});

export default TerminalApp;
