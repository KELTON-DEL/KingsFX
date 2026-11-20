import React, { useMemo, useState } from "react";
import FooterBar from "./FooterBar";
import { useBotExecution } from "../hooks/useBotExecution";
import "../styles/builder.css";

const BLOCK_CATEGORIES = [
  { id: "analysis-logics", label: "Analysis Logics🔥", expandable: false },
  { id: "trade-parameters", label: "Trade parameters", expandable: false },
  { id: "purchase-conditions", label: "Purchase conditions", expandable: false },
  { id: "sell-conditions", label: "Sell conditions (optional)", expandable: false },
  { id: "restart-conditions", label: "Restart trading conditions", expandable: false },
  {
    id: "analysis",
    label: "Analysis",
    expandable: true,
    items: ["Indicators", "Tick and candle analysis", "Contract", "Stats"],
  },
  {
    id: "utility",
    label: "Utility",
    expandable: true,
    items: [
      "Virtual Hook Switcher",
      "Custom Notification",
      "MkoreanWWN",
      "Contract modifiers",
      "Risk & Martingale settings",
    ],
  },
];

/**
 * BotBuilder.jsx
 * - Does NOT start automatically when opened (waits until Run is clicked in FooterBar).
 * - Does NOT render a duplicate Run/Stop button inside the builder canvas;
 *   FooterBar controls and communicates live execution state with the Bot Builder.
 */
export default function BotBuilder() {
  const [searchQuery, setSearchQuery] = useState("");
  const [blocksMenuOpen, setBlocksMenuOpen] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState({
    analysis: true,
    utility: true,
  });
  const [rightTab, setRightTab] = useState("summary");
  const [zoom, setZoom] = useState(1);

  const [market, setMarket] = useState("Volatility 10 (1s) Index");
  const [tradeType, setTradeType] = useState("Over/Under");
  const [contractType, setContractType] = useState("Under");
  const [candleInterval, setCandleInterval] = useState("1 minute");
  const [entryPointDigit, setEntryPointDigit] = useState("7");
  const [stake, setStake] = useState("1");
  const [expectedProfit, setExpectedProfit] = useState("100");
  const [stopLoss, setStopLoss] = useState("1000");
  const [martingaleSplit, setMartingaleSplit] = useState("2.55");
  const [payoutPct, setPayoutPct] = useState("39");
  const [predBeforeLoss, setPredBeforeLoss] = useState("9");
  const [predAfterLoss, setPredAfterLoss] = useState("6");

  const {
    isRunning,
    contractBoughtActive,
    activeStatusLabel,
    tickCount,
    tickProgress,
    runsCount,
    contractsWon,
    contractsLost,
    totalStake,
    totalPayout,
    sessionProfit,
    contractProfitLoss,
    contractValue,
    journalLogs,
    toggleRunStop,
    resetStats,
  } = useBotExecution(stake, market, contractType);

  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return BLOCK_CATEGORIES;
    return BLOCK_CATEGORIES.map((cat) => {
      const catMatch = cat.label.toLowerCase().includes(q);
      const matchedItems = (cat.items || []).filter((item) =>
        item.toLowerCase().includes(q)
      );
      if (catMatch || matchedItems.length > 0) {
        return { ...cat, items: matchedItems.length > 0 ? matchedItems : cat.items };
      }
      return null;
    }).filter(Boolean);
  }, [searchQuery]);

  const toggleGroup = (id) => {
    setExpandedGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const applyQuickStrategy = () => {
    setEntryPointDigit("7");
    setStake("1");
    setExpectedProfit("100");
    setStopLoss("1000");
    setMartingaleSplit("2.55");
    setPredBeforeLoss("9");
    setPredAfterLoss("6");
  };

  return (
    <div className="bot-builder-shell">
      <div className="bb-workspace">
        <aside className="bb-left-sidebar">
          <button
            type="button"
            onClick={applyQuickStrategy}
            className="bb-quick-strategy-btn"
          >
            Quick strategy
          </button>

          <div
            className="bb-blocks-header"
            onClick={() => setBlocksMenuOpen((o) => !o)}
            style={{ cursor: "pointer" }}
          >
            <span>Blocks menu</span>
            <span>{blocksMenuOpen ? "˄" : "˅"}</span>
          </div>

          {blocksMenuOpen && (
            <>
              <div className="bb-search-wrap">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search"
                  className="bb-search-input"
                />
              </div>

              <div className="bb-blocks-list">
                {filteredCategories.map((cat) => (
                  <div key={cat.id}>
                    <button
                      type="button"
                      onClick={() => (cat.expandable ? toggleGroup(cat.id) : null)}
                      className={`bb-category-btn ${cat.expandable ? "is-group" : ""}`}
                    >
                      <span>{cat.label}</span>
                      {cat.expandable && <span>{expandedGroups[cat.id] ? "˄" : "˅"}</span>}
                    </button>

                    {cat.expandable && expandedGroups[cat.id] && cat.items && (
                      <div className="bb-sub-list">
                        {cat.items.map((sub) => (
                          <div key={sub} className="bb-sub-item">
                            <span>{sub}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="bb-risk-disclaimer">⚠ Risk Disclaimer</div>
        </aside>

        <main className="bb-canvas-area">
          <div className="bb-toolbar">
            <button type="button" className="bb-tool-btn" title="Refresh" onClick={applyQuickStrategy}>
              ↻
            </button>
            <button type="button" className="bb-tool-btn" title="Load strategy">
              📂
            </button>
            <button type="button" className="bb-tool-btn" title="Save strategy">
              💾
            </button>
            <button type="button" className="bb-tool-btn" title="Structure">
              ☰
            </button>
            <button type="button" className="bb-tool-btn" title="Indicators">
              📊
            </button>
            <button type="button" className="bb-tool-btn" title="Grid">
              ⊞
            </button>
            <button type="button" className="bb-tool-btn" title="Performance">
              📈
            </button>
            <button type="button" className="bb-tool-btn" title="Undo">
              ↶
            </button>
            <button type="button" className="bb-tool-btn" title="Redo">
              ↷
            </button>
            <button
              type="button"
              className="bb-tool-btn"
              title="Zoom in"
              onClick={() => setZoom((z) => Math.min(1.25, Number((z + 0.05).toFixed(2))))}
            >
              +
            </button>
            <button
              type="button"
              className="bb-tool-btn"
              title="Zoom out"
              onClick={() => setZoom((z) => Math.max(0.75, Number((z - 0.05).toFixed(2))))}
            >
              -
            </button>
          </div>

          <div className="bb-canvas-stage" style={{ transform: `scale(${zoom})` }}>
            <div className="bb-canvas-row">
              <div className="bb-block-stack">
                <section className="bb-block">
                  <div className="bb-block-title">
                    <span>1. Trade parameters</span>
                    <span>▾</span>
                  </div>

                  <div className="bb-block-body">
                    <div className="bb-field-row">
                      <span>Market: synthetic_index &gt; random_index &gt;</span>
                      <select
                        value={market}
                        onChange={(e) => setMarket(e.target.value)}
                        className="bb-pill-select"
                      >
                        <option>Volatility 10 (1s) Index</option>
                        <option>Volatility 25 (1s) Index</option>
                        <option>Volatility 75 (1s) Index</option>
                      </select>
                    </div>

                    <div className="bb-field-row">
                      <span>Alternate markets (Continuous Indices only):</span>
                      <input type="checkbox" />
                      <span>every</span>
                      <input type="text" defaultValue="1" className="bb-pill-input short" />
                      <span>run(s)</span>
                    </div>

                    <div className="bb-field-row">
                      <span>Auto-scan volatility markets and trade first match:</span>
                      <input type="checkbox" />
                    </div>

                    <div className="bb-field-row">
                      <span>Virtual Hook:</span>
                      <span className="bb-pill-select">VH Settings</span>
                    </div>

                    <div className="bb-field-row">
                      <span>Trade Type: Digits &gt;</span>
                      <select
                        value={tradeType}
                        onChange={(e) => setTradeType(e.target.value)}
                        className="bb-pill-select"
                      >
                        <option>Over/Under</option>
                        <option>Matches/Differs</option>
                        <option>Even/Odd</option>
                      </select>
                    </div>

                    <div className="bb-field-row">
                      <span>Contract Type:</span>
                      <select
                        value={contractType}
                        onChange={(e) => setContractType(e.target.value)}
                        className="bb-pill-select"
                      >
                        <option>Under</option>
                        <option>Over</option>
                      </select>
                    </div>

                    <div className="bb-field-row">
                      <span>Default Candle Interval:</span>
                      <select
                        value={candleInterval}
                        onChange={(e) => setCandleInterval(e.target.value)}
                        className="bb-pill-select"
                      >
                        <option>1 minute</option>
                        <option>2 minutes</option>
                        <option>5 minutes</option>
                      </select>
                    </div>

                    <div className="bb-field-row">
                      <span>Restart buy/sell on error (disable for better performance):</span>
                      <input type="checkbox" />
                    </div>

                    <div className="bb-field-row">
                      <span>Restart last trade on error (bot ignores the unsuccessful trade):</span>
                      <input type="checkbox" defaultChecked />
                    </div>

                    <div className="bb-sub-section-label">Run once at start:</div>

                    <div className="bb-field-row">
                      <span>set</span>
                      <span className="bb-pill-select">Entrypoint-Digit</span>
                      <span>to</span>
                      <input
                        type="text"
                        value={entryPointDigit}
                        onChange={(e) => setEntryPointDigit(e.target.value)}
                        className="bb-pill-input short"
                      />
                    </div>

                    <div className="bb-field-row">
                      <span>set</span>
                      <span className="bb-pill-select">Stake</span>
                      <span>to</span>
                      <input
                        type="text"
                        value={stake}
                        onChange={(e) => setStake(e.target.value)}
                        className="bb-pill-input short"
                      />
                    </div>

                    <div className="bb-field-row">
                      <span>set</span>
                      <span className="bb-pill-select">Expected Profit</span>
                      <span>to</span>
                      <input
                        type="text"
                        value={expectedProfit}
                        onChange={(e) => setExpectedProfit(e.target.value)}
                        className="bb-pill-input med"
                      />
                    </div>

                    <div className="bb-field-row">
                      <span>set</span>
                      <span className="bb-pill-select">Stop Loss</span>
                      <span>to</span>
                      <input
                        type="text"
                        value={stopLoss}
                        onChange={(e) => setStopLoss(e.target.value)}
                        className="bb-pill-input med"
                      />
                    </div>

                    <div className="bb-field-row">
                      <span>set Initial Stake to Stake</span>
                    </div>

                    <div className="bb-field-row">
                      <span>set Martingale Split to</span>
                      <input
                        type="text"
                        value={martingaleSplit}
                        onChange={(e) => setMartingaleSplit(e.target.value)}
                        className="bb-pill-input short"
                      />
                    </div>

                    <div className="bb-field-row">
                      <span>set Payout % to</span>
                      <input
                        type="text"
                        value={payoutPct}
                        onChange={(e) => setPayoutPct(e.target.value)}
                        className="bb-pill-input short"
                      />
                    </div>

                    <div className="bb-field-row">
                      <span>set Prediction to Prediction...</span>
                    </div>

                    <div className="bb-field-row">
                      <span>set Analysis to analysis</span>
                    </div>

                    <div className="bb-field-row">
                      <span>set</span>
                      <span className="bb-pill-select">Prediction before loss</span>
                      <span>to</span>
                      <input
                        type="text"
                        value={predBeforeLoss}
                        onChange={(e) => setPredBeforeLoss(e.target.value)}
                        className="bb-pill-input short"
                      />
                    </div>

                    <div className="bb-field-row">
                      <span>set</span>
                      <span className="bb-pill-select">Prediction after loss</span>
                      <span>to</span>
                      <input
                        type="text"
                        value={predAfterLoss}
                        onChange={(e) => setPredAfterLoss(e.target.value)}
                        className="bb-pill-input short"
                      />
                    </div>

                    <div className="bb-sub-section-label">Trade options:</div>
                    <div className="bb-field-row">
                      <span className="bb-pill-select">Duration: Ticks 1 Stake: US...</span>
                    </div>
                  </div>
                </section>

                <section className="bb-block">
                  <div className="bb-block-title">
                    <span>2. Purchase conditions</span>
                    <span>▾</span>
                  </div>
                  <div className="bb-block-body">
                    <div className="bb-sub-section-label">
                      The content of this block is called on every tick
                    </div>
                    <div className="bb-field-row">
                      <span>set</span>
                      <span className="bb-pill-select">Tick 1</span>
                      <span>to</span>
                      <span>in list Last digits list get</span>
                      <span className="bb-pill-select"># from end</span>
                      <input type="text" defaultValue="1" className="bb-pill-input short" />
                    </div>
                    <div className="bb-field-row">
                      <span>set</span>
                      <span className="bb-pill-select">text</span>
                      <span>to create text with</span>
                    </div>
                    <div className="bb-field-row">
                      <span className="bb-pill-select">Last Appearing Digit&gt; |</span>
                      <span>+</span>
                    </div>
                    <div className="bb-field-row">
                      <span className="bb-pill-select">Tick 1</span>
                      <span>+</span>
                    </div>
                  </div>
                </section>
              </div>

              <div style={{ width: "170px", paddingTop: "4px" }}>
                <div className="bb-block" style={{ padding: "6px 8px" }}>
                  <div className="bb-block-title" style={{ marginBottom: 0, borderBottom: "none" }}>
                    <span>4. Restart trading conditions</span>
                    <span>▾</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="bb-trash-bin"
            title="Clear selected block"
            onClick={applyQuickStrategy}
          >
            🗑
          </button>
        </main>

        <aside className="bb-right-panel">
          <div className="bb-panel-tabs">
            <button
              type="button"
              onClick={() => setRightTab("summary")}
              className={`bb-panel-tab ${rightTab === "summary" ? "active" : ""}`}
            >
              Summary
            </button>
            <button
              type="button"
              onClick={() => setRightTab("transactions")}
              className={`bb-panel-tab ${rightTab === "transactions" ? "active" : ""}`}
            >
              Transactions
            </button>
            <button
              type="button"
              onClick={() => setRightTab("journal")}
              className={`bb-panel-tab ${rightTab === "journal" ? "active" : ""}`}
            >
              Journal
            </button>
          </div>

          {rightTab === "summary" && (
            <div className="bb-summary-content">
              <div className="bb-contract-card">
                <div className="bb-contract-top">
                  <span>{isRunning ? market : "Idle"}</span>
                  <span>⇄ {contractType}</span>
                </div>
                <div className="bb-tick-bar-track">
                  <div
                    className="bb-tick-bar-fill"
                    style={{ width: `${isRunning ? Math.min(100, tickCount * 12 + 10) : 0}%` }}
                  />
                </div>
                <div style={{ fontSize: "11px", marginBottom: "8px" }}>
                  {isRunning ? `Tick ${tickCount}` : "Waiting to run"}
                </div>
                <span className="bb-usd-pill">USD</span>

                <div className="bb-metrics-grid">
                  <div>
                    <div className="bb-metric-label">Total profit/loss:</div>
                    <div
                      className={`bb-metric-val ${contractProfitLoss < 0 ? "loss" : "profit"}`}
                    >
                      {contractProfitLoss < 0
                        ? `-KSH ${Math.abs(contractProfitLoss).toFixed(2)} ▼`
                        : `+KSH ${contractProfitLoss.toFixed(2)} ▲`}
                    </div>
                  </div>
                  <div>
                    <div className="bb-metric-label">Contract value:</div>
                    <div className="bb-metric-val loss">KSH {contractValue.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="bb-metric-label">Stake:</div>
                    <div className="bb-metric-val">KSH {(parseFloat(stake) || 1).toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="bb-metric-label">Potential payout:</div>
                    <div className="bb-metric-val">KSH {((parseFloat(stake) || 1) * 1.85).toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {rightTab === "transactions" && (
            <div className="bb-summary-content">
              <div style={{ fontSize: "11.5px", color: "#475569" }}>
                Market: <strong>{market}</strong> ({contractType})
              </div>
              <div style={{ fontSize: "11px", color: "#64748b" }}>
                Status: {isRunning ? "Running" : "Stopped"} | Runs: {runsCount} | Won: {contractsWon} | Lost: {contractsLost}
              </div>
            </div>
          )}

          {rightTab === "journal" && (
            <div className="bb-summary-content">
              {journalLogs.map((entry, idx) => (
                <div
                  key={idx}
                  style={{
                    fontSize: "10.5px",
                    padding: "6px 8px",
                    borderRadius: "5px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  {entry}
                </div>
              ))}
            </div>
          )}

          <div className="bb-stats-footer-box">
            <div className="bb-stats-3col">
              <div>
                <div className="bb-metric-label">Total stake</div>
                <div className="bb-stat-num">KSH {totalStake.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
              </div>
              <div>
                <div className="bb-metric-label">Total payout</div>
                <div className="bb-stat-num">KSH {totalPayout.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
              </div>
              <div>
                <div className="bb-metric-label">No. of runs</div>
                <div className="bb-stat-num">{runsCount}</div>
              </div>
            </div>

            <div className="bb-stats-3col" style={{ marginBottom: "10px" }}>
              <div>
                <div className="bb-metric-label">Contracts lost</div>
                <div className="bb-stat-num">{contractsLost}</div>
              </div>
              <div>
                <div className="bb-metric-label">Contracts won</div>
                <div className="bb-stat-num">{contractsWon}</div>
              </div>
              <div>
                <div className="bb-metric-label">Total profit/loss</div>
                <div
                  className="bb-stat-num"
                  style={{ color: sessionProfit >= 0 ? "#059669" : "#dc2626" }}
                >
                  {sessionProfit >= 0 ? `+KSH ${sessionProfit.toFixed(2)}` : `-KSH ${Math.abs(sessionProfit).toFixed(2)}`}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={resetStats}
              className={`bb-reset-btn ${!isRunning ? "ready" : ""}`}
            >
              Reset
            </button>
          </div>
        </aside>
      </div>

      <FooterBar
        isRunning={isRunning}
        onToggleRunStop={toggleRunStop}
        contractBoughtActive={contractBoughtActive}
        activeStatusLabel={activeStatusLabel}
        tickProgress={tickProgress}
      />
    </div>
  );
}