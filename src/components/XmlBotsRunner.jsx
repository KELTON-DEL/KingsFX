import React, { useState } from 'react';
import BotRunnerModal from './BotRunnerModal';

export default function XmlBotsRunner({
  xmlBots = [],
  botStates = {},
  onToggleBot,
  onOpenInBuilder,
  onUpdateBotConfig,
  onResetBotSession,
  currency = 'USD'
}) {
  const [modalBot, setModalBot] = useState(null);

  return (
    <div style={{ marginTop: 16 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
          gap: 14
        }}
      >
        {xmlBots.map((bot) => {
          const st = botStates[bot.id] || {
            running: false,
            wins: 0,
            losses: 0,
            netProfit: 0,
            currentStake: bot.defaultStake || 1,
            lastSignal: 'Ready'
          };
          const pnl = Number(st.pnl ?? st.netProfit ?? 0);

          return (
            <div
              key={bot.id}
              onClick={() => {
                if (typeof onOpenInBuilder === 'function') {
                  onOpenInBuilder(bot);
                } else {
                  setModalBot(bot);
                }
              }}
              style={{
                cursor: 'pointer',
                background: '#1e293b',
                border: st.running ? '1px solid #ef4444' : '1px solid #334155',
                borderRadius: 12,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 12
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8' }}>
                    {bot.defaultSymbol} · {bot.contractType}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: 999,
                      background: st.running ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.15)',
                      color: st.running ? '#fca5a5' : '#6ee7b7'
                    }}
                  >
                    {st.running ? 'RUNNING' : 'READY'}
                  </span>
                </div>
                <div style={{ fontSize: 16, fontWeight: 900, color: '#f8fafc', marginBottom: 4 }}>
                  {bot.name}
                </div>
                <div style={{ fontSize: 12, color: '#cbd5e1', lineHeight: 1.45 }}>
                  {bot.description || bot.desc}
                </div>
              </div>

              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 11,
                    color: '#94a3b8',
                    marginBottom: 8,
                    fontWeight: 700
                  }}
                >
                  <span>W: {st.wins || 0} · L: {st.losses || 0}</span>
                  <span style={{ color: pnl >= 0 ? '#34d399' : '#f87171' }}>
                    {pnl >= 0 ? '+' : ''}
                    {pnl.toFixed(2)} {currency}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (typeof onOpenInBuilder === 'function') {
                      onOpenInBuilder(bot);
                    } else {
                      setModalBot(bot);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: 8,
                    border: 'none',
                    fontWeight: 800,
                    fontSize: 12,
                    cursor: 'pointer',
                    background: '#a50e1a',
                    color: '#ffffff'
                  }}
                >
                  Open in Bot Builder
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {modalBot && (
        <BotRunnerModal
          bot={modalBot}
          state={botStates[modalBot.id]}
          currency={currency}
          onClose={() => setModalBot(null)}
          onToggle={(cfg) => onToggleBot?.(modalBot.id, cfg)}
          onUpdateConfig={(cfg) => onUpdateBotConfig?.(modalBot.id, cfg)}
          onReset={() => onResetBotSession?.(modalBot.id)}
        />
      )}
    </div>
  );
}
