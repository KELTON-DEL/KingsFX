import { useEffect, useRef, useState } from 'react';
import { SYNTHETIC_MARKETS } from '../data/markets';

function extractLastDigit(price, decimals) {
  const clean = Number(price).toFixed(decimals).replace('.', '');
  return Number(clean.charAt(clean.length - 1));
}

export function useDerivSocket(appId = '1089', maxHistory = 160) {
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connecting' | 'connected' | 'fallback'
  const [accountInfo, setAccountInfo] = useState(null);
  const [ticksByMarket, setTicksByMarket] = useState(() => {
    const seed = {};
    SYNTHETIC_MARKETS.forEach((m) => {
      seed[m.id] = [
        {
          price: m.base,
          digit: extractLastDigit(m.base, m.decimals),
          time: new Date().toLocaleTimeString('en-GB', { hour12: false })
        }
      ];
    });
    return seed;
  });

  const [liveDeltas, setLiveDeltas] = useState(() => {
    const map = {};
    SYNTHETIC_MARKETS.forEach((m) => {
      const val = parseFloat(m.delta) || 0;
      map[m.id] = { value: val, up: val >= 0 };
    });
    return map;
  });

  const wsRef = useRef(null);
  const firstPriceRef = useRef({});

  useEffect(() => {
    let isMounted = true;
    const socket = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${appId}`);
    wsRef.current = socket;

    socket.onopen = () => {
      if (!isMounted) return;
      setConnectionStatus('connected');

      // Subscribe to live ticks for unique Deriv symbols
      const seenSymbols = new Set();
      SYNTHETIC_MARKETS.forEach((m) => {
        if (seenSymbols.has(m.symbol)) return;
        seenSymbols.add(m.symbol);
        socket.send(
          JSON.stringify({
            ticks: m.symbol,
            subscribe: 1
          })
        );
      });
    };

    socket.onmessage = (event) => {
      if (!isMounted) return;
      let data;
      try {
        data = JSON.parse(event.data);
      } catch {
        return;
      }

      if (data.msg_type === 'tick' && data.tick) {
        const { symbol, quote, epoch } = data.tick;
        const timeStr = new Date(epoch * 1000).toLocaleTimeString('en-GB', { hour12: false });

        setTicksByMarket((prev) => {
          const next = { ...prev };
          SYNTHETIC_MARKETS.forEach((m) => {
            if (m.symbol !== symbol) return;
            const numericPrice = Number(quote);
            const digit = extractLastDigit(numericPrice, m.decimals);
            const history = prev[m.id] || [];

            if (firstPriceRef.current[m.id] === undefined) {
              firstPriceRef.current[m.id] = numericPrice;
            }
            const baseRef = firstPriceRef.current[m.id] || numericPrice;
            const pctChange = baseRef ? ((numericPrice - baseRef) / baseRef) * 100 : 0;

            setLiveDeltas((dPrev) => ({
              ...dPrev,
              [m.id]: {
                value: Number(pctChange.toFixed(2)),
                up: pctChange >= 0
              }
            }));

            next[m.id] = [
              ...history.slice(-(maxHistory - 1)),
              { price: numericPrice, digit, time: timeStr }
            ];
          });
          return next;
        });
      }

      if (data.msg_type === 'authorize' && data.authorize) {
        setAccountInfo({
          loginid: data.authorize.loginid,
          balance: data.authorize.balance,
          currency: data.authorize.currency
        });
      }

      if (data.msg_type === 'balance' && data.balance) {
        setAccountInfo((prev) => ({
          ...(prev || {}),
          balance: data.balance.balance,
          currency: data.balance.currency
        }));
      }
    };

    socket.onerror = () => {
      if (!isMounted) return;
      setConnectionStatus('fallback');
    };

    socket.onclose = () => {
      if (!isMounted) return;
      setConnectionStatus((cur) => (cur === 'connected' ? 'fallback' : cur));
    };

    return () => {
      isMounted = false;
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
    };
  }, [appId, maxHistory]);

  const authorizeToken = (token) => {
    const trimmed = (token || '').trim();
    if (!trimmed) return;
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ authorize: trimmed }));
      wsRef.current.send(JSON.stringify({ balance: 1, subscribe: 1 }));
    }
  };

  return {
    ticksByMarket,
    liveDeltas,
    connectionStatus,
    accountInfo,
    authorizeToken
  };
}