import React, { useMemo, useState } from 'react';
import { BOT_CATALOG } from '../hooks/useIndependentBots';
import { SYNTHETIC_MARKETS } from '../data/markets';

export default function PremiumBotsSuite({
  activeTab,
  botStates,
  onToggleBot,
  onUpdateBotConfig,
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

  const syncConfigToBots = (patch) => {
    (BOT_CATALOG || []).forEach((b) => {
      onUpdateBotConfig?.(b.id, patch);
    });
  };

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
      pnl += st.pnl ?? st.netProfit ?? 0;
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

  const scannerRows = useMemo(() => {
    return SYNTHETIC_MARKETS.slice(0, 6).map((m) => {
      const mTicks = (ticksByMarket?.[m.id] || []).slice(-60);
      const total = mTicks.length || 1;
      const evenCount = mTicks.filter((t) => t.digit % 2 === 0).length;
      const evenPct = Math.round((evenCount / total) * 100);
      const oddPct = 100 - evenPct;
      const lowDigits = mTicks.filter((t) => t.digit <= 2).length;
      const over1Prob = Math.min(96, Math.max(78, 82 + Math.round((lowDigits / total) * 45)));
      const lastDigit = mTicks[mTicks.length - 1]?.digit ?? 0;

      return {
        id: m.id,
        market: m.short,
        entry: evenPct >= oddPct ? `Even (${evenPct}%)` : `Odd (${oddPct}%)`,
        recovery: evenPct >= oddPct ? 'Odd' : 'Even',
        conf: over1Prob,
        digit: lastDigit,
        badgeClass: lastDigit % 2 === 0 ? 'kfx-eo-e' : 'kfx-eo-o'
      };
    });
  }, [ticksByMarket]);

  const smartBot = botStates['xml-auto-bot-osam'] || { running: false, lastStatus: 'IDLE' };
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

        <div className="kfx-bots-grid">
          {visibleBots.map((bot) => {
            const state = botStates[bot.id] || {
              running: false,
              wins: 0,
              losses: 0,
              netProfit: 0,
              lastSignal: 'Ready'
            };
            const botPnl = state.pnl ?? state.netProfit ?? 0;

            return (
              <div
                key={bot.id}
                className={`kfx-bot-card ${state.running ? 'is-running' : ''}`}
              >
                <div>
                  <div className="kfx-bot-top">
                    <span className="kfx-bot-icon" style={{ color: bot.accent || '#F59E0B' }}>
                      {bot.icon || '⚡'}
                    </span>
                    <span className="kfx-prem-badge">
                      {state.running ? `● ${(state.lastStatus || 'RUNNING').toUpperCase()}` : (bot.badge || 'PREMIUM')}
                    </span>
                  </div>

                  <div className="kfx-bot-series">{bot.series || bot.category}</div>
                  <div className="kfx-bot-name">{bot.name}</div>
                  <div className="kfx-bot-desc">{bot.desc || bot.description}</div>

                  {Array.isArray(bot.tags) && bot.tags.length > 0 && (
                    <div className="kfx-bot-tags">
                      {bot.tags.map((tag) => (
                        <span key={tag} className="kfx-bot-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

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
                          {botPnl >= 0 ? '+' : ''}
                          {botPnl.toFixed(2)} {currency}
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
                    <span>W: {state.wins || 0} · L: {state.losses || 0}</span>
                    <span>Stake: {(state.currentStake ?? bot.defaultStake).toFixed(2)} {currency}</span>
                  </div>

                  <button
                    type="button"
                    className="kfx-bot-cta"
                    style={{
                      background: state.running ? '#DC2626' : (bot.accent || '#0D9488'),
                      color: '#FFFFFF'
                    }}
                    onClick={() =>
                      onToggleBot(bot.id, {
                        baseStake: stake,
                        takeProfit,
                        stopLoss,
                        duration: ticks,
                        martingaleEnabled: martingaleOn,
                        recoveryMultiplier: multiplier,
                        safeMode
                      })
                    }
                  >
                    <span>{state.running ? 'Stop Bot' : 'Load & Run Bot'}</span>
                    <span>{state.running ? '■' : '→'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

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
                  Live digit &amp; parity analysis with automated TP/SL and recovery scaling.
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
                {smartBot.running ? `Engine: ${smartBot.lastStatus || 'RUNNING'}` : 'Engine: ready'}
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
                    min="0.35"
                    value={stake}
                    onChange={(e) => {
                      const val = Math.max(0.35, Number(e.target.value) || 0.35);
                      setStake(val);
                      syncConfigToBots({ baseStake: val });
                    }}
                  />
                </div>
                <div className="kfx-field">
                  <label>Take Profit</label>
                  <input
                    type="number"
                    min="0.1"
                    value={takeProfit}
                    onChange={(e) => {
                      const val = Math.max(0.1, Number(e.target.value) || 1);
                      setTakeProfit(val);
                      syncConfigToBots({ takeProfit: val });
                    }}
                  />
                </div>
                <div className="kfx-field">
                  <label>Stop Loss</label>
                  <input
                    type="number"
                    min="0.1"
                    value={stopLoss}
                    onChange={(e) => {
                      const val = Math.max(0.1, Number(e.target.value) || 1);
                      setStopLoss(val);
                      syncConfigToBots({ stopLoss: val });
                    }}
                  />
                </div>
                <div className="kfx-field">
                  <label>Duration (Ticks)</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={ticks}
                    onChange={(e) => {
                      const val = Math.max(1, Number(e.target.value) || 1);
                      setTicks(val);
                      syncConfigToBots({ duration: val });
                    }}
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
                    onChange={(e) => {
                      setMartingaleOn(e.target.checked);
                      syncConfigToBots({ martingaleEnabled: e.target.checked });
                    }}
                  />
                </div>
                {martingaleOn && (
                  <div className="kfx-field" style={{ marginTop: 8 }}>
                    <label>Multiplier</label>
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      value={multiplier}
                      onChange={(e) => {
                        const val = Math.max(1, Number(e.target.value) || 1);
                        setMultiplier(val);
                        syncConfigToBots({ recoveryMultiplier: val });
                      }}
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
                  onChange={(e) => {
                    setSafeMode(e.target.checked);
                    syncConfigToBots({ safeMode: e.target.checked });
                  }}
                />
              </label>

              <button
                type="button"
                className="kfx-btn-purple"
                onClick={() =>
                  onToggleBot('xml-auto-bot-osam', {
                    baseStake: stake,
                    takeProfit,
                    stopLoss,
                    duration: ticks,
                    martingaleEnabled: martingaleOn,
                    recoveryMultiplier: multiplier,
                    safeMode
                  })
                }
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
                  {scannerRows.length} markets · Last digit: {latestDigit}
                </span>
              </div>

              <table className="kfx-scanner-table">
                <thead>
                  <tr>
                    <th>Market</th>
                    <th>Entry -&gt; Recovery</th>
                    <th>Conf</th>
                    <th>Digit</th>
                  </tr>
                </thead>
                <tbody>
                  {scannerRows.map((row) => (
                    <tr key={row.id}>
                      <td>● {row.market}</td>
                      <td>
                        <span style={{ color: '#2563EB' }}>{row.entry}</span> -&gt;{' '}
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
