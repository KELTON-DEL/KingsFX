import { useEffect, useState } from "react";

/**
 * Custom hook managing Run/Stop state for the Bot Builder.
 * Starts STOPPED (isRunning = false) when Bot Builder opens so it waits
 * until the user clicks Run in the footer.
 */
export function useBotExecution(initialStake = "1", market = "Volatility 10 (1s) Index", contractType = "Under") {
  const [isRunning, setIsRunning] = useState(false);
  const [contractBoughtActive, setContractBoughtActive] = useState(false);
  const [tickCount, setTickCount] = useState(0);
  const [tickProgress, setTickProgress] = useState(0);
  const [runsCount, setRunsCount] = useState(0);
  const [contractsWon, setContractsWon] = useState(0);
  const [contractsLost, setContractsLost] = useState(0);
  const [totalStake, setTotalStake] = useState(0);
  const [totalPayout, setTotalPayout] = useState(0);
  const [sessionProfit, setSessionProfit] = useState(0);
  const [contractProfitLoss, setContractProfitLoss] = useState(0);
  const [contractValue, setContractValue] = useState(0);
  const [activeStatusLabel, setActiveStatusLabel] = useState("Ready — click Run to start");
  const [journalLogs, setJournalLogs] = useState([
    "Bot Builder ready. Bot is currently stopped — click Run in the footer to start trading.",
  ]);

  const triggerContractBoughtAnimation = () => {
    setContractBoughtActive(false);
    requestAnimationFrame(() => {
      setContractBoughtActive(true);
    });
  };

  const toggleRunStop = () => {
    setIsRunning((prev) => {
      const next = !prev;
      const nowStr = new Date().toISOString().replace("T", " ").slice(0, 19) + " GMT";
      if (next) {
        setActiveStatusLabel(`Running ${market} (${contractType})...`);
        setTickProgress(20);
        triggerContractBoughtAnimation();
        setJournalLogs((logs) => [
          `${nowStr} — Bot started on ${market} [${contractType}]`,
          ...logs.slice(0, 29),
        ]);
      } else {
        setContractBoughtActive(false);
        setActiveStatusLabel("Bot stopped");
        setJournalLogs((logs) => [
          `${nowStr} — Bot stopped by user`,
          ...logs.slice(0, 29),
        ]);
      }
      return next;
    });
  };

  const resetStats = () => {
    setTickCount(0);
    setTickProgress(0);
    setRunsCount(0);
    setContractsWon(0);
    setContractsLost(0);
    setTotalStake(0);
    setTotalPayout(0);
    setSessionProfit(0);
    setContractProfitLoss(0);
    setContractValue(0);
    setContractBoughtActive(false);
    setActiveStatusLabel(isRunning ? `Running ${market} (${contractType})...` : "Ready — click Run to start");
  };

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTickCount((t) => (t + 1) % 10);
      setTickProgress((p) => {
        const next = p >= 100 ? 25 : p + 20;
        if (next >= 80) {
          triggerContractBoughtAnimation();
          const numericStake = Math.max(1, parseFloat(initialStake) || 1);
          const won = Math.random() > 0.3;
          const nowStr = new Date().toISOString().replace("T", " ").slice(0, 19) + " GMT";

          setActiveStatusLabel(`Contract bought (${contractType})`);
          setRunsCount((r) => r + 1);
          setTotalStake((s) => Number((s + numericStake).toFixed(2)));

          if (won) {
            const payout = Number((numericStake * 1.85).toFixed(2));
            const profit = Number((payout - numericStake).toFixed(2));
            setContractsWon((w) => w + 1);
            setTotalPayout((tp) => Number((tp + payout).toFixed(2)));
            setSessionProfit((sp) => Number((sp + profit).toFixed(2)));
            setContractProfitLoss(profit);
            setContractValue(payout);
            setJournalLogs((logs) => [
              `${nowStr} — Contract bought & WON (+KSH ${profit.toFixed(2)}) on ${market}`,
              ...logs.slice(0, 29),
            ]);
          } else {
            const loss = Number(numericStake.toFixed(2));
            setContractsLost((l) => l + 1);
            setSessionProfit((sp) => Number((sp - loss).toFixed(2)));
            setContractProfitLoss(-loss);
            setContractValue(0);
            setJournalLogs((logs) => [
              `${nowStr} — Contract bought & LOST (-KSH ${loss.toFixed(2)}) on ${market}`,
              ...logs.slice(0, 29),
            ]);
          }
        }
        return next;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [isRunning, initialStake, market, contractType]);

  return {
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
    triggerContractBoughtAnimation,
  };
}