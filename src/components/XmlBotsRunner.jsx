import React, { useState } from 'react';
import BotRunnerModal from './BotRunnerModal';

export default function XmlBotsRunner({
  xmlBots,
  botStates,
  onToggleBot,
  onUpdateBotConfig,
  onResetBotSession,
  currency = 'USD'
}) {
  const [selectedBotId, setSelectedBotId] = useState(null);

  const selectedBot = (xmlBots || []).find((b) => b.id === selectedBotId) || null;
  const selectedState = selectedBot ? botStates?.[selectedBot.id] : null;

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '16px', marginTop: '16px' }}>
        {(xmlBots || []).map((bot) => {
          const st = botStates?.[bot.id] || {};
          const isRunning = Boolean(st.running);
          const profitColor = (st.netProfit || 0) >= 0 ? '#16a34a' : '#dc2626';

          return (
            <div
              key={bot.id}
              onClick={() => setSelectedBotId(bot.id)}
              style={{
                border: '1px solid rgba(148, 163, 184, 0.25)',
                borderRadius: '12px',
                padding: '16px',
                background: 'rgba(15, 23, 42, 0.65)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '15px' }}>{bot.name}</div>
                  <div style={{ fontSize: '12px', opacity: 0.75 }}>
                    {st.symbol || bot.defaultSymbol} • {st.contractType || bot.contractType} • {bot.badge}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '4px 8px',
                    borderRadius: '999px',
                    background: isRunning ? 'rgba(22, 163, 74, 0.2)' : 'rgba(100, 116, 139, 0.2)',
                    color: isRunning ? '#4ade80' : '#cbd5e1'
                  }}
                >
                  {st.lastStatus || 'IDLE'}
                </span>
              </div>

              <p style={{ fontSize: '12.5px', lineHeight: 1.45, opacity: 0.85, margin: 0 }}>{bot.description}</p>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', paddingTop: '4px', borderTop: '1px solid rgba(148,163,184,0.15)' }}>
                <span>Stake: <strong>{(st.baseStake ?? bot.defaultStake).toFixed(2)} {currency}</strong></span>
                <span>TP/SL: <strong>{st.takeProfit ?? bot.defaultTakeProfit}/{st.stopLoss ?? bot.defaultStopLoss}</strong></span>
                <span style={{ color: profitColor, fontWeight: 700 }}>
                  {(st.netProfit || 0) >= 0 ? '+' : ''}{(st.netProfit || 0).toFixed(2)}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }} onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => setSelectedBotId(bot.id)}
                  style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(20, 184, 166, 0.5)',
                    background: 'rgba(20, 184, 166, 0.14)',
                    color: '#5eead4',
                    cursor: 'pointer',
                    fontWeight: 700
                  }}
                >
                  Open Bot Builder
                </button>
                <button
                  type="button"
                  onClick={() => onToggleBot?.(bot.id)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: 700,
                    cursor: 'pointer',
                    background: isRunning ? '#ef4444' : '#22c55e',
                    color: '#0f172a'
                  }}
                >
                  {isRunning ? 'Stop' : 'Run'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <BotRunnerModal
        bot={selectedBot}
        botState={selectedState}
        isOpen={Boolean(selectedBot)}
        onClose={() => setSelectedBotId(null)}
        onToggleBot={onToggleBot}
        onUpdateBotConfig={onUpdateBotConfig}
        onResetBotSession={onResetBotSession}
        currency={currency}
      />
    </>
  );
}
