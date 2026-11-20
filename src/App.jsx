import React, { useCallback, useMemo, useState } from 'react';
import './styles/kingsfx.css';
import './styles/kingsfx-pro.css';
import './styles/dcircles.css';
import './styles/builder.css';
import './styles/bot-builder-mkorean.css';

import { SYNTHETIC_MARKETS } from './data/markets';
import { useDerivEngine } from './hooks/useDerivEngine';
import { useIndependentBots } from './hooks/useIndependentBots';

import Header from './components/Header';
import DashboardPro from './components/DashboardPro';
import Dashboard from './components/Dashboard';
import BotBuilder from './components/BotBuilder';
import AnalysisTools from './components/AnalysisTools';
import PremiumBotsSuite from './components/PremiumBotsSuite';
import XmlBotsRunner from './components/XmlBotsRunner';
import ModuleHub from './components/ModuleHub';
import FooterBar from './components/FooterBar';

export default function App() {
  const [activeNav, setActiveNav] = useState('dashboard');
  const [selectedBot, setSelectedBot] = useState(null);
  const [logs, setLogs] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(0);

  const speeds = ['FAST', 'NORMAL', 'SAFE'];
  const execSpeed = speeds[speedIdx];

  const appendLog = useCallback((entry) => {
    const time =
      typeof entry === 'string'
        ? new Date().toLocaleTimeString('en-GB', { hour12: false })
        : entry.time || new Date().toLocaleTimeString('en-GB', { hour12: false });
    const msg = typeof entry === 'string' ? entry : entry.msg || '';
    const meta = typeof entry === 'object' ? entry : {};
    setLogs((prev) => [{ time, msg, ...meta }, ...prev.slice(0, 299)]);
  }, []);

  const recordTransaction = useCallback((tx) => {
    setTransactions((prev) => [
      {
        id: tx.id || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        time: tx.time || new Date().toLocaleTimeString('en-GB', { hour12: false }),
        botName: tx.botName || 'Bot Builder',
        symbol: tx.symbol || 'R_100',
        contractType: tx.contractType || 'DIGITUNDER',
        barrier: tx.barrier ?? '',
        stake: Number(tx.stake ?? 1),
        payout: Number(tx.payout ?? 0),
        profit: Number(tx.profit ?? 0),
        won: Boolean(tx.won),
        status: tx.status || (tx.won ? 'WON' : 'LOST')
      },
      ...prev.slice(0, 299)
    ]);
  }, []);

  const handleTradeSettlement = useCallback(
    ({ symbol, profit, won, time }) => {
      const pNum = Number(profit || 0);
      appendLog({
        time,
        type: 'settlement',
        msg: `[SETTLED ${won ? 'WON' : 'LOST'}] ${symbol} -> ${pNum >= 0 ? '+' : ''}${pNum.toFixed(2)}`
      });
    },
    [appendLog]
  );

  const deriv = useDerivEngine(140, handleTradeSettlement);

  const handleBotTradeResult = useCallback(
    async (trade) => {
      const res = await deriv.executeContract({
        symbol: trade.symbol,
        contractType: trade.contractType,
        amount: trade.amount,
        duration: trade.duration,
        durationUnit: trade.durationUnit,
        barrier: trade.barrier,
        simulatedWon: trade.simulatedWon,
        botLabel: trade.botName
      });

      const won = typeof res?.won === 'boolean' ? res.won : Boolean(trade.won ?? trade.simulatedWon);
      const profit =
        typeof res?.delta === 'number' && !Number.isNaN(res.delta)
          ? Number(res.delta)
          : won
          ? Number((trade.amount * 0.85).toFixed(2))
          : Number((-trade.amount).toFixed(2));
      const payout = won ? Number((trade.amount + profit).toFixed(2)) : 0;

      appendLog({
        time: trade.time,
        type: 'trade',
        botName: trade.botName,
        symbol: trade.symbol,
        contractType: trade.contractType,
        profit,
        won,
        msg: res?.summary || trade.msg
      });

      recordTransaction({
        time: trade.time,
        botName: trade.botName,
        symbol: trade.symbol,
        contractType: trade.contractType,
        barrier: trade.barrier,
        stake: trade.amount,
        payout,
        profit,
        won,
        status: won ? 'WON' : 'LOST'
      });

      return { ...res, won, delta: profit };
    },
    [deriv, appendLog, recordTransaction]
  );

  const {
    botStates,
    xmlBots,
    toggleBot,
    updateBotConfig,
    resetBotSession
  } = useIndependentBots(deriv.ticksByMarket, deriv.currency, handleBotTradeResult);

  const openBotInBuilder = useCallback((botOrId) => {
    const found =
      typeof botOrId === 'object' && botOrId !== null
        ? botOrId
        : (xmlBots || []).find((b) => b.id === botOrId) || { id: botOrId, name: String(botOrId) };
    setSelectedBot(found);
    setActiveNav('bot-builder');
  }, [xmlBots]);

  const activeBotsCount = useMemo(
    () => Object.values(botStates || {}).filter((b) => b.running).length,
    [botStates]
  );

  const handleToggleMasterEngine = useCallback(() => {
    if (activeBotsCount > 0) {
      Object.values(botStates).forEach((b) => {
        if (b.running) toggleBot(b.id);
      });
      appendLog('[Engine] Stopped all active bots.');
    } else {
      const targetBot = selectedBot || xmlBots[0];
      if (targetBot) {
        toggleBot(targetBot.id);
        appendLog(`[Engine] Started ${targetBot.name}.`);
      }
    }
  }, [activeBotsCount, botStates, toggleBot, appendLog, selectedBot, xmlBots]);

  const handleClearAllLogs = useCallback(() => {
    setLogs([]);
    setTransactions([]);
  }, []);

  const renderMainView = () => {
    switch (activeNav) {
      case 'dashboard':
        return (
          <DashboardPro
            ticksByMarket={deriv.ticksByMarket}
            onNavigate={setActiveNav}
            activeBotsCount={activeBotsCount}
          />
        );
      case 'bot-builder':
        return (
          <BotBuilder
            selectedBot={selectedBot}
            onSelectBot={setSelectedBot}
            botStates={botStates}
            xmlBots={xmlBots}
            onToggleBot={toggleBot}
            onUpdateBotConfig={updateBotConfig}
            onResetBotSession={resetBotSession}
            logs={logs}
            transactions={transactions}
            onClearLogs={handleClearAllLogs}
            onLogEvent={appendLog}
            onRecordTransaction={recordTransaction}
            onExecuteContract={deriv.executeContract}
            onNavigate={setActiveNav}
            ticksByMarket={deriv.ticksByMarket}
            currency={deriv.currency}
            balance={deriv.balance}
            execSpeed={execSpeed}
            onCycleSpeed={() => setSpeedIdx((i) => (i + 1) % speeds.length)}
            isRunning={activeBotsCount > 0}
            onToggleRun={handleToggleMasterEngine}
          />
        );
      case 'analysis-tools':
        return (
          <AnalysisTools
            ticksByMarket={deriv.ticksByMarket}
            logs={logs}
            onClearLogs={() => setLogs([])}
            feedMode={deriv.feedMode}
          />
        );
      case 'free-bots':
        return (
          <div style={{ padding: '18px 24px 40px', background: '#0f172a', color: '#f8fafc', flex: 1 }}>
            <div style={{ maxWidth: 1280, margin: '0 auto' }}>
              <h2 style={{ fontSize: 22, fontWeight: 900 }}>Free Strategy Bots</h2>
              <XmlBotsRunner
                xmlBots={xmlBots.filter((b) => b.tier === 'free')}
                botStates={botStates}
                onToggleBot={toggleBot}
                onOpenInBuilder={openBotInBuilder}
                onUpdateBotConfig={updateBotConfig}
                onResetBotSession={resetBotSession}
                currency={deriv.currency}
              />
            </div>
          </div>
        );
      case 'premium-ai-bots':
      case 'premium-bots':
      case 'smart-ai':
        return (
          <PremiumBotsSuite
            activeTab={activeNav}
            botStates={botStates}
            onToggleBot={toggleBot}
            onOpenInBuilder={openBotInBuilder}
            onUpdateBotConfig={updateBotConfig}
            ticksByMarket={deriv.ticksByMarket}
            currency={deriv.currency}
          />
        );
      case 'quick-bot':
        return <Dashboard logs={logs} onClearLogs={() => setLogs([])} />;
      case 'chart': {
        const primary = SYNTHETIC_MARKETS[8] || SYNTHETIC_MARKETS[0];
        const series = deriv.ticksByMarket[primary.id] || [];
        return (
          <section className="kfx-dash-wrap">
            <div className="kfx-dash-inner">
              <div className="kfx-overview-card">
                <div className="kfx-overview-top">
                  <h2 style={{ fontSize: 20, fontWeight: 900 }}>{primary.label} Live Ticks</h2>
                  <button type="button" className="kfx-btn-ghost" onClick={() => setActiveNav('dashboard')}>
                    Back to Dashboard
                  </button>
                </div>
                <div className="kfx-spot-big">
                  {Number(series[series.length - 1]?.price ?? primary.base).toFixed(primary.decimals)}
                </div>
                <div style={{ fontSize: 12, color: '#D6B9BC' }}>
                  Recent ticks captured: {series.length} · Last digit: {series[series.length - 1]?.digit ?? 0}
                </div>
              </div>
            </div>
          </section>
        );
      }
      case 'pulse-scanner':
      case 'confluence-ai':
      case 'hedging':
      case 'auto-trading':
      case 'signal-ai':
      case 'manual-trader':
      case 'bulk-trader':
      case 'copy-trader':
      case 'speedbot':
      default:
        return (
          <ModuleHub
            activeNav={activeNav}
            ticksByMarket={deriv.ticksByMarket}
            onNavigate={setActiveNav}
            onOpenBotInBuilder={openBotInBuilder}
            onLogEvent={appendLog}
          />
        );
    }
  };

  return (
    <div className="kfx-app">
      <Header
        activeNav={activeNav}
        onSelectNav={setActiveNav}
        balance={deriv.balance}
        demoBalance={deriv.demoBalance}
        realBalance={deriv.realBalance}
        accountMode={deriv.accountMode}
        onSwitchAccountMode={deriv.switchAccountMode}
        onResetDemoCapital={deriv.resetDemoCapital}
        currency={deriv.currency}
        onToggleCurrency={deriv.toggleCurrency}
        onOpenReports={() => setReportsOpen(true)}
        liveDeltas={deriv.liveDeltas}
        ticksByMarket={deriv.ticksByMarket}
        socketState={deriv.socketState}
        connectionIssue={deriv.connectionIssue}
        onRetryConnection={deriv.retryConnection}
        authStatus={deriv.authStatus}
        authError={deriv.authError}
        account={deriv.account}
        oauthAccounts={deriv.oauthAccounts}
        onAuthorizeToken={deriv.authorizeToken}
        onDisconnect={deriv.disconnectAccount}
      />

      {renderMainView()}

      {reportsOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16
          }}
          onClick={() => setReportsOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 560,
              maxHeight: '80vh',
              overflowY: 'auto',
              background: '#FFFFFF',
              color: '#111827',
              borderRadius: 12,
              padding: 20
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 18, fontWeight: 900 }}>Session Trade &amp; Bot Reports</h3>
              <button type="button" className="kfx-mini-btn is-ready" onClick={() => setReportsOpen(false)}>
                Close
              </button>
            </div>
            {!logs.length ? (
              <div style={{ fontSize: 13, color: '#6B7280' }}>No bot executions recorded yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {logs.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: 12,
                      padding: '8px 10px',
                      background: '#F9FAFB',
                      borderRadius: 6,
                      border: '1px solid #E5E7EB'
                    }}
                  >
                    <strong>[{item.time}]</strong> {item.msg}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <FooterBar
        hideRunEngine={activeNav === 'bot-builder'}
        isRunning={activeBotsCount > 0}
        onToggleRun={handleToggleMasterEngine}
        execSpeed={execSpeed}
        onCycleSpeed={() => setSpeedIdx((i) => (i + 1) % speeds.length)}
      />
    </div>
  );
}
