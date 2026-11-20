import React, { useEffect, useState } from 'react';
import { NavIcon } from './Icons';

export default function FooterBar({ isRunning, onToggleRun, execSpeed, onCycleSpeed }) {
  const [gmtClock, setGmtClock] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const dateStr = now.toISOString().slice(0, 10);
      const timeStr = now.toUTCString().slice(17, 25);
      setGmtClock(`${dateStr} ${timeStr} GMT`);
    };
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <footer className="kfx-footer">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          type="button"
          className={`kfx-run-btn ${isRunning ? 'is-running' : ''}`}
          onClick={onToggleRun}
        >
          {isRunning ? 'Stop Engine' : 'Run Engine'}
        </button>

        <button type="button" className="kfx-exec-pill" onClick={onCycleSpeed}>
          <span>Execution</span>
          <span style={{ color: '#34D399' }}>{execSpeed}</span>
        </button>
      </div>

      <div className="kfx-footer-right">
        <span>(c) 2026 KingsFX</span>
        <span className="kfx-status-dot" title="Deriv Feed Connected" />
        <span>{gmtClock}</span>
        <NavIcon name="sun" size={14} />
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <NavIcon name="globe" size={14} /> EN
        </span>
        <NavIcon name="expand" size={14} />
      </div>
    </footer>
  );
}
