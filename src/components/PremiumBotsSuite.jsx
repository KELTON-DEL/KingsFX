import React, { useMemo, useState } from 'react';
import { BOT_CATALOG } from '../hooks/useIndependentBots';
import { SYNTHETIC_MARKETS } from '../data/markets';

const SCANNER_ROWS = [
  { market: 'V25', entry: 'Over 1', recovery: 'Odd', conf: 95, digit: 0, badgeClass: 'kfx-eo-e' },
  { market: 'V10', entry: 'Over 1', recovery: 'Odd', conf: 94, digit: 0, badgeClass: 'kfx-eo-o' },
  { market: 'V100 (1s)', entry: 'Under 7', recovery: 'Even', conf: 92, digit: 7, badgeClass: 'kfx-eo-e' },
  { market: 'V30 (1s)', entry: 'Over 2', recovery: 'Over 4', conf: 94, digit: 2, badgeClass: 'kfx-eo-e' },
  { market: 'V100', entry: 'Under 7', recovery: 'Even', conf: 93, digit: 7, badgeClass: 'kfx-eo-o' },
  { market: 'V15 (1s)', entry: 'Under 8', recovery: '—', conf: 83, digit: 9, badgeClass: 'kfx-eo-o' }
];

export default function PremiumBotsSuite({
  activeTab,
  botStates,
  onToggleBot,
  ticksByMarket,
  currency
}) {
  const [seriesFilter, setSeriesFilter] = useState('ALL');
  const [stake, setStake] = useState(1);
  const [takeProfit, setTakeProfit] = useState(10);
  const [stopLoss, setStopLoss] = useState(20);
  const [ticks, setTicks] = useState(1);
  const [martingaleOn, setMartingaleOn] = useState(true);
  const [multiplier, setMultiplier] = useState(2);
  const [safeMode, setSafeMode] = useState(false);

  const visibleBots = useMemo(() => {
    if (seriesFilter === 'ALL') return BOT_CATALOG;
    return BOT_CATALOG.filter((b) => b.series === seriesFilter);
  }, [seriesFilter]);

  const totals = useMemo(() => {
    let pnl = 0;
    let wins = 0;
    let losses = 0;
    let activeCount = 0;
    Object.values(botStates || {}).forEach((st) => {
      pnl += st.pnl || 0;
      wins += st.wins || 0;
      losses += st.losses || 0;
      if (st.running) activeCount += 1;
    });
    return {
      pnl: Number(pnl.toFixed(2)),
      wins,
      losses,
      activeCount
    };
  }, [botStates]);

  const smartBot = botStates['smart-recovery-ai'] || { running: false, phase: 'Idle' };
  const sampleMarket = SYNTHETIC_MARKETS[4];
  const latestDigit = ticksByMarket[sampleMarket.id]?.slice(-1)[0]?.digit ?? 7;

  return (
    <section className="kfx-bots-page">
      <div className="kfx-pro-container">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12
          }}
        >
          <div>
            <div className="kfx-workspace-tag">
              KINGSFX THIRD-PARTY DERIV ENGINE · {totals.activeCount} BOT(S) RUNNING INDEPENDENTLY
            </div>
            <h2 style={{ fontSize: 24, fontWeight: 900 }}>
              {activeTab === 'smart-ai' ? 'Smart Recovery AI & Premium Bots' : 'Premium AI Bots'}
            </h2>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['ALL', 'CORE SERIES', 'RECOVERY SERIES', 'MULTI-STRATEGY'].map((f) => (
              <button
                key={f}
                type="button"
                className={`kfx-filter-pill ${seriesFilter === f ? 'is-active' : ''}`}
                onClick={() => setSeriesFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Each Bot Runs on Its Own Independent Timer & Strategy */}
        <div className="kfx-bots-grid">
          {visibleBots.map((bot) => {
            const state = botStates[bot.id] || {
              running: false,
              phase: 'Idle',
              wins: 0,
              losses: 0,
              pnl: 0,
              lastSignal: 'Ready'
            };

            return (
              <div
                key={bot.id}
                className={`kfx-bot-card ${state.running ? 'is-running' : ''}`}
              >
                <div>
                  <div className="kfx-bot-top">
                    <span className="kfx-bot-icon" style={{ color: bot.accent }}>
                      {bot.icon}
                    </span>
                    <span className="kfx-prem-badge">
                      {state.running ? `● ${state.phase.toUpperCase()}` : 'PREMIUM'}
                    </span>
                  </div>

                  <div className="kfx-bot-series">{bot.series}</div>
                  <div className="kfx-bot-name">{bot.name}</div>
                  <div className="kfx-bot-desc">{bot.desc}</div>

                  <div className="kfx-bot-tags">
                    {bot.tags.map((tag) => (
                      <span key={tag} className="kfx-bot-tag">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {state.running && (
                    <div style={{ marginTop: 12 }}>
                      <div className="kfx-loader-track">
                        <div className="kfx-loader-bar" />
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: 11,
                          marginTop: 6,
                          color: '#A7F3D0',
                          fontWeight: 700
                        }}
                      >
                        <span>{state.lastSignal}</span>
                        <span>
                          {state.pnl >= 0 ? '+' : ''}
                          {state.pnl.toFixed(2)} {currency}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 11,
                      color: '#94A3B8',
                      marginBottom: 8,
                      fontWeight: 700
                    }}
                  >
                    <span>W: {state.wins} · L: {state.losses}</span>
                    <span>Every {(bot.intervalMs / 1000).toFixed(1)}s</span>
                  </div>

                  <button
                    type="button"
                    className="kfx-bot-cta"
                    style={{
                      background: state.running ? '#DC2626' : bot.accent,
                      color: bot.accent === '#F59E0B' && !state.running ? '#111827' : '#FFFFFF'
                    }}
                    onClick={() => onToggleBot(bot.id)}
                  >
                    <span>{state.running ? 'Stop Bot' : 'Load & Run Bot'}</span>
                    <span>{state.running ? '■' : '→'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Smart Recovery AI Control + Live Market Scanner */}
        <div className="kfx-light-workspace" style={{ borderRadius: 14 }}>
          <div className="kfx-smart-banner">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: '#4F46E5',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900
                }}
              >
                SR
              </div>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#6B7280' }}>
                  AUTOMATED STRATEGY
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#111827' }}>
                  Smart Recovery AI
                </div>
                <div style={{ fontSize: 12, color: '#4B5563' }}>
                  Pattern-led entries with automatic multi-market recovery.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span
                style={{
                  background: '#ECFDF5',
                  color: '#047857',
                  border: '1px solid #A7F3D0',
                  padding: '5px 10px',
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 800
                }}
              >
                ● Market feed connected
              </span>
              <span
                style={{
                  background: '#F3F4F6',
                  color: '#374151',
                  border: '1px solid #E5E7EB',
                  padding: '5px 10px',
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 800
                }}
              >
                {smartBot.running ? `Engine: ${smartBot.phase}` : 'Engine: ready'}
              </span>
            </div>
          </div>

          <div className="kfx-stat-row">
            <div className="kfx-stat-box">
              <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 700 }}>Session P/L</div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 900,
                  color: totals.pnl >= 0 ? '#059669' : '#DC2626',
                  marginTop: 4
                }}
              >
                {totals.pnl >= 0 ? '+' : ''}
                {totals.pnl.toFixed(2)} {currency}
              </div>
            </div>
            <div className="kfx-stat-box">
              <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 700 }}>Winning trades</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#059669', marginTop: 4 }}>
                {totals.wins}
              </div>
            </div>
            <div className="kfx-stat-box">
              <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 700 }}>Losing trades</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#DC2626', marginTop: 4 }}>
                {totals.losses}
              </div>
            </div>
            <div className="kfx-stat-box">
              <div style={{ fontSize: 11, color: '#6B7280', fontWeight: 700 }}>Current stake</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#2563EB', marginTop: 4 }}>
                {Number(stake).toFixed(2)} {currency}
              </div>
            </div>
          </div>

          <div className="kfx-split-grid">
            <div className="kfx-panel-card">
              <div style={{ fontSize: 10, fontWeight: 800, color: '#6B7280' }}>
                01 · CONFIGURE
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#111827', marginBottom: 12 }}>
                Strategy controls
              </div>

              <div className="kfx-controls-grid" style={{ padding: 0, border: 'none' }}>
                <div className="kfx-field">
                  <label>Stake ({currency})</label>
                  <input
                    type="number"
                    step="0.5"
                    value={stake}
                    onChange={(e) => setStake(Number(e.target.value) || 1)}
                  />
                </div>
                <div className="kfx-field">
                  <label>Take Profit</label>
                  <input
                    type="number"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(Number(e.target.value) || 10)}
                  />
                </div>
                <div className="kfx-field">
                  <label>Stop Loss</label>
                  <input
                    type="number"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(Number(e.target.value) || 20)}
                  />
                </div>
                <div className="kfx-field">
                  <label>Duration (Ticks)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={ticks}
                    onChange={(e) => setTicks(Number(e.target.value) || 1)}
                  />
                </div>
              </div>

              <div
                style={{
                  marginTop: 12,
                  padding: 10,
                  borderRadius: 8,
                  background: '#F9FAFB',
                  border: '1px solid #E5E7EB'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>
                    Martingale
                  </span>
                  <input
                    type="checkbox"
                    checked={martingaleOn}
                    onChange={(e) => setMartingaleOn(e.target.checked)}
                  />
                </div>
                {martingaleOn && (
                  <div className="kfx-field" style={{ marginTop: 8 }}>
                    <label>Multiplier</label>
                    <input
                      type="number"
                      step="0.5"
                      value={multiplier}
                      onChange={(e) => setMultiplier(Number(e.target.value) || 2)}
                    />
                  </div>
                )}
              </div>

              <label
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 12,
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#111827'
                }}
              >
                <span>Safe Mode (90%+ confidence)</span>
                <input
                  type="checkbox"
                  checked={safeMode}
                  onChange={(e) => setSafeMode(e.target.checked)}
                />
              </label>

              <button
                type="button"
                className="kfx-btn-purple"
                onClick={() => onToggleBot('smart-recovery-ai')}
              >
                {smartBot.running ? '■ Stop Smart AI' : '▶ Start AI'}
              </button>
            </div>

            <div className="kfx-panel-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#6B7280' }}>
                    02 · ANALYZE
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>
                    Live market scanner
                  </div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280' }}>
                  13 markets · Last digit: {latestDigit}
                </span>
              </div>

              <table className="kfx-scanner-table">
                <thead>
                  <tr>
                    <th>Market</th>
                    <th>Entry → Recovery</th>
                    <th>Conf</th>
                    <th>Digit</th>
                  </tr>
                </thead>
                <tbody>
                  {SCANNER_ROWS.map((row) => (
                    <tr key={row.market}>
                      <td>● {row.market}</td>
                      <td>
                        <span style={{ color: '#2563EB' }}>{row.entry}</span> →{' '}
                        <span style={{ color: '#D97706' }}>{row.recovery}</span>
                      </td>
                      <td style={{ color: row.conf >= 90 ? '#059669' : '#D97706' }}>
                        {row.conf}%
                      </td>
                      <td>
                        <span className={`kfx-eo-badge ${row.badgeClass}`}>{row.digit}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
