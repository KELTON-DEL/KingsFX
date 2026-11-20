import React, { useEffect, useState } from 'react';

const MARKET_OPTIONS = [
  { value: 'R_100', label: 'Volatility 100 Index', group: 'random_index' },
  { value: '1HZ100V', label: 'Volatility 100 (1s) Index', group: 'random_index' },
  { value: '1HZ10V', label: 'Volatility 10 (1s) Index', group: 'random_index' },
  { value: 'R_10', label: 'Volatility 10 Index', group: 'random_index' },
  { value: 'R_25', label: 'Volatility 25 Index', group: 'random_index' },
  { value: 'R_50', label: 'Volatility 50 Index', group: 'random_index' },
  { value: 'R_75', label: 'Volatility 75 Index', group: 'random_index' },
  { value: '1HZ75V', label: 'Volatility 75 (1s) Index', group: 'random_index' }
];

function buildDefaultRules(bot, state) {
  const defaultDigit = state?.lastBarrier ?? (bot?.contractType === 'DIGITUNDER' ? 7 : 2);
  return {
    marketCategory: 'synthetic_index',
    marketGroup: 'random_index',
    symbol: state?.symbol || bot?.defaultSymbol || 'R_100',
    tradeType: 'Digits',
    contractMode: 'Both',
    recoveryMode: bot?.recoveryMode !== 'fixed_stake',
    martingaleEnabled: (bot?.recoveryMultiplier || 1) > 1,
    martingaleMultiplier: bot?.recoveryMultiplier || 2,
    durationUnit: state?.durationUnit === 't' ? 'Ticks' : (state?.durationUnit || 'Ticks'),
    durationValue: state?.duration || bot?.defaultDuration || 1,
    initialAnalysisEnabled: true,
    initialAnalysisType: 'Pattern Analysis',
    initialSignalCheck: 'After Every',
    initialSignalTrades: 3,
    initialConditions: [
      {
        id: 'init-1',
        clause: 'IF',
        lookback: 1,
        comparator: 'less or equal to',
        digit: defaultDigit,
        purchase: bot?.contractType === 'DIGITUNDER' ? 'Under' : 'Over',
        prediction: defaultDigit
      },
      {
        id: 'init-2',
        clause: 'ELSE IF',
        lookback: 1,
        comparator: 'greater or equal to',
        digit: 7,
        purchase: bot?.contractType === 'DIGITOVER' ? 'Over' : 'Under',
        prediction: 7
      }
    ],
    recoveryAnalysisEnabled: true,
    recoveryAnalysisType: 'Percentage Analysis',
    recoverySignalCheck: 'On First Entry Only',
    recoveryConditions: [
      {
        id: 'rec-1',
        clause: 'IF',
        parity: 'Even',
        windowTicks: 25,
        operator: '>=',
        threshold: 55,
        thenPurchase: 'Even',
        evenPct: 44.0,
        oddPct: 56.0
      },
      {
        id: 'rec-2',
        clause: 'ELSE IF',
        parity: 'Odd',
        windowTicks: 25,
        operator: '>=',
        threshold: 55,
        thenPurchase: 'Odd',
        evenPct: 44.0,
        oddPct: 56.0
      }
    ]
  };
}

export default function BotRunnerModal({
  bot,
  botState,
  isOpen,
  onClose,
  onToggleBot,
  onUpdateBotConfig,
  onResetBotSession,
  currency = 'USD'
}) {
  const [config, setConfig] = useState(() => buildDefaultRules(bot, botState));

  useEffect(() => {
    if (bot) {
      setConfig(buildDefaultRules(bot, botState));
    }
  }, [bot?.id, isOpen]);

  if (!isOpen || !bot) return null;

  const st = botState || {};
  const isRunning = Boolean(st.running);

  const handleStakeChange = (val) => {
    const num = Math.max(0.35, Number(val) || 0.35);
    onUpdateBotConfig?.(bot.id, { baseStake: num });
  };

  const handleTpChange = (val) => {
    const num = Math.max(0.1, Number(val) || 1);
    onUpdateBotConfig?.(bot.id, { takeProfit: num });
  };

  const handleSlChange = (val) => {
    const num = Math.max(0.1, Number(val) || 1);
    onUpdateBotConfig?.(bot.id, { stopLoss: num });
  };

  const handleMarketChange = (symbol) => {
    setConfig((prev) => ({ ...prev, symbol }));
    onUpdateBotConfig?.(bot.id, { symbol });
  };

  const handleDurationChange = (val) => {
    const num = Math.max(1, Number(val) || 1);
    setConfig((prev) => ({ ...prev, durationValue: num }));
    onUpdateBotConfig?.(bot.id, { duration: num });
  };

  const handleMartingaleMultChange = (val) => {
    const num = Math.max(1, Number(val) || 1);
    setConfig((prev) => ({ ...prev, martingaleMultiplier: num }));
    onUpdateBotConfig?.(bot.id, { recoveryMultiplier: num });
  };

  const addInitialCondition = () => {
    setConfig((prev) => ({
      ...prev,
      initialConditions: [
        ...prev.initialConditions,
        {
          id: `init-${Date.now()}`,
          clause: 'ELSE IF',
          lookback: 1,
          comparator: 'equals',
          digit: 5,
          purchase: 'Over',
          prediction: 5
        }
      ]
    }));
  };

  const removeInitialCondition = (id) => {
    setConfig((prev) => ({
      ...prev,
      initialConditions: prev.initialConditions.filter((c) => c.id !== id)
    }));
  };

  const updateInitialCondition = (id, patch) => {
    setConfig((prev) => ({
      ...prev,
      initialConditions: prev.initialConditions.map((c) => (c.id === id ? { ...c, ...patch } : c))
    }));
  };

  const addRecoveryCondition = () => {
    setConfig((prev) => ({
      ...prev,
      recoveryConditions: [
        ...prev.recoveryConditions,
        {
          id: `rec-${Date.now()}`,
          clause: 'ELSE IF',
          parity: 'Even',
          windowTicks: 25,
          operator: '>=',
          threshold: 55,
          thenPurchase: 'Even',
          evenPct: 50.0,
          oddPct: 50.0
        }
      ]
    }));
  };

  const removeRecoveryCondition = (id) => {
    setConfig((prev) => ({
      ...prev,
      recoveryConditions: prev.recoveryConditions.filter((c) => c.id !== id)
    }));
  };

  const updateRecoveryCondition = (id, patch) => {
    setConfig((prev) => ({
      ...prev,
      recoveryConditions: prev.recoveryConditions.map((c) => (c.id === id ? { ...c, ...patch } : c))
    }));
  };

  const handleDownloadBot = () => {
    const payload = JSON.stringify({ bot, state: st, rules: config }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${bot.id}-config.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadBot = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'));
        if (parsed.rules) setConfig((prev) => ({ ...prev, ...parsed.rules }));
        if (parsed.state) {
          onUpdateBotConfig?.(bot.id, {
            baseStake: parsed.state.baseStake ?? st.baseStake,
            takeProfit: parsed.state.takeProfit ?? st.takeProfit,
            stopLoss: parsed.state.stopLoss ?? st.stopLoss,
            symbol: parsed.state.symbol ?? config.symbol
          });
        }
      } catch (_) {}
    };
    reader.readAsText(file);
  };

  const handleResetLayout = () => {
    setConfig(buildDefaultRules(bot, botState));
  };

  const handleResetBot = () => {
    onResetBotSession?.(bot.id);
    setConfig(buildDefaultRules(bot, null));
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(9, 13, 22, 0.78)',
        backdropFilter: 'blur(4px)',
        overflowY: 'auto',
        padding: '20px'
      }}
    >
      <div
        style={{
          maxWidth: '1320px',
          margin: '0 auto',
          background: '#f8fafc',
          color: '#0f172a',
          borderRadius: '14px',
          padding: '18px 20px 26px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
          backgroundImage:
            'linear-gradient(to right, rgba(148,163,184,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.12) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      >
        {/* Top Action Bar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px'
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              onClick={handleDownloadBot}
              style={{
                padding: '7px 12px',
                borderRadius: '7px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#0f172a',
                fontWeight: 600,
                fontSize: '12.5px',
                cursor: 'pointer'
              }}
            >
              Download bot
            </button>

            <label
              style={{
                padding: '7px 12px',
                borderRadius: '7px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#0f172a',
                fontWeight: 600,
                fontSize: '12.5px',
                cursor: 'pointer'
              }}
            >
              Load bot
              <input type="file" accept=".json,.xml" onChange={handleLoadBot} style={{ display: 'none' }} />
            </label>

            <button
              type="button"
              onClick={handleResetBot}
              style={{
                padding: '7px 12px',
                borderRadius: '7px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#0f172a',
                fontWeight: 600,
                fontSize: '12.5px',
                cursor: 'pointer'
              }}
            >
              Reset bot
            </button>

            <button
              type="button"
              onClick={handleResetLayout}
              style={{
                padding: '7px 12px',
                borderRadius: '7px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#0f172a',
                fontWeight: 600,
                fontSize: '12.5px',
                cursor: 'pointer'
              }}
            >
              Reset layout
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
              {bot.name} • P&L:{' '}
              <span style={{ color: (st.netProfit || 0) >= 0 ? '#0d9488' : '#dc2626' }}>
                {(st.netProfit || 0) >= 0 ? '+' : ''}
                {(st.netProfit || 0).toFixed(2)} {currency}
              </span>
            </span>
            <button
              type="button"
              onClick={() => onToggleBot?.(bot.id)}
              style={{
                padding: '7px 16px',
                borderRadius: '7px',
                border: 'none',
                background: isRunning ? '#ef4444' : '#0d9488',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '12.5px',
                cursor: 'pointer'
              }}
            >
              {isRunning ? 'Stop Bot' : 'Run Bot'}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '7px 12px',
                borderRadius: '7px',
                border: '1px solid #cbd5e1',
                background: '#e2e8f0',
                color: '#0f172a',
                fontWeight: 700,
                fontSize: '12.5px',
                cursor: 'pointer'
              }}
            >
              Close ✕
            </button>
          </div>
        </div>

        {/* 2-Column Builder Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '18px', alignItems: 'start' }}>
          {/* LEFT COLUMN: TRADE PARAMETERS + INITIAL PURCHASE */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* TRADE PARAMETERS CARD */}
            <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div
                style={{
                  background: '#081326',
                  color: '#ffffff',
                  padding: '10px 14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.04em'
                }}
              >
                TRADE PARAMETERS
              </div>
              <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 600, minWidth: '110px' }}>Market:</span>
                  <select
                    value={config.marketCategory}
                    onChange={(e) => setConfig((p) => ({ ...p, marketCategory: e.target.value }))}
                    style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 600 }}
                  >
                    <option value="synthetic_index">synthetic_index</option>
                  </select>
                  <select
                    value={config.marketGroup}
                    onChange={(e) => setConfig((p) => ({ ...p, marketGroup: e.target.value }))}
                    style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 600 }}
                  >
                    <option value="random_index">random_index</option>
                  </select>
                  <select
                    value={config.symbol}
                    onChange={(e) => handleMarketChange(e.target.value)}
                    style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 600 }}
                  >
                    {MARKET_OPTIONS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 600, minWidth: '110px' }}>Trade type:</span>
                  <select
                    value={config.tradeType}
                    onChange={(e) => setConfig((p) => ({ ...p, tradeType: e.target.value }))}
                    style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 600 }}
                  >
                    <option value="Digits">Digits</option>
                  </select>
                  <select
                    value={bot.contractType}
                    onChange={(e) => onUpdateBotConfig?.(bot.id, { contractType: e.target.value })}
                    style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 600 }}
                  >
                    <option value="DIGITUNDER">Over/Under (Under)</option>
                    <option value="DIGITOVER">Over/Under (Over)</option>
                    <option value="DIGITDIFF">Differs</option>
                    <option value="DIGITEVEN">Even/Odd (Even)</option>
                    <option value="DIGITODD">Even/Odd (Odd)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 600, minWidth: '110px' }}>Contract type:</span>
                  <select
                    value={config.contractMode}
                    onChange={(e) => setConfig((p) => ({ ...p, contractMode: e.target.value }))}
                    style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 600 }}
                  >
                    <option value="Both">Both</option>
                    <option value="Single">Single</option>
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontWeight: 600, minWidth: '110px' }}>Recovery Mode:</span>
                  <button
                    type="button"
                    onClick={() => setConfig((p) => ({ ...p, recoveryMode: !p.recoveryMode }))}
                    style={{
                      width: '40px',
                      height: '22px',
                      borderRadius: '999px',
                      border: 'none',
                      background: config.recoveryMode ? '#14b8a6' : '#cbd5e1',
                      position: 'relative',
                      cursor: 'pointer'
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: '2px',
                        left: config.recoveryMode ? '20px' : '2px',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: '#ffffff',
                        transition: 'left 0.15s ease'
                      }}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* INITIAL PURCHASE CARD */}
            <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div
                style={{
                  background: '#081326',
                  color: '#ffffff',
                  padding: '10px 14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>INITIAL PURCHASE</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
                  <button
                    type="button"
                    onClick={() => setConfig((p) => ({ ...p, initialAnalysisEnabled: !p.initialAnalysisEnabled }))}
                    style={{
                      width: '36px',
                      height: '20px',
                      borderRadius: '999px',
                      border: 'none',
                      background: config.initialAnalysisEnabled ? '#14b8a6' : '#475569',
                      position: 'relative',
                      cursor: 'pointer'
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: '2px',
                        left: config.initialAnalysisEnabled ? '18px' : '2px',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: '#ffffff'
                      }}
                    />
                  </button>
                  <span>Enable Analysis</span>
                  <select
                    value={config.initialAnalysisType}
                    onChange={(e) => setConfig((p) => ({ ...p, initialAnalysisType: e.target.value }))}
                    style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #334155', background: '#ffffff', color: '#0f172a', fontWeight: 600, fontSize: '12px' }}
                  >
                    <option value="Pattern Analysis">Pattern Analysis</option>
                    <option value="Percentage Analysis">Percentage Analysis</option>
                  </select>
                </div>
              </div>

              <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 600 }}>Signal Check</span>
                  <select
                    value={config.initialSignalCheck}
                    onChange={(e) => setConfig((p) => ({ ...p, initialSignalCheck: e.target.value }))}
                    style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 600 }}
                  >
                    <option value="After Every">After Every</option>
                    <option value="Every Tick">Every Tick</option>
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={config.initialSignalTrades}
                    onChange={(e) => setConfig((p) => ({ ...p, initialSignalTrades: Number(e.target.value) || 1 }))}
                    style={{ width: '48px', padding: '4px 6px', borderRadius: '6px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 600 }}
                  />
                  <span>trades</span>
                </div>

                {config.initialConditions.map((cond) => (
                  <div
                    key={cond.id}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
                        <strong style={{ color: '#0f766e' }}>{cond.clause}</strong>
                        <span>the last</span>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={cond.lookback}
                          onChange={(e) => updateInitialCondition(cond.id, { lookback: Number(e.target.value) || 1 })}
                          style={{ width: '42px', padding: '3px 6px', borderRadius: '5px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 600 }}
                        />
                        <span>digits are</span>
                        <select
                          value={cond.comparator}
                          onChange={(e) => updateInitialCondition(cond.id, { comparator: e.target.value })}
                          style={{ padding: '4px 7px', borderRadius: '5px', border: '1px solid #cbd5e1', background: '#ffffff', fontWeight: 600 }}
                        >
                          <option value="less or equal to">less or equal to</option>
                          <option value="greater or equal to">greater or equal to</option>
                          <option value="equals">equals</option>
                        </select>
                        <span>digit</span>
                        <input
                          type="number"
                          min="0"
                          max="9"
                          value={cond.digit}
                          onChange={(e) => updateInitialCondition(cond.id, { digit: Number(e.target.value) || 0 })}
                          style={{ width: '42px', padding: '3px 6px', borderRadius: '5px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 600 }}
                        />
                        <span>then</span>
                      </div>

                      {config.initialConditions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeInitialCondition(cond.id)}
                          title="Delete condition"
                          style={{ border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer', fontWeight: 700 }}
                        >
                          🗑
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}>
                      <span>Purchase</span>
                      <select
                        value={cond.purchase}
                        onChange={(e) => updateInitialCondition(cond.id, { purchase: e.target.value })}
                        style={{ padding: '4px 8px', borderRadius: '5px', border: '1px solid #cbd5e1', background: '#ffffff', fontWeight: 600 }}
                      >
                        <option value="Over">Over</option>
                        <option value="Under">Under</option>
                        <option value="Differs">Differs</option>
                      </select>
                      <span>Prediction:</span>
                      <input
                        type="number"
                        min="0"
                        max="9"
                        value={cond.prediction}
                        onChange={(e) => updateInitialCondition(cond.id, { prediction: Number(e.target.value) || 0 })}
                        style={{ width: '42px', padding: '3px 6px', borderRadius: '5px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 600 }}
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                      <span style={{ color: '#64748b' }}>Last {cond.lookback} pattern</span>
                      <span
                        style={{
                          padding: '2px 7px',
                          borderRadius: '5px',
                          background: cond.clause === 'IF' ? '#dcfce7' : '#fee2e2',
                          color: cond.clause === 'IF' ? '#15803d' : '#b91c1c',
                          fontWeight: 700
                        }}
                      >
                        {cond.digit}
                      </span>
                    </div>
                  </div>
                ))}

                <div>
                  <button
                    type="button"
                    onClick={addInitialCondition}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid #0d9488',
                      background: '#ffffff',
                      color: '#0f766e',
                      fontWeight: 700,
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    + Add condition
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: BOT PARAMETERS + RECOVERY PURCHASE */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* BOT PARAMETERS CARD */}
            <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div
                style={{
                  background: '#081326',
                  color: '#ffffff',
                  padding: '10px 14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.04em'
                }}
              >
                BOT PARAMETERS
              </div>
              <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontWeight: 600, minWidth: '105px' }}>Stake:</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0.35"
                    value={st.baseStake ?? bot.defaultStake}
                    onChange={(e) => handleStakeChange(e.target.value)}
                    style={{ width: '74px', padding: '5px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 600 }}
                  />
                  <span style={{ padding: '4px 8px', borderRadius: '5px', background: '#e0f2fe', color: '#0369a1', fontWeight: 700, fontSize: '11px' }}>
                    {currency}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontWeight: 600, minWidth: '105px' }}>Take profit:</span>
                  <input
                    type="number"
                    step="1"
                    min="0.1"
                    value={st.takeProfit ?? bot.defaultTakeProfit}
                    onChange={(e) => handleTpChange(e.target.value)}
                    style={{ width: '74px', padding: '5px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 600 }}
                  />
                  <span style={{ padding: '4px 8px', borderRadius: '5px', background: '#e0f2fe', color: '#0369a1', fontWeight: 700, fontSize: '11px' }}>
                    {currency}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontWeight: 600, minWidth: '105px' }}>Stop loss:</span>
                  <input
                    type="number"
                    step="1"
                    min="0.1"
                    value={st.stopLoss ?? bot.defaultStopLoss}
                    onChange={(e) => handleSlChange(e.target.value)}
                    style={{ width: '74px', padding: '5px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontWeight: 600 }}
                  />
                  <span style={{ padding: '4px 8px', borderRadius: '5px', background: '#e0f2fe', color: '#0369a1', fontWeight: 700, fontSize: '11px' }}>
                    {currency}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontWeight: 600, minWidth: '105px' }}>Martingale:</span>
                  <button
                    type="button"
                    onClick={() => setConfig((p) => ({ ...p, martingaleEnabled: !p.martingaleEnabled }))}
                    style={{
                      width: '40px',
                      height: '22px',
                      borderRadius: '999px',
                      border: 'none',
                      background: config.martingaleEnabled ? '#14b8a6' : '#cbd5e1',
                      position: 'relative',
                      cursor: 'pointer'
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: '2px',
                        left: config.martingaleEnabled ? '20px' : '2px',
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: '#ffffff'
                      }}
                    />
                  </button>
                  <span>×</span>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    value={config.martingaleMultiplier}
                    onChange={(e) => handleMartingaleMultChange(e.target.value)}
                    style={{ width: '60px', padding: '5px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 600 }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontWeight: 600, minWidth: '105px' }}>Duration:</span>
                  <select
                    value={config.durationUnit}
                    onChange={(e) => setConfig((p) => ({ ...p, durationUnit: e.target.value }))}
                    style={{ padding: '5px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 600 }}
                  >
                    <option value="Ticks">Ticks</option>
                    <option value="Seconds">Seconds</option>
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={config.durationValue}
                    onChange={(e) => handleDurationChange(e.target.value)}
                    style={{ width: '56px', padding: '5px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 600 }}
                  />
                </div>
              </div>
            </div>

            {/* RECOVERY PURCHASE CARD */}
            <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div
                style={{
                  background: '#081326',
                  color: '#ffffff',
                  padding: '10px 14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <span>RECOVERY PURCHASE</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 500 }}>
                  <button
                    type="button"
                    onClick={() => setConfig((p) => ({ ...p, recoveryAnalysisEnabled: !p.recoveryAnalysisEnabled }))}
                    style={{
                      width: '36px',
                      height: '20px',
                      borderRadius: '999px',
                      border: 'none',
                      background: config.recoveryAnalysisEnabled ? '#14b8a6' : '#475569',
                      position: 'relative',
                      cursor: 'pointer'
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        top: '2px',
                        left: config.recoveryAnalysisEnabled ? '18px' : '2px',
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: '#ffffff'
                      }}
                    />
                  </button>
                  <span>Enable Analysis</span>
                  <select
                    value={config.recoveryAnalysisType}
                    onChange={(e) => setConfig((p) => ({ ...p, recoveryAnalysisType: e.target.value }))}
                    style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #334155', background: '#ffffff', color: '#0f172a', fontWeight: 600, fontSize: '12px' }}
                  >
                    <option value="Percentage Analysis">Percentage Analysis</option>
                    <option value="Pattern Analysis">Pattern Analysis</option>
                  </select>
                </div>
              </div>

              <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 600 }}>Signal Check</span>
                  <select
                    value={config.recoverySignalCheck}
                    onChange={(e) => setConfig((p) => ({ ...p, recoverySignalCheck: e.target.value }))}
                    style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', fontWeight: 600 }}
                  >
                    <option value="On First Entry Only">On First Entry Only</option>
                    <option value="Every Recovery Step">Every Recovery Step</option>
                  </select>
                </div>

                {config.recoveryConditions.map((cond) => (
                  <div
                    key={cond.id}
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px' }}>
                        <strong style={{ color: '#0f766e' }}>{cond.clause}</strong>
                        <select
                          value={cond.parity}
                          onChange={(e) => updateRecoveryCondition(cond.id, { parity: e.target.value })}
                          style={{ padding: '4px 7px', borderRadius: '5px', border: '1px solid #cbd5e1', background: '#ffffff', fontWeight: 600 }}
                        >
                          <option value="Even">Even</option>
                          <option value="Odd">Odd</option>
                        </select>
                        <span>% of last</span>
                        <input
                          type="number"
                          min="5"
                          max="100"
                          value={cond.windowTicks}
                          onChange={(e) => updateRecoveryCondition(cond.id, { windowTicks: Number(e.target.value) || 25 })}
                          style={{ width: '48px', padding: '3px 6px', borderRadius: '5px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 600 }}
                        />
                        <span>digits is</span>
                        <select
                          value={cond.operator}
                          onChange={(e) => updateRecoveryCondition(cond.id, { operator: e.target.value })}
                          style={{ padding: '4px 7px', borderRadius: '5px', border: '1px solid #cbd5e1', background: '#ffffff', fontWeight: 600 }}
                        >
                          <option value=">=">&gt;=</option>
                          <option value="<=">&lt;=</option>
                        </select>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={cond.threshold}
                          onChange={(e) => updateRecoveryCondition(cond.id, { threshold: Number(e.target.value) || 55 })}
                          style={{ width: '50px', padding: '3px 6px', borderRadius: '5px', border: '1px solid #cbd5e1', textAlign: 'center', fontWeight: 600 }}
                        />
                        <span>%</span>
                      </div>

                      {config.recoveryConditions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRecoveryCondition(cond.id)}
                          title="Delete condition"
                          style={{ border: 'none', background: 'transparent', color: '#dc2626', cursor: 'pointer', fontWeight: 700 }}
                        >
                          🗑
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>THEN Purchase</span>
                      <select
                        value={cond.thenPurchase}
                        onChange={(e) => updateRecoveryCondition(cond.id, { thenPurchase: e.target.value })}
                        style={{ padding: '4px 8px', borderRadius: '5px', border: '1px solid #cbd5e1', background: '#ffffff', fontWeight: 600 }}
                      >
                        <option value="Even">Even</option>
                        <option value="Odd">Odd</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 700 }}>
                      <span style={{ padding: '3px 8px', borderRadius: '5px', background: '#e0f2fe', color: '#0369a1' }}>
                        Even: {cond.evenPct.toFixed(1)}%
                      </span>
                      <span style={{ padding: '3px 8px', borderRadius: '5px', background: '#fce7f3', color: '#be185d' }}>
                        Odd: {cond.oddPct.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}

                <div>
                  <button
                    type="button"
                    onClick={addRecoveryCondition}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid #0d9488',
                      background: '#ffffff',
                      color: '#0f766e',
                      fontWeight: 700,
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    + Add condition
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
