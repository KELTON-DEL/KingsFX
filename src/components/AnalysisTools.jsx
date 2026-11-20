import React, { useMemo, useState } from 'react';
import { SYNTHETIC_MARKETS } from '../data/markets';

function computeMarketMetrics(ticks) {
  const sample = ticks.slice(-120);
  const total = sample.length || 1;
  const counts = Array(10).fill(0);
  let evenCount = 0;
  let over4Count = 0;
  let riseCount = 0;
  let fallCount = 0;

  sample.forEach((t, idx) => {
    const d = t.digit;
    counts[d] += 1;
    if (d % 2 === 0) evenCount += 1;
    if (d > 4) over4Count += 1;
    if (idx > 0) {
      if (t.price >= sample[idx - 1].price) riseCount += 1;
      else fallCount += 1;
    }
  });

  const digitPcts = counts.map((c) => Number(((c / total) * 100).toFixed(1)));
  const sorted = [...digitPcts].sort((a, b) => b - a);
  const top1 = sorted[0] ?? 0;
  const top2 = sorted[1] ?? 0;
  const low1 = sorted[sorted.length - 1] ?? 0;
  const low2 = sorted[sorted.length - 2] ?? 0;

  const evenPct = Number(((evenCount / total) * 100).toFixed(1));
  const oddPct = Number((100 - evenPct).toFixed(1));

  const moveTotal = riseCount + fallCount || 1;
  const risePct = Number(((riseCount / moveTotal) * 100).toFixed(1));
  const fallPct = Number((100 - risePct).toFixed(1));

  const over4Pct = Number(((over4Count / total) * 100).toFixed(1));
  const under5Pct = Number((100 - over4Pct).toFixed(1));

  const lastDigit = sample[sample.length - 1]?.digit ?? 0;
  const recent10 = sample.slice(-10).map((t) => t.digit);

  return {
    digitPcts,
    top1,
    top2,
    low1,
    low2,
    evenPct,
    oddPct,
    risePct,
    fallPct,
    over4Pct,
    under5Pct,
    lastDigit,
    recent10
  };
}

export default function AnalysisTools({
  ticksByMarket = {},
  logs = [],
  onClearLogs = () => {},
  feedMode = 'live-ws'
}) {
  const [toolMode, setToolMode] = useState('dcircles'); // 'normal' | 'dcircles'
  const [rightTab, setRightTab] = useState('journal'); // 'summary' | 'transactions' | 'journal'
  const [marketId, setMarketId] = useState('R_10');
  const [tradeType, setTradeType] = useState('Even/Odd');
  const [tickCount, setTickCount] = useState(120);
  const [filterText, setFilterText] = useState('');
  const [showFilterInput, setShowFilterInput] = useState(false);

  const market = SYNTHETIC_MARKETS.find((m) => m.id === marketId) || SYNTHETIC_MARKETS[0];
  const allTicks = ticksByMarket[market.id] || [];
  const sampleSize = Math.max(10, Math.min(allTicks.length || 120, Number(tickCount) || 120));
  const ticks = allTicks.slice(-sampleSize);
  const spotPrice = ticks[ticks.length - 1]?.price ?? market.base;

  const normalStats = useMemo(() => {
    const counts = Array(10).fill(0);
    let evenCount = 0;
    let oddCount = 0;

    ticks.forEach((t) => {
      const d = t.digit;
      counts[d] += 1;
      if (d % 2 === 0) evenCount += 1;
      else oddCount += 1;
    });

    const total = ticks.length || 1;
    const digitPcts = counts.map((c) => Number(((c / total) * 100).toFixed(2)));
    const maxPct = Math.max(...digitPcts);
    const minPct = Math.min(...digitPcts);

    const evenPct = Number(((evenCount / total) * 100).toFixed(1));
    const oddPct = Number((100 - evenPct).toFixed(1));

    const overProbs = [1, 2, 3, 4].map((barrier) => {
      const hits = ticks.filter((t) => t.digit > barrier).length;
      return { barrier, pct: Math.round((hits / total) * 100) };
    });

    const underProbs = [1, 2, 3, 4].map((barrier) => {
      const hits = ticks.filter((t) => t.digit < barrier).length;
      return { barrier, pct: Math.round((hits / total) * 100) };
    });

    return {
      digitPcts,
      maxPct,
      minPct,
      evenPct,
      oddPct,
      overProbs,
      underProbs
    };
  }, [ticks]);

  const dcirclesCards = useMemo(() => {
    return SYNTHETIC_MARKETS.map((m) => {
      const mTicks = ticksByMarket[m.id] || [];
      const latestPrice = mTicks[mTicks.length - 1]?.price ?? m.base;
      const metrics = computeMarketMetrics(mTicks);
      return {
        market: m,
        latestPrice,
        metrics
      };
    });
  }, [ticksByMarket]);

  const filteredLogs = useMemo(() => {
    if (!filterText.trim()) return logs;
    const q = filterText.toLowerCase();
    return logs.filter((l) => l.msg.toLowerCase().includes(q));
  }, [logs, filterText]);

  const handleDownloadLogs = () => {
    const lines = filteredLogs.length
      ? filteredLogs.map((l) => `[${l.time}] ${l.msg}`).join('\n')
      : 'KingsFX Analysis Journal — No trade events recorded yet.';
    const blob = new Blob([lines], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kingsfx-${rightTab}-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="kfx-analysis-shell">
      <div className="kfx-analysis-main">
        {/* Top Mode Switcher: Normal tool | Dcircles */}
        <div className="kfx-mode-strip">
          <button
            type="button"
            className={`kfx-mode-btn ${toolMode === 'normal' ? 'is-active' : ''}`}
            onClick={() => setToolMode('normal')}
          >
            Normal tool
          </button>
          <button
            type="button"
            className={`kfx-mode-btn ${toolMode === 'dcircles' ? 'is-active' : ''}`}
            onClick={() => setToolMode('dcircles')}
          >
            Dcircles
          </button>
        </div>

        {toolMode === 'dcircles' ? (
          <>
            <div className="kfx-dcircles-header">
              <div className="kfx-dcircles-title">Dcircles (Last 120 Ticks)</div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 11,
                  fontWeight: 800,
                  color: feedMode === 'live-ws' ? '#047857' : '#B45309',
                  background: feedMode === 'live-ws' ? '#ECFDF5' : '#FFFBEB',
                  border: `1px solid ${feedMode === 'live-ws' ? '#A7F3D0' : '#FDE68A'}`,
                  padding: '3px 10px',
                  borderRadius: 999
                }}
              >
                <span className="kfx-live-dot" />
                <span>
                  {feedMode === 'live-ws'
                    ? 'Deriv Live WebSocket Ticks'
                    : 'Live Tick Stream Active'}
                </span>
              </div>
            </div>

            <div className="kfx-dcircles-grid">
              {dcirclesCards.map(({ market: m, latestPrice, metrics }) => (
                <div
                  key={m.id}
                  className="kfx-dc-card"
                  onClick={() => {
                    setMarketId(m.id);
                  }}
                >
                  <div className="kfx-dc-card-top">
                    <div>
                      <div className="kfx-dc-market-name">{m.label}</div>
                      <div className="kfx-dc-spot">
                        {Number(latestPrice).toFixed(m.decimals)}
                      </div>
                    </div>
                    <span className="kfx-dc-badge-last">Last 120</span>
                  </div>

                  {/* 0-9 Digit Rings (5x2 Matrix) */}
                  <div className="kfx-dc-digits-matrix">
                    {metrics.digitPcts.map((pct, digit) => {
                      const isCurrent = metrics.lastDigit === digit;
                      let tone = '';
                      if (pct === metrics.top1 && pct > 0) tone = 'tone-green';
                      else if (pct === metrics.top2 && pct > 0) tone = 'tone-blue';
                      else if (pct === metrics.low1) tone = 'tone-red';
                      else if (pct === metrics.low2) tone = 'tone-amber';
                      else if (isCurrent) tone = 'tone-outline-blue';

                      return (
                        <div key={digit} className="kfx-dc-digit-item">
                          <div
                            className={`kfx-dc-circle ${tone} ${
                              isCurrent ? 'is-current' : ''
                            }`}
                          >
                            <span className="kfx-dc-num">{digit}</span>
                            <span className="kfx-dc-pct">{pct.toFixed(1)}%</span>
                          </div>
                          {isCurrent && <span className="kfx-dc-pointer" />}
                        </div>
                      );
                    })}
                  </div>

                  {/* Last 10 Digits Strip */}
                  <div className="kfx-dc-strip">
                    {metrics.recent10.map((d, idx) => (
                      <span
                        key={idx}
                        className={`kfx-dc-strip-cell ${
                          d % 2 === 0 ? 'is-even' : 'is-odd'
                        }`}
                      >
                        {d}
                      </span>
                    ))}
                  </div>

                  {/* 3 Split Probability Bars: Even/Odd, Rise/Fall, Over 4/Under 5 */}
                  <div className="kfx-dc-bars">
                    <div className="kfx-dc-split-bar">
                      <div
                        className="kfx-dc-seg-left"
                        style={{ width: `${metrics.evenPct}%` }}
                      >
                        Even: {metrics.evenPct.toFixed(1)}%
                      </div>
                      <div
                        className="kfx-dc-seg-right"
                        style={{ width: `${metrics.oddPct}%` }}
                      >
                        Odd: {metrics.oddPct.toFixed(1)}%
                      </div>
                    </div>

                    <div className="kfx-dc-split-bar">
                      <div
                        className="kfx-dc-seg-left"
                        style={{ width: `${metrics.risePct}%` }}
                      >
                        Rise: {metrics.risePct.toFixed(1)}%
                      </div>
                      <div
                        className="kfx-dc-seg-right"
                        style={{ width: `${metrics.fallPct}%` }}
                      >
                        Fall: {metrics.fallPct.toFixed(1)}%
                      </div>
                    </div>

                    <div className="kfx-dc-split-bar">
                      <div
                        className="kfx-dc-seg-left"
                        style={{ width: `${metrics.over4Pct}%` }}
                      >
                        Over 4: {metrics.over4Pct.toFixed(1)}%
                      </div>
                      <div
                        className="kfx-dc-seg-right"
                        style={{ width: `${metrics.under5Pct}%` }}
                      >
                        Under 5: {metrics.under5Pct.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="kfx-controls-grid">
              <div className="kfx-field">
                <label htmlFor="kfx-syn-market">Synthetic Market</label>
                <select
                  id="kfx-syn-market"
                  value={marketId}
                  onChange={(e) => setMarketId(e.target.value)}
                >
                  {SYNTHETIC_MARKETS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="kfx-field">
                <label htmlFor="kfx-trade-type">Trade Type</label>
                <select
                  id="kfx-trade-type"
                  value={tradeType}
                  onChange={(e) => setTradeType(e.target.value)}
                >
                  <option value="Even/Odd">Even/Odd</option>
                  <option value="Over/Under">Over/Under</option>
                  <option value="Matches/Differs">Matches/Differs</option>
                </select>
              </div>

              <div className="kfx-field" style={{ gridColumn: '1 / -1' }}>
                <label htmlFor="kfx-tick-count">Number of Ticks to Analyze</label>
                <input
                  id="kfx-tick-count"
                  type="number"
                  min={10}
                  max={140}
                  value={tickCount}
                  onChange={(e) => setTickCount(e.target.value)}
                />
              </div>
            </div>

            <div className="kfx-spot-banner">
              {Number(spotPrice).toFixed(market.decimals)}
            </div>

            <div className="kfx-digits-row">
              {normalStats.digitPcts.map((pct, digit) => {
                const isHot = pct === normalStats.maxPct && pct > 0;
                const isCold = pct === normalStats.minPct && !isHot;
                return (
                  <div key={digit} className="kfx-digit-cell">
                    <div
                      className={`kfx-digit-ring ${isHot ? 'is-hot' : ''} ${
                        isCold ? 'is-cold' : ''
                      }`}
                    >
                      {digit}
                    </div>
                    <div className="kfx-digit-pct">{pct.toFixed(2)}%</div>
                  </div>
                );
              })}
            </div>

            <div className="kfx-eo-stream">
              {ticks.slice(-22).map((t, idx) => {
                const isEven = t.digit % 2 === 0;
                return (
                  <span
                    key={`${t.time}-${idx}`}
                    className={`kfx-eo-badge ${isEven ? 'kfx-eo-e' : 'kfx-eo-o'}`}
                    title={`Price: ${t.price} · Digit: ${t.digit}`}
                  >
                    {isEven ? 'E' : 'O'}
                  </span>
                );
              })}
            </div>

            <div className="kfx-bars-card">
              <div className="kfx-bar-row">
                <span className="kfx-bar-label">Even</span>
                <div className="kfx-bar-track">
                  <div
                    className="kfx-bar-fill-even"
                    style={{ width: `${normalStats.evenPct}%` }}
                  >
                    {normalStats.evenPct.toFixed(1)}%
                  </div>
                </div>
              </div>

              <div className="kfx-bar-row">
                <span className="kfx-bar-label">Odd</span>
                <div className="kfx-bar-track">
                  <div
                    className="kfx-bar-fill-odd"
                    style={{ width: `${normalStats.oddPct}%` }}
                  >
                    {normalStats.oddPct.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>

            <div className="kfx-prob-card">
              <div style={{ fontSize: 13, fontWeight: 800 }}>Trading Probability Guide</div>
              <div className="kfx-prob-grid">
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      textAlign: 'center',
                      marginBottom: 6
                    }}
                  >
                    Over Probabilities
                  </div>
                  <table className="kfx-prob-table">
                    <thead>
                      <tr>
                        {normalStats.overProbs.map((item) => (
                          <th key={item.barrier}>{item.barrier}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {normalStats.overProbs.map((item) => (
                          <td key={item.barrier}>{item.pct}%</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      textAlign: 'center',
                      marginBottom: 6
                    }}
                  >
                    Under Probabilities
                  </div>
                  <table className="kfx-prob-table">
                    <thead>
                      <tr>
                        {normalStats.underProbs.map((item) => (
                          <th key={item.barrier}>{item.barrier}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        {normalStats.underProbs.map((item) => (
                          <td key={item.barrier}>{item.pct}%</td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Right Summary / Transactions / Journal Drawer */}
      <aside className="kfx-right-panel">
        <div>
          <div className="kfx-right-tabs">
            {['summary', 'transactions', 'journal'].map((tab) => (
              <button
                key={tab}
                type="button"
                className={`kfx-right-tab ${rightTab === tab ? 'is-active' : ''}`}
                onClick={() => setRightTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="kfx-right-actions">
            <button
              type="button"
              className="kfx-download-crimson"
              onClick={handleDownloadLogs}
            >
              Download
            </button>
            <button
              type="button"
              className="kfx-mini-btn is-ready"
              onClick={() => setShowFilterInput((v) => !v)}
            >
              Filters
            </button>
          </div>

          {showFilterInput && (
            <div style={{ padding: '8px 10px', borderBottom: '1px solid #E5E7EB' }}>
              <input
                type="text"
                className="kfx-search-input"
                placeholder="Filter journal messages..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              />
            </div>
          )}

          {!filteredLogs.length ? (
            <div className="kfx-empty-state">
              <div style={{ fontWeight: 700, color: '#6B7280' }}>
                There are no messages to display
              </div>
              <div style={{ marginTop: 8 }}>Here are the possible reasons:</div>
              <ul>
                <li>The bot is not running</li>
                <li>The stats are cleared</li>
                <li>All messages are filtered out</li>
              </ul>
            </div>
          ) : (
            <div
              style={{
                padding: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                maxHeight: 540,
                overflowY: 'auto'
              }}
            >
              {filteredLogs.map((entry, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 11,
                    padding: '8px 9px',
                    borderRadius: 6,
                    background: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    color: '#1F2937'
                  }}
                >
                  <div>{entry.msg}</div>
                  <div style={{ fontSize: 10, color: '#6B7280', marginTop: 3 }}>
                    {entry.time} GMT
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="kfx-reset-wrap">
          <button type="button" className="kfx-reset-crimson" onClick={onClearLogs}>
            Reset
          </button>
        </div>
      </aside>
    </section>
  );
}
