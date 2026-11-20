import React from "react";

function PlayIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
      <polygon points="2,1.5 10.5,6 2,10.5" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
      <rect x="2" y="2" width="8" height="8" rx="1.2" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function FullscreenIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

/**
 * FooterBar.jsx - Houses the single Run/Stop toggle button and animated
 * "Contract bought" status bar that controls and reflects Bot Builder execution.
 */
export default function FooterBar({
  isRunning = false,
  onToggleRunStop,
  contractBoughtActive = false,
  activeStatusLabel = "Ready — click Run to start",
  tickProgress = 0,
  brandLabel = "© 2026 MkoreanWWN",
  timestampText = "2026-11-20 21:54:00 GMT",
}) {
  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  };

  return (
    <footer className="bb-footer" role="contentinfo">
      <div className="bb-footer-left" />

      <div className="bb-footer-center">
        <button
          type="button"
          onClick={onToggleRunStop}
          aria-pressed={isRunning}
          aria-label={isRunning ? "Stop bot" : "Run bot"}
          className={`bb-run-stop-btn ${isRunning ? "is-running" : "is-stopped"}`}
        >
          {isRunning ? (
            <>
              <StopIcon />
              <span>Stop</span>
            </>
          ) : (
            <>
              <PlayIcon />
              <span>Run</span>
            </>
          )}
        </button>
      </div>

      <div className="bb-footer-right">
        <span>{brandLabel}</span>
        <span className={`bb-status-dot ${isRunning ? "" : "paused"}`} title={isRunning ? "Running" : "Stopped"} />
        <span>{timestampText}</span>
        <span style={{ display: "inline-flex", cursor: "pointer" }} title="Theme">
          <SunIcon />
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontWeight: 600 }}>
          <GlobeIcon /> EN
        </span>
        <span style={{ display: "inline-flex", cursor: "pointer" }} title="Fullscreen" onClick={handleFullscreen}>
          <FullscreenIcon />
        </span>
      </div>
    </footer>
  );
}