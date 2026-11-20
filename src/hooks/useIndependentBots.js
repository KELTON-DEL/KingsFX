import { useCallback, useEffect, useRef, useState } from 'react';
import { XML_BOT_DEFINITIONS } from '../data/xmlBots';

export { XML_BOT_DEFINITIONS };
export const BOT_CATALOG = XML_BOT_DEFINITIONS;

function createInitialBotState(bot) {
  return {
    id: bot.id,
    name: bot.name,
    running: false,
    symbol: bot.defaultSymbol,
    contractType: bot.contractType,
    duration: bot.defaultDuration,
    durationUnit: bot.defaultDurationUnit,
    baseStake: bot.defaultStake,
    currentStake: bot.defaultStake,
    takeProfit: bot.defaultTakeProfit,
    stopLoss: bot.defaultStopLoss,
    martingaleEnabled: (bot.recoveryMultiplier || 1) > 1,
    recoveryMultiplier: bot.recoveryMultiplier || 1,
    safeMode: false,
    netProfit: 0,
    wins: 0,
    losses: 0,
    consecutiveLosses: 0,
    recoveryReturnsUsed: 0,
    ticksSeen: 0,
    lastBarrier: bot.contractType === 'DIGITUNDER' ? 8 : bot.contractType === 'DIGITOVER' ? 4 : 0,
    lastStatus: 'IDLE',
    lastSignal: 'Ready'
  };
}

function evaluateEntrySignal(bot, state, marketTicks) {
  const digits = (marketTicks || []).map((t) => Number(t.digit));
  const d1 = digits[digits.length - 1];
  const d2 = digits[digits.length - 2];
  const d3 = digits[digits.length - 3];
  const d4 = digits[digits.length - 4];

  if (d1 === undefined) {
    return { shouldEnter: false, barrier: state.lastBarrier, confidence: 0, reason: 'Waiting for ticks' };
  }

  const recent20 = digits.slice(-20);
  const evenRatio = recent20.length
    ? Math.round((recent20.filter((d) => d % 2 === 0).length / recent20.length) * 100)
    : 50;

  let signal = { shouldEnter: false, barrier: state.lastBarrier, confidence: 75, reason: 'Scanning' };

  switch (bot.entryStrategy) {
    case 'osam_under_adaptive': {
      const barrier = state.consecutiveLosses >= 2 ? 5 : state.consecutiveLosses === 1 ? 9 : 8;
      signal = {
        shouldEnter: d1 <= barrier,
        barrier,
        confidence: barrier >= 8 ? 90 : 84,
        reason: `Digit ${d1} under ${barrier}`
      };
      break;
    }
    case 'c4_virtual_hook_under': {
      const hookPassed = state.ticksSeen % 2 === 0 || state.consecutiveLosses === 0;
      const barrier = state.consecutiveLosses >= 1 ? 5 : 9;
      signal = {
        shouldEnter: hookPassed && d1 <= barrier,
        barrier,
        confidence: hookPassed ? 91 : 72,
        reason: `VH ${hookPassed ? 'pass' : 'wait'} · Under ${barrier}`
      };
      break;
    }
    case 'volt5_under_switch': {
      const barrier = state.consecutiveLosses >= 1 ? 3 : 8;
      signal = {
        shouldEnter: d1 <= barrier,
        barrier,
        confidence: barrier >= 8 ? 88 : 80,
        reason: `Volt5 Under ${barrier}`
      };
      break;
    }
    case 'banker_digit_over': {
      signal = {
        shouldEnter: d1 <= 3,
        barrier: 4,
        confidence: d1 <= 2 ? 92 : 85,
        reason: `Low digit ${d1} -> Over 4`
      };
      break;
    }
    case 'consecutive_pair_differs': {
      const pairMatch = d2 !== undefined && d1 === d2;
      signal = {
        shouldEnter: pairMatch,
        barrier: d1,
        confidence: pairMatch ? 90 : 65,
        reason: pairMatch ? `Pair ${d1}${d2} -> Differs ${d1}` : 'Waiting for pair'
      };
      break;
    }
    case 'aaba_pattern_differs': {
      const isAaba =
        d2 !== undefined && d3 !== undefined && d4 !== undefined &&
        d4 === d3 && d4 === d1 && d2 !== d1;
      signal = {
        shouldEnter: isAaba,
        barrier: isAaba ? d2 : d1,
        confidence: isAaba ? 93 : 68,
        reason: isAaba ? `AABA match -> Differs ${d2}` : 'Scanning AABA'
      };
      break;
    }
    case 'quad_streak_differs': {
      const quadMatch =
        d2 !== undefined && d3 !== undefined && d4 !== undefined &&
        d1 === d2 && d2 === d3 && d3 === d4;
      signal = {
        shouldEnter: quadMatch,
        barrier: d1,
        confidence: quadMatch ? 95 : 70,
        reason: quadMatch ? `4x ${d1} streak -> Differs ${d1}` : 'Scanning 4-digit streak'
      };
      break;
    }
    case 'dalembert_even': {
      const evenStrong = evenRatio >= 55;
      signal = {
        shouldEnter: evenStrong || state.ticksSeen % 2 === 0,
        barrier: null,
        confidence: evenStrong ? 90 : 82,
        reason: `Even ${evenRatio}% (D'Alembert)`
      };
      break;
    }
    case 'over_4_momentum': {
      signal = {
        shouldEnter: d1 >= 4,
        barrier: 4,
        confidence: d1 >= 5 ? 91 : 84,
        reason: `Digit ${d1} >= 4 -> Over 4`
      };
      break;
    }
    case 'straight_differs_2split':
    default: {
      signal = {
        shouldEnter: d2 !== undefined && d1 === d2,
        barrier: d1,
        confidence: d1 === d2 ? 90 : 76,
        reason: `Differs digit ${d1}`
      };
      break;
    }
  }

  if (state.safeMode && signal.confidence < 90) {
    return { ...signal, shouldEnter: false, reason: `Safe Mode (<90%): ${signal.reason}` };
  }

  return signal;
}

function computeNextStake(bot, state, won) {
  const base = Number(Math.max(0.35, state.baseStake || bot.defaultStake || 1).toFixed(2));
  if (won) {
    return {
      nextStake: base,
      consecutiveLosses: 0,
      recoveryReturnsUsed: state.netProfit >= 0 ? 0 : state.recoveryReturnsUsed
    };
  }

  const nextLosses = state.consecutiveLosses + 1;
  let nextStake = base;
  let nextReturns = state.recoveryReturnsUsed;

  if (!state.martingaleEnabled) {
    nextStake = base;
  } else if (bot.recoveryMode === 'dalembert') {
    const unit = Math.max(0.5, base);
    nextStake = Number((state.currentStake + unit).toFixed(2));
  } else if (bot.recoveryMode === 'split_2_max_3_returns') {
    if (nextReturns < 3) {
      const mult = Number(state.recoveryMultiplier || 1.85);
      nextStake = Number(Math.max(base, (state.currentStake * mult) / 2).toFixed(2));
      nextReturns += 1;
    } else {
      nextStake = base;
    }
  } else if (bot.recoveryMode === 'split_3_martingale') {
    const mult = Number(state.recoveryMultiplier || 1.9);
    nextStake = Number(Math.max(base, (state.currentStake * mult) / 1.5).toFixed(2));
  } else if (bot.recoveryMode === 'fixed_stake' || bot.recoveryMode === 'flat_reentry') {
    nextStake = base;
  } else {
    const mult = Number(state.recoveryMultiplier || bot.recoveryMultiplier || 2);
    nextStake = Number((state.currentStake * mult).toFixed(2));
  }

  return {
    nextStake,
    consecutiveLosses: nextLosses,
    recoveryReturnsUsed: nextReturns
  };
}

export function useIndependentBots(ticksByMarket, currency = 'USD', onTradeResult = null) {
  const [botStates, setBotStates] = useState(() => {
    const map = {};
    XML_BOT_DEFINITIONS.forEach((bot) => {
      map[bot.id] = createInitialBotState(bot);
    });
    return map;
  });

  const busyRef = useRef({});
  const stateRef = useRef(botStates);
  stateRef.current = botStates;

  const updateBotConfig = useCallback((botId, patch = {}) => {
    setBotStates((prev) => {
      const cur = prev[botId];
      if (!cur) return prev;
      const nextBase = patch.baseStake !== undefined ? Number(patch.baseStake) : cur.baseStake;
      return {
        ...prev,
        [botId]: {
          ...cur,
          ...patch,
          baseStake: nextBase,
          currentStake: patch.currentStake !== undefined ? Number(patch.currentStake) : nextBase
        }
      };
    });
  }, []);

  const toggleBot = useCallback((botId, overrideConfig = null) => {
    setBotStates((prev) => {
      const cur = prev[botId];
      if (!cur) return prev;
      const nextRunning = !cur.running;
      const merged = overrideConfig
        ? {
            ...cur,
            ...overrideConfig,
            baseStake: overrideConfig.baseStake ?? cur.baseStake,
            currentStake: overrideConfig.baseStake ?? cur.currentStake
          }
        : cur;

      return {
        ...prev,
        [botId]: {
          ...merged,
          running: nextRunning,
          lastStatus: nextRunning ? 'SCANNING' : 'STOPPED',
          lastSignal: nextRunning ? 'Watching live ticks...' : 'Stopped'
        }
      };
    });
  }, []);

  const resetBotSession = useCallback((botId) => {
    const def = XML_BOT_DEFINITIONS.find((b) => b.id === botId);
    if (!def) return;
    busyRef.current[botId] = false;
    setBotStates((prev) => ({
      ...prev,
      [botId]: createInitialBotState(def)
    }));
  }, []);

  useEffect(() => {
    XML_BOT_DEFINITIONS.forEach((bot) => {
      const st = stateRef.current[bot.id];
      if (!st || !st.running || busyRef.current[bot.id]) return;

      const marketTicks = ticksByMarket[st.symbol] || ticksByMarket.R_100 || [];
      if (!marketTicks.length) return;

      const signal = evaluateEntrySignal(bot, st, marketTicks);
      if (!signal.shouldEnter) {
        setBotStates((prev) => {
          const cur = prev[bot.id];
          if (!cur || !cur.running || cur.lastSignal === signal.reason) return prev;
          return {
            ...prev,
            [bot.id]: { ...cur, lastSignal: signal.reason }
          };
        });
        return;
      }

      busyRef.current[bot.id] = true;
      const stakeToUse = Number(Math.max(0.35, st.currentStake).toFixed(2));
      const fallbackWon = Math.random() < 0.55;
      const nowTime = new Date().toLocaleTimeString('en-GB', { hour12: false });

      setBotStates((prev) => {
        const cur = prev[bot.id];
        if (!cur || !cur.running) return prev;
        return {
          ...prev,
          [bot.id]: {
            ...cur,
            lastStatus: 'EXECUTING',
            lastSignal: `${signal.reason} (${stakeToUse.toFixed(2)} ${currency})`
          }
        };
      });

      const applySettlement = (actualWon, actualDelta, customSummary = '') => {
        const tradeDelta =
          typeof actualDelta === 'number' && !Number.isNaN(actualDelta)
            ? actualDelta
            : actualWon
            ? Number((stakeToUse * 0.85).toFixed(2))
            : Number((-stakeToUse).toFixed(2));

        setBotStates((prev) => {
          const cur = prev[bot.id];
          if (!cur) return prev;

          const nextProfit = Number((cur.netProfit + tradeDelta).toFixed(2));
          const hitTp = nextProfit >= Number(cur.takeProfit);
          const hitSl = nextProfit <= -Math.abs(Number(cur.stopLoss));
          const shouldStop = hitTp || hitSl;

          const rec = computeNextStake(bot, { ...cur, netProfit: nextProfit }, actualWon);

          return {
            ...prev,
            [bot.id]: {
              ...cur,
              running: shouldStop ? false : cur.running,
              ticksSeen: cur.ticksSeen + 1,
              wins: cur.wins + (actualWon ? 1 : 0),
              losses: cur.losses + (actualWon ? 0 : 1),
              netProfit: nextProfit,
              currentStake: rec.nextStake,
              consecutiveLosses: rec.consecutiveLosses,
              recoveryReturnsUsed: rec.recoveryReturnsUsed,
              lastBarrier: signal.barrier ?? cur.lastBarrier,
              lastStatus: hitTp ? 'TP HIT' : hitSl ? 'SL HIT' : actualWon ? 'WON' : 'LOST',
              lastSignal:
                customSummary ||
                `${signal.reason} -> ${actualWon ? '+' : ''}${tradeDelta.toFixed(2)} ${currency}`
            }
          };
        });

        busyRef.current[bot.id] = false;
      };

      if (typeof onTradeResult === 'function') {
        Promise.resolve(
          onTradeResult({
            botId: bot.id,
            botName: bot.name,
            symbol: st.symbol,
            contractType: st.contractType,
            amount: stakeToUse,
            duration: st.duration,
            durationUnit: st.durationUnit,
            barrier: signal.barrier,
            simulatedWon: fallbackWon,
            won: fallbackWon,
            delta: fallbackWon
              ? Number((stakeToUse * 0.85).toFixed(2))
              : Number((-stakeToUse).toFixed(2)),
            time: nowTime,
            msg: `[${bot.name}] ${st.contractType} (${st.symbol}) stake ${stakeToUse.toFixed(2)} ${currency}`
          })
        )
          .then((res) => {
            if (res && typeof res === 'object') {
              const settledWon = typeof res.won === 'boolean' ? res.won : fallbackWon;
              const settledDelta =
                typeof res.delta === 'number' && !Number.isNaN(res.delta) ? res.delta : undefined;
              applySettlement(settledWon, settledDelta, res.summary || '');
            } else {
              applySettlement(fallbackWon);
            }
          })
          .catch(() => applySettlement(fallbackWon));
      } else {
        applySettlement(fallbackWon);
      }
    });
  }, [ticksByMarket, currency, onTradeResult]);

  return {
    botStates,
    xmlBots: XML_BOT_DEFINITIONS,
    botCatalog: XML_BOT_DEFINITIONS,
    toggleBot,
    updateBotConfig,
    resetBotSession
  };
}
