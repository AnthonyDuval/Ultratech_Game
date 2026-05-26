import { useState, useEffect } from 'react';
import { BOOT_LINES } from '../data/lore.js';
import { delay } from '../utils/time.js';

export default function BootScreen() {
  const [lines, setLines] = useState([]);
  const [cursor, setCursor] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function runBoot() {
      for (const line of BOOT_LINES) {
        if (cancelled) return;
        await delay(320);
        setLines((prev) => [...prev, line]);
      }
    }

    runBoot();
    const blink = setInterval(() => setCursor((v) => !v), 500);
    return () => {
      cancelled = true;
      clearInterval(blink);
    };
  }, []);

  return (
    <div className="boot-screen">
      <div className="boot-content">
        {lines.map((line, i) => (
          <div key={i} className="boot-line">{line}</div>
        ))}
        <div className="boot-line boot-cursor">{cursor ? '█' : ' '}</div>
      </div>
      <div className="boot-brand">ULTRATECH INDUSTRIES</div>
    </div>
  );
}
