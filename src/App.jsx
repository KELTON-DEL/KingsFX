import React, { useCallback, useState } from 'react';
import './styles/kingsfx.css';
import './styles/kingsfx-pro.css';
import './styles/dcircles.css';
import { useDerivEngine } from './hooks/useDerivEngine';
import { useIndependentBots } from './hooks/useIndependentBots';
import Header from './components/Header';
import DashboardPro from './components/DashboardPro';
import AnalysisTools from './components/AnalysisTools';
import BotBuilder from './components/BotBuilder';
import PremiumBotsSuite from './components/PremiumBotsSuite';
import {
  FreeBotsView,
  QuickBotView,
  SpeedbotView,
  SpecializedHubView
} from './components/WorkspaceViews';
import FooterBar from './components/FooterBar';

export default function App() {
  const [activeNav, setActiveNav] = useState('dashboard');
  const [isRunning, setIsRunning] = useState(false);
  const [execSpeed, setExecSpeed] = useState('FAST');
  const [logs, setLogs] = useState([]);

  const handleLogEvent = useCallback((entry) => {
    setLogs((prev) => [entry, ...prev.slice(0, 49)]);
  }, []);

  const handleSettlement = useCallback(
    (settled) => {
      const sign = settled.profit >= 0 ? '+' : '';
      handleLogEvent({
        time: settled.time,
        msg: `[SETTLED #${settled.contractId}] ${sign}${settled.profit.toFixed(2)}`
      });
    },
    [handleLogEvent]
  );

  const {
    ticksByMarket,
    liveDeltas,
    feedMode,
    socketState,
    connectionIssue,
    retryConnection,
    authStatus,
    authError,
    account,
    oauthAccounts,
    accountMode,
    switchAccountMode,
    currency,
    toggleCurrency,
    balance,
    demoBalance,
    realBalance,
    resetDemoCapital,
    authorizeToken,
    disconnectAccount,
    executeContract
  } = useDerivEngine(140, handleSettlement);

  const handleResetDemoWithLog = useCallback(() => {
    const res = resetDemoCapital();
    if (res?.ok && res.message) {
      handleLogEvent({
        time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
        msg: `[DEMO] ${res.message}`
      });
    }
    return res;
  }, [resetDemoCapital, handleLogEvent]);

  const handleTradeResult = useCallback(
    (trade) => {
      executeContract({
        symbol: 'R_100',
        contractType: trade.won ? 'DIGITEVEN' : 'DIGITODD',
        amount: Math.max(0.35, Math.abs(trade.delta) || 1),
        duration: 1,
        durationUnit: 't',
        simulatedWon: trade.won,
        botLabel: trade.botName
      }).then((res) => {
        handleLogEvent({
          time: trade.time,
          msg: res.live ? res.summary : trade.msg
        });
      });
    },
    [executeContract, handleLogEvent]
  );

  const { botStates, toggleBot } = useIndependentBots(
    ticksByMarket,
    currency,
    handleTradeResult
  );

  const activeBotsCount = Object.values(botStates).filter((b) => b.running).length;

  const renderActiveModule = () => {
    switch (activeNav) {
      case 'dashboard':
        return (
          <DashboardPro
            ticksByMarket={ticksByMarket}
            onNavigate={setActiveNav}
            activeBotsCount={activeBotsCount}
          />
        );
      case 'bot-builder':
        return (
          <BotBuilder
            logs={logs}
            onClearLogs={() => setLogs([])}
            onLogEvent={handleLogEvent}
            onNavigate={setActiveNav}
            ticksByMarket={ticksByMarket}
            currency={currency}
            isRunning={isRunning}
            onToggleRun={() => setIsRunning((r) => !r)}
          />
        );
      case 'free-bots':
        return (
          <FreeBotsView
            onNavigate={setActiveNav}
            onLogEvent={handleLogEvent}
            currency={currency}
          />
        );
      case 'premium-ai-bots':
      case 'premium-bots':
      case 'smart-ai':
        return (
          <PremiumBotsSuite
            activeTab={activeNav}
            botStates={botStates}
            onToggleBot={toggleBot}
            ticksByMarket={ticksByMarket}
            currency={currency}
          />
        );
      case 'quick-bot':
        return (
          <QuickBotView
            ticksByMarket={ticksByMarket}
            currency={currency}
            onLogEvent={handleLogEvent}
          />
        );
      case 'analysis-tools':
        return (
          <AnalysisTools
            ticksByMarket={ticksByMarket}
            logs={logs}
            onClearLogs={() => setLogs([])}
            feedMode={feedMode}
          />
        );
      case 'speedbot':
        return (
          <SpeedbotView
            ticksByMarket={ticksByMarket}
            currency={currency}
            onLogEvent={handleLogEvent}
          />
        );
      default:
        return (
          <SpecializedHubView
            activeNav={activeNav}
            ticksByMarket={ticksByMarket}
            currency={currency}
            onNavigate={setActiveNav}
            onLogEvent={handleLogEvent}
          />
        );
    }
  };

  return (
    <div className="kfx-app">
      <Header
        activeNav={activeNav}
        onSelectNav={setActiveNav}
        balance={balance}
        demoBalance={demoBalance}
        realBalance={realBalance}
        accountMode={accountMode}
        onSwitchAccountMode={switchAccountMode}
        onResetDemoCapital={handleResetDemoWithLog}
        currency={currency}
        onToggleCurrency={toggleCurrency}
        onOpenReports={() => setActiveNav('analysis-tools')}
        liveDeltas={liveDeltas}
        ticksByMarket={ticksByMarket}
        socketState={socketState}
        connectionIssue={connectionIssue}
        onRetryConnection={retryConnection}
        authStatus={authStatus}
        authError={authError}
        account={account}
        oauthAccounts={oauthAccounts}
        onAuthorizeToken={authorizeToken}
        onDisconnect={disconnectAccount}
      />

      {renderActiveModule()}

      <FooterBar
        isRunning={isRunning || activeBotsCount > 0}
        onToggleRun={() => setIsRunning((r) => !r)}
        execSpeed={execSpeed}
        onCycleSpeed={() => setExecSpeed((s) => (s === 'FAST' ? 'NORMAL' : 'FAST'))}
      />
    </div>
  );
}
