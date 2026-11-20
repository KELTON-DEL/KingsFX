import React, { useEffect, useState } from 'react';
import { NavIcon } from './Icons';

export default function FooterBar({ isRunning, onToggleRun, execSpeed, onCycleSpeed }) {
  const [gmtClock, setGmtClock] = useState('');
  const [highContrast, setHighContrast] = useState(false);
  const [locale, setLocale] = useState('EN');

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

  const handleToggleContrast = () => {
    const next = !highContrast;
    setHighContrast(next);
    document.body.style.filter = next ? 'contrast(1.08)' : '';
  };

  const handleCycleLocale = () => {
    setLocale((prev) => (prev === 'EN' ? 'SW' : 'EN'));
  };

  const handleToggleFullscreen = () => {
    if (typeof document === 'undefined') return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

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
        <button
          type="button"
          onClick={handleToggleContrast}
          title="Toggle Contrast"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'inline-flex' }}
        >
          <NavIcon name="sun" size={14} />
        </button>
        <button
          type="button"
          onClick={handleCycleLocale}
          title="Switch Language"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12 }}
        >
          <NavIcon name="globe" size={14} /> {locale}
        </button>
        <button
          type="button"
          onClick={handleToggleFullscreen}
          title="Toggle Fullscreen"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'inline-flex' }}
        >
          <NavIcon name="expand" size={14} />
        </button>
      </div>
    </footer>
  );
}
