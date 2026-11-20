import React, { useMemo, useState } from 'react';
import { BLOCK_GROUPS, SYNTHETIC_MARKETS } from '../data/markets';

export default function Dashboard({ logs = [], onClearLogs = () => {} }) {
  const [search, setSearch] = useState('');
  const [rightTab, setRightTab] = useState('summary');
  const [market, setMarket] = useState('Volatility 100 (1s) Index');
  const [tradeType, setTradeType] = useState('Up/Down > Rise/Fall');
  const [contractType, setContractType] = useState('Both');
  const [candleInterval, setCandleInterval] = useState('1 minute');
  const [ticks, setTicks] = useState(1);
  const [stake, setStake] = useState(1);
  const [purchaseDir, setPurchaseDir] = useState('Rise');
  const [vhEnabled, setVhEnabled] = useState(false);

  const safeLogs = Array.isArray(logs) ? logs : [];

  const filteredGroups = useMemo(() => {
    return (BLOCK_GROUPS || []).filter((g) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        g.title.toLowerCase().includes(q) ||
        (g.items || []).some((item) => item.toLowerCase().includes(q))
      );
    });
  }, [search]);

  const visibleLogs = useMemo(() => {
    if (rightTab === 'transactions') {
      return safeLogs.filter((l) =>
        /contract|won|lost|stake|buy|order|\+/i.test(l.msg || '')
      );
    }
    if (rightTab === 'journal') {
      return safeLogs;
    }
    return safeLogs.slice(0, 12);
  }, [safeLogs, rightTab]);

  return (
    <section className="kfx-builder-shell">
      <aside className="kfx-builder-sidebar">
        <button
          type="button"
          className="kfx-quick-strat-btn"
          onClick={() => {
            setMarket('Volatility 100 (1s) Index');
            setTradeType('Digits > Even/Odd');
            setPurchaseDir('Even');
            setTicks(1);
            setStake(1);
          }}
        >
          Quick strategy
        </button>

        <input
          type="text"
          className="kfx-search-input"
          placeholder="Search blocks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {filteredGroups.map((group) => (
          <div key={group.id}>
            <div className="kfx-menu-item">
              <span>{group.title}</span>
              <span>{group.collapsible ? 'v' : ''}</span>
            </div>
          </div>
        ))}
      </aside>

      <div className="kfx-canvas-area">
        <div className="kfx-blocks-layout">
          <div>
            <div className="kfx-cblock">
              <div className="kfx-cblock-title">1. Trade parameters</div>
              <div className="kfx-cblock-body">
                <div className="kfx-inline-row">
                  <span>Market:</span>
                  <select value={market} onChange={(e) => setMarket(e.target.value)}>
                    {SYNTHETIC_MARKETS.map((m) => (
                      <option key={m.id} value={`${m.label} Index`}>
                        {m.label} Index
                      </option>
                    ))}
                  </select>
                </div>

                <label className="kfx-inline-row">
                  <input type="checkbox" defaultChecked={false} />
                  <span>Alternate markets (Continuous Indices only)</span>
                </label>

                <label className="kfx-inline-row">
                  <input type="checkbox" defaultChecked={false} />
                  <span>Auto-scan volatility markets and trade first match</span>
                </label>

                <div className="kfx-inline-row">
                  <input
                    type="checkbox"
                    checked={vhEnabled}
                    onChange={(e) => setVhEnabled(e.target.checked)}
                  />
                  <span>Virtual Hook:</span>
                  <button
                    type="button"
                    className="kfx-vh-btn"
                    onClick={() => setVhEnabled((v) => !v)}
                  >
                    VH Settings
                  </button>
                </div>

                <div className="kfx-inline-row">
                  <span>Trade Type:</span>
                  <select value={tradeType} onChange={(e) => setTradeType(e.target.value)}>
                    <option value="Up/Down > Rise/Fall">Up/Down &gt; Rise/Fall</option>
                    <option value="Digits > Even/Odd">Digits &gt; Even/Odd</option>
                    <option value="Digits > Over/Under">Digits &gt; Over/Under</option>
                  </select>
                </div>

                <div className="kfx-inline-row">
                  <span>Contract Type:</span>
                  <select value={contractType} onChange={(e) => setContractType(e.target.value)}>
                    <option value="Both">Both</option>
                    <option value="Call">Call / Rise</option>
                    <option value="Put">Put / Fall</option>
                  </select>
                </div>

                <div className="kfx-inline-row">
                  <span>Default Candle Interval:</span>
                  <select
                    value={candleInterval}
                    onChange={(e) => setCandleInterval(e.target.value)}
                  >
                    <option value="1 minute">1 minute</option>
                    <option value="5 minutes">5 minutes</option>
                  </select>
                </div>

                <div
                  style={{
                    background: '#A50E1A',
                    color: '#FFFFFF',
                    padding: '8px 10px',
                    borderRadius: 6
                  }}
                >
                  <div style={{ fontWeight: 800, marginBottom: 6 }}>Run once at start:</div>
                  <div
                    style={{
                      background: '#F3F4F6',
                      color: '#111827',
                      padding: 8,
                      borderRadius: 4
                    }}
                    className="kfx-inline-row"
                  >
                    <strong>Trade options:</strong>
                    <span>Duration: Ticks</span>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={ticks}
                      onChange={(e) => setTicks(Number(e.target.value) || 1)}
                      style={{ width: 46 }}
                    />
                    <span>Stake: USD</span>
                    <input
                      type="number"
                      min={0.35}
                      step="0.5"
                      value={stake}
                      onChange={(e) => setStake(Number(e.target.value) || 1)}
                      style={{ width: 54 }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="kfx-cblock">
              <div className="kfx-cblock-title">2. Purchase conditions</div>
              <div className="kfx-cblock-body">
                <div className="kfx-inline-row">
                  <span>Purchase</span>
                  <select value={purchaseDir} onChange={(e) => setPurchaseDir(e.target.value)}>
                    <option value="Rise">Rise</option>
                    <option value="Fall">Fall</option>
                    <option value="Even">Even</option>
                    <option value="Odd">Odd</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="kfx-cblock">
              <div className="kfx-cblock-title">3. Sell conditions</div>
              <div className="kfx-cblock-body">
                <span>if Sell is available then</span>
              </div>
            </div>

            <div className="kfx-cblock">
              <div className="kfx-cblock-title">4. Restart trading conditions</div>
              <div className="kfx-cblock-body">
                <span>Trade again</span>
              </div>
            </div>
          </div>
        </div>
      </div>

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

          {!visibleLogs.length ? (
            <div className="kfx-empty-state">
              <div style={{ fontWeight: 700, color: '#4B5563' }}>
                {safeLogs.length ? `No ${rightTab} entries yet` : 'Ready to run strategy'}
              </div>
            </div>
          ) : (
            <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 420, overflowY: 'auto' }}>
              {visibleLogs.map((entry, idx) => (
                <div
                  key={idx}
                  style={{
                    fontSize: 11,
                    padding: '7px 9px',
                    borderRadius: 6,
                    background: '#F9FAFB',
                    border: '1px solid #E5E7EB',
                    color: '#111827'
                  }}
                >
                  <div>{entry.msg}</div>
                  <div style={{ fontSize: 10, color: '#6B7280', marginTop: 2 }}>{entry.time}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="kfx-reset-wrap">
          <button type="button" className="kfx-reset-btn" onClick={onClearLogs}>
            Reset
          </button>
        </div>
      </aside>
    </section>
  );
}
