import { useEffect, useRef, useState } from 'react';
import { SYNTHETIC_MARKETS } from '../data/markets';

function extractLastDigit(price, decimals) {
  const clean = Number(price).toFixed(decimals).replace('.', '');
  return Number(clean.charAt(clean.length - 1));
}

function buildInitialHistory(maxHistory = 140) {
  const initial = {};
  SYNTHETIC_MARKETS.forEach((m, idx) => {
    const history = [];
    let cur = m.base;
    const step = Math.pow(10, -m.decimals);
    for (let i = 0; i < maxHistory; i++) {
      const wave = Math.sin((i + idx * 5) * 0.41) + (Math.random() - 0.49) * 2.4;
      cur = Math.max(step * 25, cur + wave * step * 6);
      history.push({
        price: Number(cur.toFixed(m.decimals)),
        digit: extractLastDigit(cur, m.decimals),
        time: new Date(Date.now() - (maxHistory - i) * 1000).toLocaleTimeString('en-GB', { hour12: false })
      });
    }
    initial[m.id] = history;
  });
  return initial;
}

export function useMarketFeed(maxHistory = 140, useLiveDerivWs = true) {
  const [ticksByMarket, setTicksByMarket] = useState(() => buildInitialHistory(maxHistory));
  const [feedMode, setFeedMode] = useState('connecting'); // 'live-ws' | 'simulated' | 'connecting'
  const [liveDeltas, setLiveDeltas] = useState(() => {
    const map = {};
    SYNTHETIC_MARKETS.forEach((m) => {
      const val = parseFloat(m.delta) || 0;
      map[m.id] = { value: val, up: val >= 0 };
    });
    return map;
  });

  const firstPriceRef = useRef({});
  const lastWsTickAtRef = useRef(0);

  // 1. Live Deriv Public WebSocket subscription for all 11 synthetic indices
  useEffect(() => {
    if (!useLiveDerivWs) {
      setFeedMode('simulated');
      return;
    }

    let isMounted = true;
    const socket = new WebSocket('wss://ws.derivws.com/websockets/v3?app_id=1089');

    socket.onopen = () => {
      if (!isMounted) return;
      setFeedMode('live-ws');
      SYNTHETIC_MARKETS.forEach((m) => {
        socket.send(JSON.stringify({ ticks: m.symbol, subscribe: 1 }));
      });
    };

    socket.onmessage = (evt) => {
      if (!isMounted) return;
      let data;
      try {
        data = JSON.parse(evt.data);
      } catch {
        return;
      }

      if (data.msg_type === 'tick' && data.tick) {
        lastWsTickAtRef.current = Date.now();
        const { symbol, quote, epoch } = data.tick;
        const market = SYNTHETIC_MARKETS.find((m) => m.symbol === symbol);
        if (!market) return;

        const price = Number(Number(quote).toFixed(market.decimals));
        const digit = extractLastDigit(price, market.decimals);
        const time = new Date(epoch * 1000).toLocaleTimeString('en-GB', { hour12: false });

        if (firstPriceRef.current[market.id] === undefined) {
          firstPriceRef.current[market.id] = price;
        }
        const baseRef = firstPriceRef.current[market.id] || price;
        const pct = baseRef ? ((price - baseRef) / baseRef) * 100 : 0;

        setLiveDeltas((prev) => ({
          ...prev,
          [market.id]: { value: Number(pct.toFixed(2)), up: pct >= 0 }
        }));

        setTicksByMarket((prev) => {
          const arr = prev[market.id] || [];
          return {
            ...prev,
            [market.id]: [...arr.slice(-(maxHistory - 1)), { price, digit, time }]
          };
        });
      }
    };

    socket.onerror = () => {
      if (isMounted) setFeedMode('simulated');
    };

    socket.onclose = () => {
      if (isMounted) setFeedMode('simulated');
    };

    return () => {
      isMounted = false;
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
    };
  }, [maxHistory, useLiveDerivWs]);

  // 2. Smooth 1-second fallback ticker if offline or blocked by firewall
  useEffect(() => {
    const timer = setInterval(() => {
      if (Date.now() - lastWsTickAtRef.current < 2500) return;
      setTicksByMarket((prev) => {
        const next = { ...prev };
        SYNTHETIC_MARKETS.forEach((m) => {
          const arr = prev[m.id] || [];
          const last = arr[arr.length - 1]?.price ?? m.base;
          const step = Math.pow(10, -m.decimals);
          const jitter = (Math.random() - 0.495) * step * 9;
          const price = Number(Math.max(step * 20, last + jitter).toFixed(m.decimals));
          const digit = extractLastDigit(price, m.decimals);
          const time = new Date().toLocaleTimeString('en-GB', { hour12: false });
          next[m.id] = [...arr.slice(-(maxHistory - 1)), { price, digit, time }];
        });
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [maxHistory]);

  return { ticksByMarket, liveDeltas, feedMode };
}
