import React, { useMemo, useState } from 'react';
import { SYNTHETIC_MARKETS } from '../data/markets';
import { NavIcon } from './Icons';

const FREE_BOTS_LIST = [
  {
    id: 'fb-1',
    name: 'KingsFX SV-7 Parity Pro',
    market: 'Volatility 10 (1s)',
    contract: 'Even / Odd',
    winRate: '68.4%',
    desc: 'Waits for 3 consecutive odd or even ticks before entering a single-tick parity contract.'
  },
  {
    id: 'fb-2',
    name: 'Under-7 Precision Harvester',
    market: 'Volatility 100 (1s)',
    contract: 'Over / Under',
    winRate: '74.2%',
    desc: 'Targets high-probability Under 7 contracts whenever digits 8 and 9 spike above 24%.'
  },
  {
    id: 'fb-3',
    name: 'Trend Momentum Rise/Fall',
    market: 'Volatility 75',
    contract: 'Rise / Fall',
    winRate: '63.9%',
    desc: 'Follows 5-tick directional slope with automatic cooldown after two consecutive losses.'
  },
  {
    id: 'fb-4',
    name: 'Cold Digit Differs Guard',
    market: 'Volatility 25',
    contract: 'Matches / Differs',
    winRate: '89.1%',
    desc: 'Identifies the lowest-frequency digit over 100 ticks and executes a Differs contract.'
  }
];

export function FreeBotsView({ onNavigate, onLogEvent, currency }) {
  const [runningId, setRunningId] = useState(null);

  const toggleFreeBot = (bot) => {
    const next = runningId === bot.id ? null : bot.id;
    setRunningId(next);
    if (next && onLogEvent) {
      onLogEvent({
        time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
        msg: `[Free Bot] Started ${bot.name} on ${bot.market} (${currency})`
      });
    }
  };

  return (
    <section className="kfx-bots-page">
      <div className="kfx-pro-container">
        <div className="kfx-section-head">
          <div>
            <div className="kfx-workspace-tag">KINGSFX LIBRARY · ZERO-COST STRATEGIES</div>
            <h2 style={{ fontSize: 24, fontWeight: 900 }}>Free Bots Collection</h2>
          </div>
          <button
            type="button"
            className="kfx-btn-ghost"
            onClick={() => onNavigate('bot-builder')}
          >
            Customize in Bot Builder
          </button>
        </div>

        <div className="kfx-bots-grid">
          {FREE_BOTS_LIST.map((bot) => {
            const active = runningId === bot.id;
            return (
              <div key={bot.id} className={`kfx-bot-card ${active ? 'is-running' : ''}`}>
                <div>
                  <div className="kfx-bot-top">
                    <span className="kfx-bot-icon" style={{ color: '#38BDF8' }}>
                      <NavIcon name="free-bots" size={16} />
                    </span>
                    <span className="kfx-prem-badge">{active ? 'RUNNING LIVE' : 'FREE ACCESS'}</span>
                  </div>
                  <div className="kfx-bot-series">{bot.market}</div>
                  <div className="kfx-bot-name">{bot.name}</div>
                  <div className="kfx-bot-desc">{bot.desc}</div>
                  <div className="kfx-bot-tags">
                    <span className="kfx-bot-tag">{bot.contract}</span>
                    <span className="kfx-bot-tag">Ref Hit Rate: {bot.winRate}</span>
                  </div>
                  {active && (
                    <div className="kfx-loader-track" style={{ marginTop: 12 }}>
                      <div className="kfx-loader-bar" />
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  className="kfx-bot-cta"
                  style={{ background: active ? '#DC2626' : '#0284C7' }}
                  onClick={() => toggleFreeBot(bot)}
                >
                  <span>{active ? 'Stop Bot' : 'Run Free Bot'}</span>
                  <span>{active ? 'Stop' : 'Start'}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function QuickBotView({ ticksByMarket, currency, onLogEvent }) {
  const [marketId, setMarketId] = useState('R_100');
  const [tradeType, setTradeType] = useState('Up/Down > Rise/Fall');
  const [contractType, setContractType] = useState('Both');
  const [stake, setStake] = useState(1);
  const [takeProfit, setTakeProfit] = useState(10);
  const [stopLoss, setStopLoss] = useState(20);
  const [martingale, setMartingale] = useState(2);
  const [duration, setDuration] = useState(15);
  const [conditionDir, setConditionDir] = useState('rising');
  const [purchaseSide, setPurchaseSide] = useState('Rise');
  const [recoverySide, setRecoverySide] = useState('Fall');
  const [running, setRunning] = useState(false);

  const market = SYNTHETIC_MARKETS.find((m) => m.id === marketId) || SYNTHETIC_MARKETS[4];
  const ticks = ticksByMarket[market.id] || [];
  const spot = ticks[ticks.length - 1]?.price ?? market.base;
  const lastThree = ticks.slice(-3);

  const handleToggle = () => {
    const next = !running;
    setRunning(next);
    if (next && onLogEvent) {
      onLogEvent({
        time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
        msg: `[Quick Bot] Deployed ${tradeType} on ${market.label} (Stake ${stake} ${currency})`
      });
    }
  };

  return (
    <section className="kfx-light-workspace">
      <div className="kfx-pro-container">
        <div className="kfx-smart-banner">
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" className="kfx-mini-btn is-ready" onClick={handleToggle}>
              {running ? 'Stop Quick Bot' : 'Run Quick Bot'}
            </button>
            <button
              type="button"
              className="kfx-mini-btn is-ready"
              onClick={() => {
                setStake(1);
                setTakeProfit(10);
                setStopLoss(20);
                setMartingale(2);
              }}
            >
              Reset Layout
            </button>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 700 }}>{market.label}</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#0284C7' }}>
              {Number(spot).toFixed(market.decimals)}
            </div>
          </div>
        </div>

        <div className="kfx-controls-grid">
          <div className="kfx-panel-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ background: '#0F172A', color: '#FFFFFF', padding: '10px 14px', fontSize: 12, fontWeight: 800 }}>
              TRADE PARAMETERS
            </div>
            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="kfx-field">
                <label>Synthetic Market</label>
                <select value={marketId} onChange={(e) => setMarketId(e.target.value)}>
                  {SYNTHETIC_MARKETS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label} Index
                    </option>
                  ))}
                </select>
              </div>
              <div className="kfx-field">
                <label>Trade Type</label>
                <select value={tradeType} onChange={(e) => setTradeType(e.target.value)}>
                  <option value="Up/Down > Rise/Fall">Up/Down &gt; Rise/Fall</option>
                  <option value="Digits > Even/Odd">Digits &gt; Even/Odd</option>
                  <option value="Digits > Over/Under">Digits &gt; Over/Under</option>
                </select>
              </div>
              <div className="kfx-field">
                <label>Contract Type</label>
                <select value={contractType} onChange={(e) => setContractType(e.target.value)}>
                  <option value="Both">Both</option>
                  <option value="Rise">Rise Only</option>
                  <option value="Fall">Fall Only</option>
                </select>
              </div>
            </div>
          </div>

          <div className="kfx-panel-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ background: '#0F172A', color: '#FFFFFF', padding: '10px 14px', fontSize: 12, fontWeight: 800 }}>
              BOT PARAMETERS
            </div>
            <div style={{ padding: 14 }} className="kfx-controls-grid">
              <div className="kfx-field">
                <label>Stake ({currency})</label>
                <input type="number" value={stake} onChange={(e) => setStake(Number(e.target.value) || 1)} />
              </div>
              <div className="kfx-field">
                <label>Take Profit ({currency})</label>
                <input type="number" value={takeProfit} onChange={(e) => setTakeProfit(Number(e.target.value) || 10)} />
              </div>
              <div className="kfx-field">
                <label>Stop Loss ({currency})</label>
                <input type="number" value={stopLoss} onChange={(e) => setStopLoss(Number(e.target.value) || 20)} />
              </div>
              <div className="kfx-field">
                <label>Martingale Multiplier</label>
                <input type="number" step="0.5" value={martingale} onChange={(e) => setMartingale(Number(e.target.value) || 2)} />
              </div>
              <div className="kfx-field" style={{ gridColumn: '1 / -1' }}>
                <label>Duration (Seconds)</label>
                <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value) || 15)} />
              </div>
            </div>
          </div>

          <div className="kfx-panel-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ background: '#0F172A', color: '#FFFFFF', padding: '10px 14px', fontSize: 12, fontWeight: 800 }}>
              INITIAL PURCHASE CONDITION
            </div>
            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="kfx-inline-row">
                <span>IF last 3 ticks are</span>
                <select value={conditionDir} onChange={(e) => setConditionDir(e.target.value)}>
                  <option value="rising">rising</option>
                  <option value="falling">falling</option>
                  <option value="even">even digits</option>
                </select>
                <span>then Purchase</span>
                <select value={purchaseSide} onChange={(e) => setPurchaseSide(e.target.value)}>
                  <option value="Rise">Rise</option>
                  <option value="Fall">Fall</option>
                  <option value="Even">Even</option>
                  <option value="Odd">Odd</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <span style={{ color: '#6B7280', fontWeight: 700 }}>Last 3 ticks:</span>
                {lastThree.map((t, idx) => (
                  <span
                    key={idx}
                    className={`kfx-eo-badge ${t.digit % 2 === 0 ? 'kfx-eo-e' : 'kfx-eo-o'}`}
                  >
                    {t.digit}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="kfx-panel-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ background: '#0F172A', color: '#FFFFFF', padding: '10px 14px', fontSize: 12, fontWeight: 800 }}>
              RECOVERY PURCHASE
            </div>
            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div className="kfx-inline-row">
                <span>On loss recovery Purchase</span>
                <select value={recoverySide} onChange={(e) => setRecoverySide(e.target.value)}>
                  <option value="Fall">Fall</option>
                  <option value="Rise">Rise</option>
                  <option value="Over 2">Over 2</option>
                  <option value="Under 7">Under 7</option>
                </select>
              </div>
              <button
                type="button"
                className="kfx-btn-primary"
                onClick={handleToggle}
              >
                {running ? 'Stop Quick Execution' : 'Start Quick Execution'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SpeedbotView({ ticksByMarket, currency, onLogEvent }) {
  const [marketId, setMarketId] = useState('R_100');
  const [stake, setStake] = useState(0.5);
  const [alternateOnLoss, setAlternateOnLoss] = useState(true);
  const [takeProfit, setTakeProfit] = useState(1.15);
  const [active, setActive] = useState(false);

  const market = SYNTHETIC_MARKETS.find((m) => m.id === marketId) || SYNTHETIC_MARKETS[4];
  const ticks = ticksByMarket[market.id] || [];
  const latest = ticks[ticks.length - 1] || { price: market.base, digit: 8 };

  return (
    <section className="kfx-light-workspace">
      <div className="kfx-pro-container">
        <div className="kfx-smart-banner">
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: '#6B7280' }}>
              HIGH-FREQUENCY TICK ENGINE
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#111827' }}>
              Speedbot Tick Scalper
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#374151' }}>
              Last Digit: {latest.digit}
            </span>
            <span
              style={{
                background: '#F3F4F6',
                border: '1px solid #D1D5DB',
                padding: '6px 12px',
                borderRadius: 6,
                fontWeight: 900,
                fontSize: 15
              }}
            >
              {Number(latest.price).toFixed(market.decimals)}
            </span>
          </div>
        </div>

        <div className="kfx-panel-card">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: 16 }}>
            {ticks.slice(-16).map((t, i) => (
              <span
                key={i}
                className={`kfx-eo-badge ${t.digit % 2 === 0 ? 'kfx-eo-e' : 'kfx-eo-o'}`}
              >
                {t.digit % 2 === 0 ? 'E' : 'O'}
              </span>
            ))}
          </div>

          <div className="kfx-controls-grid">
            <div className="kfx-field">
              <label>Synthetic Index</label>
              <select value={marketId} onChange={(e) => setMarketId(e.target.value)}>
                {SYNTHETIC_MARKETS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="kfx-field">
              <label>Stake ({currency})</label>
              <input
                type="number"
                step="0.1"
                value={stake}
                onChange={(e) => setStake(Number(e.target.value) || 0.5)}
              />
            </div>
            <div className="kfx-field">
              <label>Target Profit ({currency})</label>
              <input
                type="number"
                step="0.1"
                value={takeProfit}
                onChange={(e) => setTakeProfit(Number(e.target.value) || 1.15)}
              />
            </div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 12px',
                border: '1px solid #E5E7EB',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 700
              }}
            >
              <span>Alternate on Loss</span>
              <input
                type="checkbox"
                checked={alternateOnLoss}
                onChange={(e) => setAlternateOnLoss(e.target.checked)}
              />
            </label>
          </div>

          <button
            type="button"
            style={{
              width: '100%',
              marginTop: 16,
              padding: '12px 16px',
              borderRadius: 8,
              border: 'none',
              background: active ? '#DC2626' : '#1E3A8A',
              color: '#FFFFFF',
              fontSize: 13,
              fontWeight: 900,
              letterSpacing: '0.04em',
              cursor: 'pointer'
            }}
            onClick={() => {
              const next = !active;
              setActive(next);
              if (next && onLogEvent) {
                onLogEvent({
                  time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
                  msg: `[Speedbot] Started 1-tick loop on ${market.label}`
                });
              }
            }}
          >
            {active ? 'STOP TRADING' : 'START TRADING'}
          </button>
        </div>
      </div>
    </section>
  );
}

export function SpecializedHubView({ activeNav, ticksByMarket, currency, onNavigate, onLogEvent }) {
  const [marketId, setMarketId] = useState('R_75');
  const [stake, setStake] = useState(1);
  const [ordersCount, setOrdersCount] = useState(5);
  const [executing, setExecuting] = useState(false);

  const market = SYNTHETIC_MARKETS.find((m) => m.id === marketId) || SYNTHETIC_MARKETS[3];
  const ticks = ticksByMarket[market.id] || [];
  const spot = ticks[ticks.length - 1]?.price ?? market.base;

  const moduleMeta = useMemo(() => {
    const map = {
      'pulse-scanner': {
        tag: 'REAL-TIME MOMENTUM RADAR',
        title: 'Pulse AI Scanner',
        desc: 'Ranks volatility spikes and digit clustering across all 10 synthetic indices in real time.',
        actionLabel: 'Scan All Markets'
      },
      'confluence-ai': {
        tag: 'MULTI-INDICATOR ENGINE',
        title: 'Confluence AI',
        desc: 'Requires alignment between tick slope, digit parity, and barrier pressure before entry.',
        actionLabel: 'Run Confluence Check'
      },
      hedging: {
        tag: 'EXPOSURE PROTECTION',
        title: 'Dual-Contract Hedging Desk',
        desc: 'Pairs opposing Rise/Fall or Over/Under contracts to cap drawdown during high-volatility bursts.',
        actionLabel: 'Activate Hedge Pair'
      },
      'auto-trading': {
        tag: 'AUTONOMOUS SESSION SCHEDULER',
        title: 'Auto Trading Suite',
        desc: 'Hands-free execution with session profit lock, loss-streak pause, and market rotation.',
        actionLabel: 'Start Auto Session'
      },
      'signal-ai': {
        tag: 'LIVE ENTRY FEED',
        title: 'Signal AI Alerts',
        desc: 'Streams high-confidence digit and trend entry signals with one-click contract dispatch.',
        actionLabel: 'Execute Top Signal'
      },
      'manual-trader': {
        tag: 'DIRECT TICK TERMINAL',
        title: 'Manual Trader Desk',
        desc: 'Instant single-click Rise, Fall, Even, and Odd contract execution on live spot quotes.',
        actionLabel: 'Place Instant Contract'
      },
      'bulk-trader': {
        tag: 'BATCH ORDER DISPATCHER',
        title: 'Bulk Trader',
        desc: 'Launches staggered multi-contract bursts across selected synthetic volatility indices.',
        actionLabel: `Dispatch ${ordersCount} Contracts`
      },
      'copy-trader': {
        tag: 'ACCOUNT MIRRORING',
        title: 'Copy Trader Bridge',
        desc: 'Replicates master strategy entries across linked demo and live sub-accounts with stake scaling.',
        actionLabel: 'Sync Mirror Bridge'
      },
      chart: {
        tag: 'MULTI-INDEX PRICE FEED',
        title: 'Live Synthetic Charts',
        desc: 'High-precision tick-by-tick price movement monitor across Volatility 10 through 100.',
        actionLabel: 'Pin Live Chart'
      }
    };
    return (
      map[activeNav] || {
        tag: 'KINGSFX TRADING MODULE',
        title: activeNav.replace(/-/g, ' ').toUpperCase(),
        desc: 'Dedicated third-party Deriv execution workspace.',
        actionLabel: 'Execute Module'
      }
    );
  }, [activeNav, ordersCount]);

  const handleTrigger = () => {
    setExecuting(true);
    setTimeout(() => setExecuting(false), 1800);
    if (onLogEvent) {
      onLogEvent({
        time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
        msg: `[${moduleMeta.title}] ${moduleMeta.actionLabel} on ${market.label} (${stake} ${currency})`
      });
    }
  };

  return (
    <section className="kfx-light-workspace">
      <div className="kfx-pro-container">
        <div className="kfx-smart-banner">
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#B91C1C' }}>{moduleMeta.tag}</div>
            <h2 style={{ fontSize: 22, fontWeight: 900, color: '#111827', marginTop: 2 }}>
              {moduleMeta.title}
            </h2>
            <p style={{ fontSize: 12, color: '#4B5563', marginTop: 4 }}>{moduleMeta.desc}</p>
          </div>
          <button
            type="button"
            className="kfx-mini-btn is-ready"
            onClick={() => onNavigate('dashboard')}
          >
            Back to Dashboard
          </button>
        </div>

        <div className="kfx-panel-card">
          <div className="kfx-controls-grid">
            <div className="kfx-field">
              <label>Synthetic Market</label>
              <select value={marketId} onChange={(e) => setMarketId(e.target.value)}>
                {SYNTHETIC_MARKETS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="kfx-field">
              <label>Stake ({currency})</label>
              <input
                type="number"
                step="0.5"
                value={stake}
                onChange={(e) => setStake(Number(e.target.value) || 1)}
              />
            </div>

            {activeNav === 'bulk-trader' && (
              <div className="kfx-field">
                <label>Batch Size (Contracts)</label>
                <input
                  type="number"
                  min={2}
                  max={25}
                  value={ordersCount}
                  onChange={(e) => setOrdersCount(Number(e.target.value) || 5)}
                />
              </div>
            )}

            <div className="kfx-field">
              <label>Live Spot Quote</label>
              <input type="text" readOnly value={Number(spot).toFixed(market.decimals)} />
            </div>
          </div>

          {executing && (
            <div className="kfx-loader-track" style={{ marginTop: 14, background: '#E5E7EB' }}>
              <div className="kfx-loader-bar" />
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
            <button type="button" className="kfx-btn-primary" onClick={handleTrigger}>
              {executing ? 'Processing Order...' : moduleMeta.actionLabel}
            </button>
            <button
              type="button"
              className="kfx-mini-btn is-ready"
              onClick={() => onNavigate('analysis-tools')}
            >
              Open Digit Scanner
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
