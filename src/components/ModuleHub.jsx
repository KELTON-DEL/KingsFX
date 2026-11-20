import React, { useState } from 'react';
import { SYNTHETIC_MARKETS } from '../data/markets';

const PRESET_BOTS = [
  { id: 'sv7', name: 'SV 7 Digit Sniper', mode: 'Even / Odd', stake: 1.0, winRate: '68%' },
  { id: 'miner', name: 'KingsFX Profit Miner', mode: 'Over / Under (2)', stake: 1.5, winRate: '72%' },
  { id: 'pulse', name: 'Volatility Pulse Scalper', mode: 'Rise / Fall', stake: 0.5, winRate: '64%' },
  { id: 'hedge', name: 'Dual-Barrier Hedge Bot', mode: 'Matches / Differs', stake: 2.0, winRate: '70%' }
];

export default function ModuleHub({ activeNav, ticksByMarket, onNavigate, onLogEvent }) {
  const [selectedMarket, setSelectedMarket] = useState('R_100');
  const [stake, setStake] = useState(1);
  const [batchCount, setBatchCount] = useState(5);

  const market =
    SYNTHETIC_MARKETS.find((m) => m.id === selectedMarket) || SYNTHETIC_MARKETS[0];
  const latestTick = ticksByMarket[market.id]?.slice(-1)[0]?.price ?? market.base;

  const triggerAction = (label) => {
    const time = new Date().toLocaleTimeString('en-GB', { hour12: false });
    if (onLogEvent) {
      onLogEvent({ time, msg: `${label} on ${market.label} (Stake: ${stake})` });
    }
  };

  return (
    <section className="kfx-dash-wrap">
      <div className="kfx-dash-inner">
        <div className="kfx-overview-card">
          <div className="kfx-overview-top">
            <div>
              <div className="kfx-workspace-tag">KINGSFX MODULE · {activeNav.toUpperCase()}</div>
              <h2 style={{ fontSize: 22, fontWeight: 900, marginTop: 4 }}>
                {activeNav
                  .split('-')
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(' ')}
              </h2>
            </div>

            <button
              type="button"
              className="kfx-btn-ghost"
              onClick={() => onNavigate('dashboard')}
            >
              ← Back to Dashboard
            </button>
          </div>

          <p className="kfx-hero-sub" style={{ marginBottom: 14 }}>
            Active market: <strong>{market.label}</strong> · Live spot:{' '}
            <strong>{Number(latestTick).toFixed(market.decimals)}</strong>
          </p>

          <div className="kfx-controls-grid" style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.14)' }}>
            <div className="kfx-field">
              <label style={{ color: '#F9FAFB' }}>Target Market</label>
              <select
                value={selectedMarket}
                onChange={(e) => setSelectedMarket(e.target.value)}
              >
                {SYNTHETIC_MARKETS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="kfx-field">
              <label style={{ color: '#F9FAFB' }}>Stake Amount</label>
              <input
                type="number"
                min={0.35}
                step="0.5"
                value={stake}
                onChange={(e) => setStake(Number(e.target.value) || 0.35)}
              />
            </div>

            {activeNav === 'bulk-trader' && (
              <div className="kfx-field">
                <label style={{ color: '#F9FAFB' }}>Batch Contracts</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={batchCount}
                  onChange={(e) => setBatchCount(Number(e.target.value) || 1)}
                />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="kfx-btn-primary"
              onClick={() =>
                triggerAction(
                  activeNav === 'bulk-trader'
                    ? `Queued ${batchCount} bulk orders`
                    : `Executed ${activeNav}`
                )
              }
            >
              {activeNav === 'bulk-trader' ? `Queue ${batchCount} Trades` : 'Deploy Strategy'}
            </button>

            <button
              type="button"
              className="kfx-btn-ghost"
              onClick={() => onNavigate('bot-builder')}
            >
              Open in Bot Builder
            </button>

            <button
              type="button"
              className="kfx-btn-ghost"
              onClick={() => onNavigate('analysis-tools')}
            >
              Inspect Digit Scanner
            </button>
          </div>
        </div>

        <div className="kfx-tools-grid">
          {PRESET_BOTS.map((bot) => (
            <div key={bot.id} className="kfx-tool-card">
              <div>
                <div className="kfx-tool-title">{bot.name}</div>
                <div className="kfx-tool-desc">
                  Strategy: {bot.mode} · Est. hit rate: {bot.winRate}
                </div>
              </div>
              <button
                type="button"
                className="kfx-btn-primary"
                onClick={() => triggerAction(`Loaded ${bot.name}`)}
              >
                Load Bot
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}