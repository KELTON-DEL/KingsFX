import React, { useEffect, useMemo, useRef, useState } from 'react';
import { SYNTHETIC_MARKETS } from '../data/markets';
import { NavIcon } from './Icons';
import '../styles/builder.css';

const SIDEBAR_ITEMS = [
  {
    id: 'analysis-logics',
    label: 'Analysis Logics',
    badgeIcon: 'quick-bot',
    children: [
      { id: 'al-1', name: 'Even/Odd 3-Tick Streak', targetBlock: 'trade-params', preset: { tradeType: 'Digits > Even/Odd', prediction: 2 } },
      { id: 'al-2', name: 'Over/Under Digit Pressure', targetBlock: 'trade-params', preset: { tradeType: 'Digits > Over/Under', prediction: 9 } },
      { id: 'al-3', name: 'Volatility Trend Confirmation', targetBlock: 'trade-params', preset: { tradeType: 'Up/Down > Rise/Fall' } }
    ]
  },
  {
    id: 'trade-parameters',
    label: 'Trade parameters',
    targetBlock: 'trade-params'
  },
  {
    id: 'purchase-conditions',
    label: 'Purchase conditions',
    targetBlock: 'purchase-cond'
  },
  {
    id: 'sell-conditions',
    label: 'Sell conditions (optional)',
    targetBlock: 'sell-cond'
  },
  {
    id: 'restart-conditions',
    label: 'Restart trading conditions',
    targetBlock: 'restart-cond'
  },
  {
    id: 'analysis',
    label: 'Analysis',
    collapsible: true,
    children: [
      { id: 'an-1', name: 'Digit Frequency Scanner', action: 'open-analysis' },
      { id: 'an-2', name: 'Tick & Candle Volatility', action: 'inspect-ticks' },
      { id: 'an-3', name: 'Contract Win/Loss Ratio', action: 'focus-summary' },
      { id: 'an-4', name: 'Session Drawdown Stats', action: 'focus-summary' }
    ]
  },
  {
    id: 'utility',
    label: 'Utility',
    collapsible: true,
    children: [
      { id: 'ut-1', name: 'Virtual Hook (VH) Guard', action: 'toggle-vh' },
      { id: 'ut-2', name: 'Custom Signal Notification', action: 'log-notify' },
      { id: 'ut-3', name: 'KingsFX Risk Lock', action: 'log-risk' },
      { id: 'ut-4', name: 'Contract Modifiers', targetBlock: 'trade-params' },
      { id: 'ut-5', name: 'Barrier & Digit Settings', targetBlock: 'trade-params' }
    ]
  },
  {
    id: 'vh-switcher',
    label: 'Virtual Hook Switcher',
    action: 'toggle-vh'
  },
  {
    id: 'custom-notification',
    label: 'Custom Notification',
    action: 'log-notify'
  },
  {
    id: 'kingsfx-brand',
    label: 'KingsFX Engine',
    action: 'focus-summary'
  },
  {
    id: 'contract-modifiers',
    label: 'Contract modifiers',
    targetBlock: 'purchase-cond'
  },
  {
    id: 'barrier-settings',
    label: 'Barrier Settings',
    targetBlock: 'trade-params'
  }
];

export default function BotBuilder({
  logs = [],
  onClearLogs = () => {},
  onLogEvent = () => {},
  onNavigate = () => {},
  ticksByMarket = {},
  currency = 'KSH',
  isRunning = false,
  onToggleRun = () => {}
}) {
  const safeLogs = Array.isArray(logs) ? logs : [];
  const fileInputRef = useRef(null);

  // Sidebar & Canvas UI State
  const [activeSidebarId, setActiveSidebarId] = useState('trade-parameters');
  const [expandedGroups, setExpandedGroups] = useState({
    analysis: true,
    utility: true,
    'analysis-logics': false
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedBlock, setHighlightedBlock] = useState('trade-params');
  const [zoom, setZoom] = useState(1);
  const [rightTab, setRightTab] = useState('summary'); // 'summary' | 'transactions' | 'journal'
  const [filterText, setFilterText] = useState('');
  const [showFilter, setShowFilter] = useState(false);

  // Block 1: Trade Parameters State
  const [marketId, setMarketId] = useState('R_25');
  const [alternateMarkets, setAlternateMarkets] = useState(false);
  const [altRuns, setAltRuns] = useState(1);
  const [autoScan, setAutoScan] = useState(false);
  const [vhEnabled, setVhEnabled] = useState(false);
  const [tradeType, setTradeType] = useState('Digits > Over/Under');
  const [contractType, setContractType] = useState('Both');
  const [candleInterval, setCandleInterval] = useState('1 minute');
  const [restartOnError, setRestartOnError] = useState(false);
  const [restartLastTradeOnError, setRestartLastTradeOnError] = useState(true);

  const [initialStake, setInitialStake] = useState(0.5);
  const [martingaleMult, setMartingaleMult] = useState(2);
  const [currentStakeMode, setCurrentStakeMode] = useState('Initial Stake');
  const [entryDigit, setEntryDigit] = useState(0);
  const [entryArmed, setEntryArmed] = useState('true');
  const [durationTicks, setDurationTicks] = useState(1);
  const [stakeRef, setStakeRef] = useState('Current Stake');
  const [prediction, setPrediction] = useState(9);

  // Block 2: Purchase Conditions State
  const [purchaseContract, setPurchaseContract] = useState('UNDER');
  const [purchaseBarrier, setPurchaseBarrier] = useState(9);

  // Block 3: Sell Conditions State
  const [sellEnabled, setSellEnabled] = useState(true);
  const [sellProfitThreshold, setSellProfitThreshold] = useState(0.45);

  // Block 4: Restart Trading Conditions State
  const [restartTrigger, setRestartTrigger] = useState('Win');
  const [winStakeTarget, setWinStakeTarget] = useState('Initial Stake');
  const [rotateMarketOnWin, setRotateMarketOnWin] = useState(true);
  const [lossFormulaOp, setLossFormulaOp] = useState('*');
  const [lossFactor, setLossFactor] = useState('Martingale Multiplier');
  const [stopProfitTarget, setStopProfitTarget] = useState(5);
  const [stopLossTarget, setStopLossTarget] = useState(-10);
  const [tradeAgain, setTradeAgain] = useState(true);

  // Undo / Redo Snapshot Stack
  const [historyStack, setHistoryStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  const getSnapshot = () => ({
    marketId,
    alternateMarkets,
    altRuns,
    autoScan,
    vhEnabled,
    tradeType,
    contractType,
    candleInterval,
    initialStake,
    martingaleMult,
    durationTicks,
    prediction,
    purchaseContract,
    purchaseBarrier,
    stopProfitTarget,
    stopLossTarget
  });

  const pushHistory = () => {
    setHistoryStack((prev) => [...prev.slice(-19), getSnapshot()]);
    setRedoStack([]);
  };

  const handleUndo = () => {
    if (!historyStack.length) return;
    const prevSnap = historyStack[historyStack.length - 1];
    setRedoStack((r) => [...r, getSnapshot()]);
    setHistoryStack((h) => h.slice(0, -1));
    applySnapshot(prevSnap);
  };

  const handleRedo = () => {
    if (!redoStack.length) return;
    const nextSnap = redoStack[redoStack.length - 1];
    setHistoryStack((h) => [...h, getSnapshot()]);
    setRedoStack((r) => r.slice(0, -1));
    applySnapshot(nextSnap);
  };

  const applySnapshot = (s) => {
    setMarketId(s.marketId);
    setAlternateMarkets(s.alternateMarkets);
    setAltRuns(s.altRuns);
    setAutoScan(s.autoScan);
    setVhEnabled(s.vhEnabled);
    setTradeType(s.tradeType);
    setContractType(s.contractType);
    setCandleInterval(s.candleInterval);
    setInitialStake(s.initialStake);
    setMartingaleMult(s.martingaleMult);
    setDurationTicks(s.durationTicks);
    setPrediction(s.prediction);
    setPurchaseContract(s.purchaseContract);
    setPurchaseBarrier(s.purchaseBarrier);
    setStopProfitTarget(s.stopProfitTarget);
    setStopLossTarget(s.stopLossTarget);
  };

  const handleQuickStrategy = () => {
    pushHistory();
    setMarketId('R_25');
    setTradeType('Digits > Over/Under');
    setInitialStake(0.5);
    setMartingaleMult(2);
    setDurationTicks(1);
    setPrediction(9);
    setPurchaseContract('UNDER');
    setPurchaseBarrier(9);
    setHighlightedBlock('trade-params');
    onLogEvent({
      time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      msg: '[Bot Builder] Quick Strategy loaded: Volatility 25 · Over/Under · Stake 0.50'
    });
  };

  const handleResetWorkspace = () => {
    pushHistory();
    setMarketId('R_25');
    setInitialStake(0.5);
    setMartingaleMult(2);
    setDurationTicks(1);
    setPrediction(9);
    setStopProfitTarget(5);
    setStopLossTarget(-10);
    setSearchQuery('');
    onClearLogs();
  };

  const handleSaveXml = () => {
    const xml = `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="kingsfx_strategy">
    <field name="MARKET">${marketId}</field>
    <field name="TRADE_TYPE">${tradeType}</field>
    <field name="STAKE">${initialStake}</field>
    <field name="MARTINGALE">${martingaleMult}</field>
    <field name="DURATION">${durationTicks}</field>
    <field name="PREDICTION">${prediction}</field>
    <field name="PURCHASE">${purchaseContract}</field>
    <field name="TAKE_PROFIT">${stopProfitTarget}</field>
    <field name="STOP_LOSS">${stopLossTarget}</field>
  </block>
</xml>`;
    const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kingsfx-bot-${marketId.toLowerCase()}.xml`;
    a.click();
    URL.revokeObjectURL(url);
    onLogEvent({
      time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      msg: `[Bot Builder] Exported strategy XML for ${marketId}`
    });
  };

  const handleLoadXmlFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    pushHistory();
    onLogEvent({
      time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
      msg: `[Bot Builder] Loaded strategy file "${file.name}"`
    });
    e.target.value = '';
  };

  const executeSidebarLeaf = (entry) => {
    if (entry.preset) {
      pushHistory();
      if (entry.preset.tradeType) setTradeType(entry.preset.tradeType);
      if (typeof entry.preset.prediction === 'number') {
        setPrediction(entry.preset.prediction);
        setPurchaseBarrier(entry.preset.prediction);
      }
      setHighlightedBlock('trade-params');
      onLogEvent({
        time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
        msg: `[Logic Applied] ${entry.name}`
      });
      return;
    }

    if (entry.targetBlock) {
      setHighlightedBlock(entry.targetBlock);
      const el = document.getElementById(`kfx-blk-${entry.targetBlock}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    switch (entry.action) {
      case 'open-analysis':
        onNavigate('analysis-tools');
        break;
      case 'inspect-ticks': {
        const ticks = ticksByMarket[marketId] || [];
        const last = ticks[ticks.length - 1];
        setRightTab('journal');
        onLogEvent({
          time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
          msg: `[Tick Probe] ${marketId} spot ${last?.price ?? '—'} · last digit ${last?.digit ?? '—'}`
        });
        break;
      }
      case 'focus-summary':
        setRightTab('summary');
        break;
      case 'toggle-vh':
        setVhEnabled((v) => !v);
        setHighlightedBlock('trade-params');
        onLogEvent({
          time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
          msg: `[Utility] Virtual Hook ${!vhEnabled ? 'ENABLED' : 'DISABLED'}`
        });
        break;
      case 'log-notify':
        setRightTab('journal');
        onLogEvent({
          time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
          msg: `[Notification] Alert armed when P/L hits +${stopProfitTarget} or ${stopLossTarget} ${currency}`
        });
        break;
      case 'log-risk':
        setRightTab('summary');
        onLogEvent({
          time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
          msg: `[KingsFX Risk Lock] TP +${stopProfitTarget} / SL ${stopLossTarget} active`
        });
        break;
      default:
        break;
    }
  };

  const handleSidebarRowClick = (item) => {
    setActiveSidebarId(item.id);
    if (item.children?.length) {
      setExpandedGroups((prev) => ({ ...prev, [item.id]: !prev[item.id] }));
    }
    executeSidebarLeaf(item);
  };

  const filteredSidebarItems = useMemo(() => {
    if (!searchQuery.trim()) return SIDEBAR_ITEMS;
    const q = searchQuery.toLowerCase();
    return SIDEBAR_ITEMS.filter((item) => {
      const matchSelf = item.label.toLowerCase().includes(q);
      const matchChild = item.children?.some((c) => c.name.toLowerCase().includes(q));
      return matchSelf || matchChild;
    });
  }, [searchQuery]);

  // Derived Summary Metrics
  const sessionStats = useMemo(() => {
    let wins = 0;
    let losses = 0;
    let pnl = 0;
    safeLogs.forEach((l) => {
      const m = l.msg.match(/([+-]\d+(?:\.\d+)?)/);
      if (m) {
        const val = parseFloat(m[1]);
        if (!Number.isNaN(val)) {
          pnl += val;
          if (val >= 0) wins += 1;
          else losses += 1;
        }
      }
    });
    const runs = wins + losses;
    const totalStake = Number((runs * initialStake).toFixed(2));
    const totalPayout = Number(Math.max(0, totalStake + pnl).toFixed(2));
    return {
      totalStake,
      totalPayout,
      runs,
      losses,
      wins,
      pnl: Number(pnl.toFixed(2))
    };
  }, [safeLogs, initialStake]);

  const filteredLogs = useMemo(() => {
    const base =
      rightTab === 'transactions'
        ? safeLogs.filter(
            (l) =>
              l.msg.toLowerCase().includes('contract') ||
              l.msg.toLowerCase().includes('won') ||
              l.msg.toLowerCase().includes('lost') ||
              l.msg.toLowerCase().includes('stake')
          )
        : safeLogs;
    if (!filterText.trim()) return base;
    const q = filterText.toLowerCase();
    return base.filter((l) => l.msg.toLowerCase().includes(q));
  }, [safeLogs, rightTab, filterText]);

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      const ticks = ticksByMarket[marketId] || [];
      const latest = ticks[ticks.length - 1];
      const digit = latest?.digit ?? Math.floor(Math.random() * 10);
      const won =
        purchaseContract === 'UNDER' ? digit <= purchaseBarrier : digit >= purchaseBarrier;
      const delta = won
        ? Number((initialStake * 0.85).toFixed(2))
        : Number((-initialStake).toFixed(2));
      onLogEvent({
        time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
        msg: `[Builder ${purchaseContract} ${purchaseBarrier}] Digit ${digit} -> ${
          won ? '+' : ''
        }${delta.toFixed(2)} ${currency}`
      });
    }, 2200);

    return () => clearInterval(id);
  }, [isRunning, marketId, purchaseContract, purchaseBarrier, initialStake, currency, ticksByMarket, onLogEvent]);

  return (
    <section className="kfx-bb-shell">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xml,.json"
        style={{ display: 'none' }}
        onChange={handleLoadXmlFile}
      />

      {/* Left Sidebar: Quick Strategy, Blocks Menu, Search & Links */}
      <aside className="kfx-bb-sidebar">
        <div className="kfx-bb-top-actions">
          <button
            type="button"
            className="kfx-bb-quick-btn"
            onClick={handleQuickStrategy}
          >
            <NavIcon name="quick-bot" size={14} />
            <span>Quick strategy</span>
          </button>
        </div>

        <div className="kfx-bb-menu-head">
          <span>Blocks menu</span>
          <span style={{ fontSize: 11, color: '#6B7280' }}>^</span>
        </div>

        <div className="kfx-bb-search-wrap">
          <span className="kfx-bb-search-icon">
            <NavIcon name="search" size={13} />
          </span>
          <input
            type="text"
            className="kfx-bb-search-input"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="kfx-bb-nav-list">
          {filteredSidebarItems.map((item) => {
            const isExpanded = !!expandedGroups[item.id] || searchQuery.trim().length > 0;
            return (
              <div key={item.id}>
                <button
                  type="button"
                  className={`kfx-bb-nav-item ${
                    activeSidebarId === item.id ? 'is-active' : ''
                  }`}
                  onClick={() => handleSidebarRowClick(item)}
                >
                  <span className="kfx-bb-nav-left">
                    <span>{item.label}</span>
                    {item.badgeIcon && <NavIcon name={item.badgeIcon} size={13} />}
                  </span>
                  {item.children?.length ? (
                    <span style={{ fontSize: 11, color: '#6B7280' }}>
                      {isExpanded ? 'v' : '>'}
                    </span>
                  ) : null}
                </button>

                {item.children?.length && isExpanded ? (
                  <div className="kfx-bb-sub-list">
                    {item.children.map((sub) => (
                      <button
                        key={sub.id}
                        type="button"
                        className="kfx-bb-sub-btn"
                        onClick={() => executeSidebarLeaf(sub)}
                      >
                        <span>{sub.name}</span>
                        <span style={{ fontSize: 10, color: '#9B0D18' }}>Apply</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </aside>

      {/* Center Canvas: Top Toolbar + 2-Column Crimson Blockly Workspace */}
      <div className="kfx-bb-canvas">
        <div className="kfx-bb-toolbar">
          <div className="kfx-bb-tool-group">
            <button
              type="button"
              className="kfx-bb-tool-btn"
              title="Reset Workspace"
              onClick={handleResetWorkspace}
            >
              <NavIcon name="auto-trading" size={14} />
            </button>
            <button
              type="button"
              className="kfx-bb-tool-btn"
              title="Load Strategy XML"
              onClick={() => fileInputRef.current?.click()}
            >
              <NavIcon name="folder" size={14} />
            </button>
            <button
              type="button"
              className="kfx-bb-tool-btn"
              title="Save Strategy XML"
              onClick={handleSaveXml}
            >
              <NavIcon name="reports" size={14} />
            </button>
          </div>

          <div className="kfx-bb-tool-group">
            <button
              type="button"
              className="kfx-bb-tool-btn"
              title="Undo"
              onClick={handleUndo}
            >
              &lt;-
            </button>
            <button
              type="button"
              className="kfx-bb-tool-btn"
              title="Redo"
              onClick={handleRedo}
            >
              -&gt;
            </button>
            <button
              type="button"
              className="kfx-bb-tool-btn"
              title="Zoom In"
              onClick={() => setZoom((z) => Math.min(1.2, Number((z + 0.05).toFixed(2))))}
            >
              +
            </button>
            <button
              type="button"
              className="kfx-bb-tool-btn"
              title="Zoom Out"
              onClick={() => setZoom((z) => Math.max(0.85, Number((z - 0.05).toFixed(2))))}
            >
              -
            </button>
          </div>
        </div>

        <div className="kfx-bb-workspace-scroll">
          <div
            className="kfx-bb-zoom-stage"
            style={{ transform: `scale(${zoom})` }}
          >
            <div className="kfx-bb-columns">
              {/* Left Column: 1. Trade parameters + 2. Purchase conditions */}
              <div>
                <div
                  id="kfx-blk-trade-params"
                  className={`kfx-blk-card ${
                    highlightedBlock === 'trade-params' ? 'is-highlighted' : ''
                  }`}
                >
                  <div className="kfx-blk-header">
                    <span>1. Trade parameters</span>
                    <span style={{ fontSize: 10, opacity: 0.9 }}>KINGSFX</span>
                  </div>
                  <div className="kfx-blk-body">
                    <div className="kfx-blk-row">
                      <span>Market:</span>
                      <span className="kfx-blk-pill-select">synthetic_index</span>
                      <span>&gt;</span>
                      <span className="kfx-blk-pill-select">random_index</span>
                      <span>&gt;</span>
                      <select
                        className="kfx-blk-pill-select"
                        value={marketId}
                        onChange={(e) => {
                          pushHistory();
                          setMarketId(e.target.value);
                        }}
                      >
                        {SYNTHETIC_MARKETS.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.label} Index
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="kfx-blk-row">
                      <input
                        type="checkbox"
                        checked={alternateMarkets}
                        onChange={(e) => setAlternateMarkets(e.target.checked)}
                      />
                      <span>Alternate markets (Continuous Indices only):</span>
                      <input
                        type="checkbox"
                        checked={alternateMarkets}
                        onChange={(e) => setAlternateMarkets(e.target.checked)}
                      />
                      <span>every</span>
                      <input
                        type="number"
                        min={1}
                        max={25}
                        className="kfx-blk-pill-input"
                        value={altRuns}
                        onChange={(e) => setAltRuns(Number(e.target.value) || 1)}
                      />
                      <span>run(s)</span>
                    </div>

                    <div className="kfx-blk-row">
                      <input
                        type="checkbox"
                        checked={autoScan}
                        onChange={(e) => setAutoScan(e.target.checked)}
                      />
                      <span>Auto-scan volatility markets and trade first match:</span>
                      <input
                        type="checkbox"
                        checked={autoScan}
                        onChange={(e) => setAutoScan(e.target.checked)}
                      />
                    </div>

                    <div className="kfx-blk-row">
                      <span>Virtual Hook:</span>
                      <input
                        type="checkbox"
                        checked={vhEnabled}
                        onChange={(e) => setVhEnabled(e.target.checked)}
                      />
                      <button
                        type="button"
                        className="kfx-blk-vh-btn"
                        onClick={() => setVhEnabled((v) => !v)}
                      >
                        VH Settings
                      </button>
                    </div>

                    <div className="kfx-blk-row">
                      <span>Trade Type:</span>
                      <select
                        className="kfx-blk-pill-select"
                        value={tradeType}
                        onChange={(e) => setTradeType(e.target.value)}
                      >
                        <option value="Digits > Over/Under">Digits &gt; Over/Under</option>
                        <option value="Digits > Even/Odd">Digits &gt; Even/Odd</option>
                        <option value="Up/Down > Rise/Fall">Up/Down &gt; Rise/Fall</option>
                      </select>
                    </div>

                    <div className="kfx-blk-row">
                      <span>Contract Type:</span>
                      <select
                        className="kfx-blk-pill-select"
                        value={contractType}
                        onChange={(e) => setContractType(e.target.value)}
                      >
                        <option value="Both">Both</option>
                        <option value="Over">Over</option>
                        <option value="Under">Under</option>
                      </select>
                    </div>

                    <div className="kfx-blk-row">
                      <span>Default Candle Interval:</span>
                      <select
                        className="kfx-blk-pill-select"
                        value={candleInterval}
                        onChange={(e) => setCandleInterval(e.target.value)}
                      >
                        <option value="1 minute">1 minute</option>
                        <option value="2 minutes">2 minutes</option>
                        <option value="5 minutes">5 minutes</option>
                      </select>
                    </div>

                    <div className="kfx-blk-row">
                      <span>Restart buy/sell on error (disable for better performance):</span>
                      <input
                        type="checkbox"
                        checked={restartOnError}
                        onChange={(e) => setRestartOnError(e.target.checked)}
                      />
                    </div>

                    <div className="kfx-blk-row">
                      <span>Restart last trade on error (bot ignores the unsuccessful trade):</span>
                      <input
                        type="checkbox"
                        checked={restartLastTradeOnError}
                        onChange={(e) => setRestartLastTradeOnError(e.target.checked)}
                      />
                    </div>

                    <div className="kfx-blk-subband">Run once at start:</div>

                    <div className="kfx-blk-inner-box">
                      <div className="kfx-blk-row">
                        <span>set</span>
                        <span className="kfx-blk-pill-select">Initial Stake</span>
                        <span>to</span>
                        <input
                          type="number"
                          step="0.1"
                          className="kfx-blk-pill-input"
                          value={initialStake}
                          onChange={(e) => setInitialStake(Number(e.target.value) || 0.5)}
                        />
                      </div>

                      <div className="kfx-blk-row">
                        <span>set</span>
                        <span className="kfx-blk-pill-select">Martingale Multiplier</span>
                        <span>to</span>
                        <input
                          type="number"
                          step="0.5"
                          className="kfx-blk-pill-input"
                          value={martingaleMult}
                          onChange={(e) => setMartingaleMult(Number(e.target.value) || 2)}
                        />
                      </div>

                      <div className="kfx-blk-row">
                        <span>set</span>
                        <span className="kfx-blk-pill-select">Current Stake</span>
                        <span>to</span>
                        <select
                          className="kfx-blk-pill-select"
                          value={currentStakeMode}
                          onChange={(e) => setCurrentStakeMode(e.target.value)}
                        >
                          <option value="Initial Stake">Initial Stake</option>
                          <option value="Current Stake">Current Stake</option>
                        </select>
                      </div>

                      <div className="kfx-blk-row">
                        <span>set</span>
                        <span className="kfx-blk-pill-select">Entry Digit</span>
                        <span>to</span>
                        <input
                          type="number"
                          min={0}
                          max={9}
                          className="kfx-blk-pill-input"
                          value={entryDigit}
                          onChange={(e) => setEntryDigit(Number(e.target.value) || 0)}
                        />
                      </div>

                      <div className="kfx-blk-row">
                        <span>set</span>
                        <span className="kfx-blk-pill-select">Entry Armed</span>
                        <span>to</span>
                        <select
                          className="kfx-blk-pill-select"
                          value={entryArmed}
                          onChange={(e) => setEntryArmed(e.target.value)}
                        >
                          <option value="true">true</option>
                          <option value="false">false</option>
                        </select>
                      </div>
                    </div>

                    <div className="kfx-blk-subband">Trade options:</div>

                    <div className="kfx-blk-branch-box">
                      <div className="kfx-blk-row">
                        <span className="kfx-blk-pill-select">repeat until (Entry Armed =...</span>
                      </div>
                      <div className="kfx-blk-row">
                        <span>Duration:</span>
                        <span className="kfx-blk-pill-select">Ticks</span>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          className="kfx-blk-pill-input"
                          value={durationTicks}
                          onChange={(e) => setDurationTicks(Number(e.target.value) || 1)}
                        />
                        <span>Stake: {currency}</span>
                        <select
                          className="kfx-blk-pill-select"
                          value={stakeRef}
                          onChange={(e) => setStakeRef(e.target.value)}
                        >
                          <option value="Current Stake">Current Stake</option>
                          <option value="Initial Stake">Initial Stake</option>
                        </select>
                        <span>Prediction:</span>
                        <input
                          type="number"
                          min={0}
                          max={9}
                          className="kfx-blk-pill-input"
                          value={prediction}
                          onChange={(e) => setPrediction(Number(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Block 2: Purchase conditions */}
                <div
                  id="kfx-blk-purchase-cond"
                  className={`kfx-blk-card ${
                    highlightedBlock === 'purchase-cond' ? 'is-highlighted' : ''
                  }`}
                >
                  <div className="kfx-blk-header">
                    <span>2. Purchase conditions</span>
                  </div>
                  <div className="kfx-blk-body">
                    <div className="kfx-blk-row">
                      <span>Purchase</span>
                      <select
                        className="kfx-blk-pill-select"
                        value={purchaseContract}
                        onChange={(e) => setPurchaseContract(e.target.value)}
                      >
                        <option value="UNDER">UNDER</option>
                        <option value="OVER">OVER</option>
                        <option value="EVEN">EVEN</option>
                        <option value="ODD">ODD</option>
                      </select>
                      <span>Barrier:</span>
                      <input
                        type="number"
                        min={0}
                        max={9}
                        className="kfx-blk-pill-input"
                        value={purchaseBarrier}
                        onChange={(e) => setPurchaseBarrier(Number(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: 4. Restart trading conditions + 3. Sell conditions */}
              <div>
                <div
                  id="kfx-blk-restart-cond"
                  className={`kfx-blk-card ${
                    highlightedBlock === 'restart-cond' ? 'is-highlighted' : ''
                  }`}
                >
                  <div className="kfx-blk-header">
                    <span>4. Restart trading conditions</span>
                  </div>
                  <div className="kfx-blk-body">
                    <div className="kfx-blk-branch-box">
                      <div className="kfx-blk-row">
                        <span>if</span>
                        <span className="kfx-blk-pill-select">Result is</span>
                        <select
                          className="kfx-blk-pill-select"
                          value={restartTrigger}
                          onChange={(e) => setRestartTrigger(e.target.value)}
                        >
                          <option value="Win">Win</option>
                          <option value="Loss">Loss</option>
                        </select>
                        <span>then</span>
                      </div>

                      <div className="kfx-blk-row" style={{ paddingLeft: 12 }}>
                        <span>set</span>
                        <span className="kfx-blk-pill-select">Current Stake</span>
                        <span>to</span>
                        <select
                          className="kfx-blk-pill-select"
                          value={winStakeTarget}
                          onChange={(e) => setWinStakeTarget(e.target.value)}
                        >
                          <option value="Initial Stake">Initial Stake</option>
                          <option value="Current Stake">Current Stake</option>
                        </select>
                      </div>

                      <div className="kfx-blk-row" style={{ paddingLeft: 12 }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input
                            type="checkbox"
                            checked={rotateMarketOnWin}
                            onChange={(e) => setRotateMarketOnWin(e.target.checked)}
                          />
                          <span>Rotate to next volatility market</span>
                        </label>
                      </div>

                      <div className="kfx-blk-row">
                        <span>else</span>
                      </div>

                      <div className="kfx-blk-row" style={{ paddingLeft: 12 }}>
                        <span>set</span>
                        <span className="kfx-blk-pill-select">Current Stake</span>
                        <span>to</span>
                        <span className="kfx-blk-pill-select">Current Stake</span>
                        <select
                          className="kfx-blk-pill-select"
                          value={lossFormulaOp}
                          onChange={(e) => setLossFormulaOp(e.target.value)}
                        >
                          <option value="*">*</option>
                          <option value="+">+</option>
                        </select>
                        <select
                          className="kfx-blk-pill-select"
                          value={lossFactor}
                          onChange={(e) => setLossFactor(e.target.value)}
                        >
                          <option value="Martingale Multiplier">Martingale Multiplier</option>
                          <option value="Initial Stake">Initial Stake</option>
                        </select>
                      </div>
                    </div>

                    <div className="kfx-blk-row">
                      <span>Stop if total profit &gt;=</span>
                      <input
                        type="number"
                        step="0.5"
                        className="kfx-blk-pill-input"
                        value={stopProfitTarget}
                        onChange={(e) => setStopProfitTarget(Number(e.target.value) || 5)}
                      />
                    </div>

                    <div className="kfx-blk-row">
                      <span>Stop if total profit &lt;=</span>
                      <input
                        type="number"
                        step="1"
                        className="kfx-blk-pill-input"
                        value={stopLossTarget}
                        onChange={(e) => setStopLossTarget(Number(e.target.value) || -10)}
                      />
                    </div>

                    <div className="kfx-blk-row">
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                        <input
                          type="checkbox"
                          checked={tradeAgain}
                          onChange={(e) => setTradeAgain(e.target.checked)}
                        />
                        <span>Trade again</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Block 3: Sell conditions */}
                <div
                  id="kfx-blk-sell-cond"
                  className={`kfx-blk-card ${
                    highlightedBlock === 'sell-cond' ? 'is-highlighted' : ''
                  }`}
                >
                  <div className="kfx-blk-header">
                    <span>3. Sell conditions (optional)</span>
                  </div>
                  <div className="kfx-blk-body">
                    <div className="kfx-blk-row">
                      <input
                        type="checkbox"
                        checked={sellEnabled}
                        onChange={(e) => setSellEnabled(e.target.checked)}
                      />
                      <span>if Sell is available then sell at profit &gt;=</span>
                      <input
                        type="number"
                        step="0.05"
                        className="kfx-blk-pill-input"
                        value={sellProfitThreshold}
                        onChange={(e) => setSellProfitThreshold(Number(e.target.value) || 0.45)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="kfx-blk-trash"
          title="Clear Journal Logs"
          onClick={onClearLogs}
        >
          <NavIcon name="folder" size={16} />
        </button>
      </div>

      {/* Right Panel: Summary / Transactions / Journal + Session Totals Footer */}
      <aside className="kfx-bb-right">
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
              onClick={handleSaveXml}
            >
              Export Bot
            </button>
            <button
              type="button"
              className="kfx-mini-btn is-ready"
              onClick={() => setShowFilter((s) => !s)}
            >
              Filters
            </button>
            <button
              type="button"
              className="kfx-mini-btn is-ready"
              onClick={onToggleRun}
            >
              {isRunning ? 'Stop' : 'Run'}
            </button>
          </div>

          {showFilter && (
            <div style={{ padding: '8px 10px', borderBottom: '1px solid #E5E7EB' }}>
              <input
                type="text"
                className="kfx-search-input"
                placeholder="Filter activity..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              />
            </div>
          )}

          {rightTab === 'summary' && !filteredLogs.length ? (
            <div className="kfx-empty-state">
              <div style={{ fontWeight: 800, color: '#10B981', fontSize: 16, marginBottom: 4 }}>
                {sessionStats.pnl >= 0 ? '+' : ''}
                {currency} {sessionStats.pnl.toFixed(2)}
              </div>
              <div style={{ fontWeight: 700, color: '#6B7280' }}>
                {isRunning ? 'Bot executing contract cycle...' : 'Ready to run strategy'}
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: 7,
                maxHeight: 460,
                overflowY: 'auto'
              }}
            >
              {filteredLogs.length ? (
                filteredLogs.map((entry, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: 11,
                      padding: '7px 9px',
                      borderRadius: 6,
                      background: '#F9FAFB',
                      border: '1px solid #E5E7EB',
                      color: '#1F2937'
                    }}
                  >
                    <div>{entry.msg}</div>
                    <div style={{ fontSize: 10, color: '#6B7280', marginTop: 2 }}>
                      {entry.time}
                    </div>
                  </div>
                ))
              ) : (
                <div className="kfx-empty-state">No entries match the current filter.</div>
              )}
            </div>
          )}
        </div>

        <div className="kfx-bb-stats-footer">
          <div className="kfx-bb-stats-grid">
            <div>
              <div className="kfx-bb-stat-lbl">Total stake</div>
              <div className="kfx-bb-stat-val">
                {currency} {sessionStats.totalStake.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="kfx-bb-stat-lbl">Total payout</div>
              <div className="kfx-bb-stat-val">
                {currency} {sessionStats.totalPayout.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="kfx-bb-stat-lbl">No. of runs</div>
              <div className="kfx-bb-stat-val">{sessionStats.runs}</div>
            </div>
            <div>
              <div className="kfx-bb-stat-lbl">Contracts lost</div>
              <div className="kfx-bb-stat-val">{sessionStats.losses}</div>
            </div>
            <div>
              <div className="kfx-bb-stat-lbl">Contracts won</div>
              <div className="kfx-bb-stat-val">{sessionStats.wins}</div>
            </div>
            <div>
              <div className="kfx-bb-stat-lbl">Total profit/loss</div>
              <div
                className="kfx-bb-stat-val"
                style={{ color: sessionStats.pnl >= 0 ? '#10B981' : '#EF4444' }}
              >
                {sessionStats.pnl >= 0 ? '+' : ''}
                {currency} {sessionStats.pnl.toFixed(2)}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 10 }}>
            <button
              type="button"
              className="kfx-reset-crimson"
              onClick={handleResetWorkspace}
            >
              Reset
            </button>
          </div>
        </div>
      </aside>
    </section>
  );
}
