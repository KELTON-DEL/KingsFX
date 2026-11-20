import React from 'react';

export function NavIcon({ name, size = 15 }) {
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    style: { display: 'inline-block', verticalAlign: 'middle', flexShrink: 0 }
  };

  switch (name) {
    case 'dashboard':
      return (
        <svg {...props}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
    case 'bot-builder':
      return (
        <svg {...props}>
          <rect x="4" y="8" width="16" height="11" rx="2" />
          <path d="M12 4v4M9 13h.01M15 13h.01M9 16h6" />
        </svg>
      );
    case 'free-bots':
      return (
        <svg {...props}>
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      );
    case 'premium-ai-bots':
    case 'premium-bots':
      return (
        <svg {...props}>
          <path d="M2 18h20L19 7l-5 5-2-7-2 7-5-5-3 11z" />
          <line x1="2" y1="21" x2="22" y2="21" />
        </svg>
      );
    case 'pulse-scanner':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="1.5" />
        </svg>
      );
    case 'quick-bot':
      return (
        <svg {...props}>
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );
    case 'confluence-ai':
      return (
        <svg {...props}>
          <circle cx="6" cy="6" r="3" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="12" r="3" />
          <path d="M8.7 7.3L15.3 10.7M8.7 16.7L15.3 13.3" />
        </svg>
      );
    case 'analysis-tools':
      return (
        <svg {...props}>
          <circle cx="11" cy="11" r="7" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      );
    case 'hedging':
      return (
        <svg {...props}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <polyline points="9 12 11 14 15 10" />
        </svg>
      );
    case 'auto-trading':
      return (
        <svg {...props}>
          <polyline points="23 4 23 10 17 10" />
          <polyline points="1 20 1 14 7 14" />
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
      );
    case 'signal-ai':
      return (
        <svg {...props}>
          <path d="M2 12h4l3-7 4 14 3-7h6" />
        </svg>
      );
    case 'manual-trader':
      return (
        <svg {...props}>
          <line x1="4" y1="21" x2="4" y2="14" />
          <line x1="4" y1="10" x2="4" y2="3" />
          <line x1="12" y1="21" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12" y2="3" />
          <line x1="20" y1="21" x2="20" y2="16" />
          <line x1="20" y1="12" x2="20" y2="3" />
          <line x1="1" y1="14" x2="7" y2="14" />
          <line x1="9" y1="8" x2="15" y2="8" />
          <line x1="17" y1="16" x2="23" y2="16" />
        </svg>
      );
    case 'bulk-trader':
      return (
        <svg {...props}>
          <polygon points="12 2 2 7 12 12 22 7 12 2" />
          <polyline points="2 17 12 22 22 17" />
          <polyline points="2 12 12 17 22 12" />
        </svg>
      );
    case 'smart-ai':
      return (
        <svg {...props}>
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <rect x="9" y="9" width="6" height="6" />
          <line x1="9" y1="1" x2="9" y2="4" />
          <line x1="15" y1="1" x2="15" y2="4" />
          <line x1="9" y1="20" x2="9" y2="23" />
          <line x1="15" y1="20" x2="15" y2="23" />
        </svg>
      );
    case 'copy-trader':
      return (
        <svg {...props}>
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      );
    case 'chart':
      return (
        <svg {...props}>
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
          <polyline points="16 7 22 7 22 13" />
        </svg>
      );
    case 'speedbot':
      return (
        <svg {...props}>
          <path d="M12 14l4-4" />
          <path d="M3.34 19a10 10 0 1 1 17.32 0" />
        </svg>
      );
    case 'reports':
      return (
        <svg {...props}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      );
    case 'transfer':
      return (
        <svg {...props}>
          <polyline points="17 1 21 5 17 9" />
          <path d="M3 11V9a4 4 0 0 1 4-4h14" />
          <polyline points="7 23 3 19 7 15" />
          <path d="M21 13v2a4 4 0 0 1-4 4H3" />
        </svg>
      );
    case 'search':
      return (
        <svg {...props}>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      );
    case 'globe':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      );
    case 'clock':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    case 'folder':
      return (
        <svg {...props}>
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      );
    case 'sun':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      );
    case 'expand':
      return (
        <svg {...props}>
          <polyline points="15 3 21 3 21 9" />
          <polyline points="9 21 3 21 3 15" />
          <line x1="21" y1="3" x2="14" y2="10" />
          <line x1="3" y1="21" x2="10" y2="14" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}

export function KenyaFlagIcon({ width = 18, height = 12 }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 30 20"
      style={{ display: 'inline-block', borderRadius: 2, flexShrink: 0 }}
      aria-label="Kenya"
    >
      <rect width="30" height="6" y="0" fill="#111111" />
      <rect width="30" height="1" y="6" fill="#FFFFFF" />
      <rect width="30" height="6" y="7" fill="#BB0000" />
      <rect width="30" height="1" y="13" fill="#FFFFFF" />
      <rect width="30" height="6" y="14" fill="#006600" />
      <ellipse cx="15" cy="10" rx="2.6" ry="4.5" fill="#BB0000" stroke="#FFFFFF" strokeWidth="0.7" />
    </svg>
  );
}

export function UsaFlagIcon({ width = 18, height = 12 }) {
  const stripes = Array.from({ length: 13 });
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 30 20"
      style={{ display: 'inline-block', borderRadius: 2, flexShrink: 0 }}
      aria-label="United States"
    >
      {stripes.map((_, i) => (
        <rect
          key={i}
          x="0"
          y={(i * 20) / 13}
          width="30"
          height={20 / 13 + 0.15}
          fill={i % 2 === 0 ? '#B22234' : '#FFFFFF'}
        />
      ))}
      <rect x="0" y="0" width="13.5" height={(20 / 13) * 7} fill="#3C3B6E" />
      <circle cx="3.2" cy="3.2" r="0.9" fill="#FFFFFF" />
      <circle cx="6.8" cy="3.2" r="0.9" fill="#FFFFFF" />
      <circle cx="10.3" cy="3.2" r="0.9" fill="#FFFFFF" />
      <circle cx="5.0" cy="6.2" r="0.9" fill="#FFFFFF" />
      <circle cx="8.6" cy="6.2" r="0.9" fill="#FFFFFF" />
      <circle cx="3.2" cy="9.2" r="0.9" fill="#FFFFFF" />
      <circle cx="6.8" cy="9.2" r="0.9" fill="#FFFFFF" />
      <circle cx="10.3" cy="9.2" r="0.9" fill="#FFFFFF" />
    </svg>
  );
}

export function CurrencyFlagIcon({ currency = 'KSH', width = 18, height = 12 }) {
  if ((currency || '').toUpperCase() === 'USD') {
    return <UsaFlagIcon width={width} height={height} />;
  }
  return <KenyaFlagIcon width={width} height={height} />;
}
