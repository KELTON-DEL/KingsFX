import React, { useCallback, useMemo, useState } from 'react';
import './styles/kingsfx.css';
import './styles/kingsfx-pro.css';
import './styles/dcircles.css';
import './styles/builder.css';

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
  const [logs, setLogs] = useState([]);
  const [reportsOpen, setReportsOpen] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(0);

  const speeds = ['FAST', 'NORMAL', 'SAFE'];
  const execSpeed = speeds[speedIdx];

  const appendLog = useCallback((entry) => {
    const item =
      typeof entry === 'string'
        ? { time: new Date().toLocaleTimeString('en-GB', { hour12: false }), msg: entry }
        : {
            time: entry.time || new Date().toLocaleTimeString('en-GB', { hour12: false }),
            msg: entry.msg || ''
          };
    setLogs((prev) => [item, ...prev.slice(0, 199)]);
  }, []);

  const handleTradeSettlement = useCallback(
    ({ symbol, profit, won, time }) => {
      appendLog({
        time,
        msg: `[SETTLED ${won ? 'WON' : 'LOST'}] ${symbol} -> ${profit >= 0 ? '+' : ''}${Number(profit).toFixed(2)}`
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
      appendLog({
        time: trade.time,
        msg: res.summary || trade.msg
      });
      return res;
    },
    [deriv, appendLog]
  );

  const {
    botStates,
    xmlBots,
    toggleBot,
    updateBotConfig,
    resetBotSession
  } = useIndependentBots(deriv.ticksByMarket, deriv.currency, handleBotTradeResult);

  const activeBotsCount = useMemo(
    () => Object.values(botStates || {}).filter((b) => b.running).length,
    [botStates]
  );

  const handleToggleMasterEngine = () => {
    if (activeBotsCount > 0) {
      Object.values(botStates).forEach((b) => {
        if (b.running) toggleBot(b.id);
      });
      appendLog('[Engine] Stopped all active bots.');
    } else {
      const firstBot = xmlBots[0];
      if (firstBot) {
        toggleBot(firstBot.id);
        appendLog(`[Engine] Started ${firstBot.name}.`);
      }
    }
  };

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
            logs={logs}
            onClearLogs={() => setLogs([])}
            onLogEvent={appendLog}
            onNavigate={setActiveNav}
            ticksByMarket={deriv.ticksByMarket}
            currency={deriv.currency}
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
                  <div key={i} style={{ fontSize: 12, padding: '8px 10px', background: '#F9FAFB', borderRadius: 6, border: '1px solid #E5E7EB' }}>
                    <strong>[{item.time}]</strong> {item.msg}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <FooterBar
        isRunning={activeBotsCount > 0}
        onToggleRun={handleToggleMasterEngine}
        execSpeed={execSpeed}
        onCycleSpeed={() => setSpeedIdx((i) => (i + 1) % speeds.length)}
      />
    </div>
  );
}
