import { useEffect, useState } from 'react';

export const BOT_CATALOG = [
  {
    id: 'even-odd-ai',
    series: 'CORE SERIES',
    name: 'Even/Odd AI',
    desc: 'Multi-window parity confirmation. Scans market conditions before each entry.',
    tags: ['Even / Odd', 'Market Scanner'],
    accent: '#06B6D4',
    icon: '{0}',
    marketId: 'R_10',
    stake: 1.0,
    intervalMs: 2200,
    mode: 'parity'
  },
  {
    id: 'over4-under5-ai',
    series: 'CORE SERIES',
    name: 'Over 4/Under 5 AI',
    desc: 'Digit-range pressure confirmation. Scans market conditions before each entry.',
    tags: ['Over / Under', 'Market Scanner'],
    accent: '#F59E0B',
    icon: '{0}',
    marketId: 'R_25',
    stake: 1.2,
    intervalMs: 2600,
    mode: 'range'
  },
  {
    id: 'rise-fall-ai',
    series: 'CORE SERIES',
    name: 'Rise/Fall AI',
    desc: 'Trend confirmation, not reversal. Scans market conditions before each entry.',
    tags: ['Rise / Fall', 'Market Scanner'],
    accent: '#8B5CF6',
    icon: '{0}',
    marketId: 'R_100',
    stake: 1.5,
    intervalMs: 2000,
    mode: 'trend'
  },
  {
    id: 'eo-o2u7-rec',
    series: 'RECOVERY SERIES',
    name: 'Even/Odd + O2/U7 Recovery',
    desc: 'Parity entry, independent recovery. Includes an independently analyzed Over 2 / Under 7 recovery setup.',
    tags: ['Even / Odd', 'O2 / U7 Recovery'],
    accent: '#10B981',
    icon: '∿',
    marketId: 'R_50',
    stake: 1.0,
    intervalMs: 2900,
    mode: 'recovery-eo'
  },
  {
    id: 'o4u5-o2u7-rec',
    series: 'RECOVERY SERIES',
    name: 'O4/U5 + O2/U7 Recovery',
    desc: 'Range entry, independent recovery. Includes an independently analyzed Over 2 / Under 7 recovery setup.',
    tags: ['Over / Under', 'O2 / U7 Recovery'],
    accent: '#F97316',
    icon: '∿',
    marketId: 'R_75',
    stake: 1.4,
    intervalMs: 3100,
    mode: 'recovery-ou'
  },
  {
    id: 'hybrid-o2u7-rec',
    series: 'RECOVERY SERIES',
    name: 'Hybrid + O2/U7 Recovery',
    desc: 'Best of parity or range, ranked live. Includes an independently analyzed Over 2 / Under 7 recovery setup.',
    tags: ['Even / Odd + Over / Under', 'O2 / U7 Recovery'],
    accent: '#FB7185',
    icon: '∿',
    marketId: '1HZ10V_S',
    stake: 1.25,
    intervalMs: 2400,
    mode: 'hybrid'
  },
  {
    id: 'fusion-scanner-ai',
    series: 'MULTI-STRATEGY',
    name: 'Fusion Scanner AI',
    desc: 'Full-spectrum market scanner. Includes an independently analyzed Over 2 / Under 7 recovery setup.',
    tags: ['Even / Odd + Over / Under + Rise / Fall', 'O2 / U7 Recovery'],
    accent: '#6366F1',
    icon: '◎',
    marketId: '1HZ100V_S',
    stake: 2.0,
    intervalMs: 1900,
    mode: 'fusion'
  },
  {
    id: 'smart-recovery-ai',
    series: 'AUTOMATED STRATEGY',
    name: 'Smart Recovery AI',
    desc: 'Pattern-led entries with automatic multi-market recovery and confidence guard.',
    tags: ['Multi-Market', 'Auto Recovery'],
    accent: '#7C3AED',
    icon: 'SR',
    marketId: 'R_25',
    stake: 1.0,
    intervalMs: 2500,
    mode: 'smart-recovery'
  }
];

export function useIndependentBots(ticksByMarket, currency, onTradeResult) {
  const [botStates, setBotStates] = useState(() => {
    const initial = {};
    BOT_CATALOG.forEach((b) => {
      initial[b.id] = {
        running: false,
        phase: 'Idle', // 'Scanning Market' | 'Placing Contract' | 'Settling' | 'Idle'
        wins: 0,
        losses: 0,
        pnl: 0,
        lastSignal: 'Ready'
      };
    });
    return initial;
  });

  const toggleBot = (botId) => {
    setBotStates((prev) => {
      const cur = prev[botId];
      const nextRunning = !cur.running;
      return {
        ...prev,
        [botId]: {
          ...cur,
          running: nextRunning,
          phase: nextRunning ? 'Scanning Market' : 'Idle',
          lastSignal: nextRunning ? 'Subscribed to live ticks' : 'Stopped by user'
        }
      };
    });
  };

  useEffect(() => {
    const activeBots = BOT_CATALOG.filter((b) => botStates[b.id]?.running);
    if (!activeBots.length) return;

    const timers = activeBots.map((bot) =>
      setInterval(() => {
        const ticks = ticksByMarket[bot.marketId] || [];
        const latestTick = ticks[ticks.length - 1];
        const prevTick = ticks[ticks.length - 2];
        const digit = latestTick?.digit ?? Math.floor(Math.random() * 10);

        let signalText = `${bot.name} signal on digit ${digit}`;
        let won = digit % 2 === 0;

        if (bot.mode === 'parity') {
          signalText = digit % 2 === 0 ? `Parity EVEN (${digit})` : `Parity ODD (${digit})`;
          won = digit % 2 === 0;
        } else if (bot.mode === 'range') {
          signalText = digit >= 5 ? `Over 4 hit (${digit})` : `Under 5 hit (${digit})`;
          won = digit >= 4;
        } else if (bot.mode === 'trend') {
          const rising = (latestTick?.price ?? 0) >= (prevTick?.price ?? 0);
          signalText = rising ? 'Trend RISE tick' : 'Trend FALL tick';
          won = rising;
        } else if (bot.mode.includes('recovery')) {
          signalText = digit > 2 ? `O2/U7 Recovery check (${digit})` : `Low-digit guard (${digit})`;
          won = digit >= 2;
        } else {
          signalText = `Multi-factor scan digit ${digit}`;
          won = (digit + Math.floor(Math.random() * 3)) % 2 === 0;
        }

        const delta = won
          ? Number((bot.stake * 0.86).toFixed(2))
          : Number((-bot.stake).toFixed(2));

        setBotStates((prev) => {
          const st = prev[bot.id];
          if (!st || !st.running) return prev;
          const nextPhase =
            st.phase === 'Scanning Market'
              ? 'Placing Contract'
              : st.phase === 'Placing Contract'
              ? 'Settling'
              : 'Scanning Market';
          return {
            ...prev,
            [bot.id]: {
              ...st,
              phase: nextPhase,
              wins: st.wins + (won ? 1 : 0),
              losses: st.losses + (won ? 0 : 1),
              pnl: Number((st.pnl + delta).toFixed(2)),
              lastSignal: signalText
            }
          };
        });

        if (onTradeResult) {
          onTradeResult({
            botId: bot.id,
            botName: bot.name,
            delta,
            won,
            time: new Date().toLocaleTimeString('en-GB', { hour12: false }),
            msg: `[${bot.name}] ${signalText} -> ${
              won ? '+' : ''
            }${delta.toFixed(2)} ${currency}`
          });
        }
      }, bot.intervalMs)
    );

    return () => timers.forEach(clearInterval);
  }, [botStates, ticksByMarket, currency, onTradeResult]);

  return { botStates, toggleBot };
}
