import { useCallback, useEffect, useRef, useState } from 'react';
import { DERIV_APP_ID, DERIV_WS_URL, SYNTHETIC_MARKETS } from '../data/markets';

const FX_KSH_PER_USD = 129.0;
const DEFAULT_DEMO_USD = 10000.0;
const AUTH_TIMEOUT_MS = 10000;
const PING_INTERVAL_MS = 25000;
const RECONNECT_BASE_MS = 1500;
const RECONNECT_MAX_MS = 12000;

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

function parseOAuthAccountsFromUrl() {
  if (typeof window === 'undefined') return [];
  const params = new URLSearchParams(window.location.search);
  const found = [];
  for (let i = 1; i <= 10; i++) {
    const acct = params.get(`acct${i}`);
    const token = params.get(`token${i}`);
    const cur = params.get(`cur${i}`) || 'USD';
    if (acct && token) {
      found.push({
        loginid: acct,
        token,
        currency: cur,
        accountType: acct.startsWith('VR') ? 'demo' : 'real'
      });
    }
  }
  return found;
}

export function useDerivEngine(maxHistory = 140, onTradeSettlement = null) {
  const [ticksByMarket, setTicksByMarket] = useState(() => buildInitialHistory(maxHistory));
  const [feedMode, setFeedMode] = useState('connecting');
  const [socketState, setSocketState] = useState('connecting');
  const [connectionIssue, setConnectionIssue] = useState('');
  const [authStatus, setAuthStatus] = useState('disconnected');
  const [authError, setAuthError] = useState('');

  const [accountMode, setAccountMode] = useState('demo');
  const [currency, setCurrency] = useState('USD');

  const [demoBalance, setDemoBalance] = useState(DEFAULT_DEMO_USD);
  const [realBalance, setRealBalance] = useState(0.0);

  const [account, setAccount] = useState(null);
  const [oauthAccounts, setOauthAccounts] = useState(() => parseOAuthAccountsFromUrl());
  const [activeToken, setActiveToken] = useState(() => {
    const fromUrl = parseOAuthAccountsFromUrl();
    if (fromUrl.length) return fromUrl[0].token;
    return localStorage.getItem('kfx_deriv_token') || '';
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
  const reconnectTimerRef = useRef(null);
  const pingTimerRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const authTimerRef = useRef(null);
  const firstPriceRef = useRef({});
  const lastWsTickAtRef = useRef(0);
  const pendingTradesRef = useRef({});
  const settlementCbRef = useRef(onTradeSettlement);
  const accountModeRef = useRef(accountMode);
  const currencyRef = useRef(currency);
  const activeTokenRef = useRef(activeToken);
  const manualDisconnectRef = useRef(false);

  useEffect(() => {
    accountModeRef.current = accountMode;
  }, [accountMode]);

  useEffect(() => {
    currencyRef.current = currency;
  }, [currency]);

  useEffect(() => {
    activeTokenRef.current = activeToken;
  }, [activeToken]);

  useEffect(() => {
    settlementCbRef.current = onTradeSettlement;
  }, [onTradeSettlement]);

  const clearAuthTimeout = useCallback(() => {
    if (authTimerRef.current) {
      clearTimeout(authTimerRef.current);
      authTimerRef.current = null;
    }
  }, []);

  const clearTimers = useCallback(() => {
    clearAuthTimeout();
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (pingTimerRef.current) {
      clearInterval(pingTimerRef.current);
      pingTimerRef.current = null;
    }
  }, [clearAuthTimeout]);

  const armAuthTimeout = useCallback(() => {
    clearAuthTimeout();
    authTimerRef.current = setTimeout(() => {
      setAuthStatus((prev) => {
        if (prev === 'authorizing') {
          setAuthError(
            `Deriv authorization timed out after 10s. Check that your token is active, includes Read/Trade permissions, and App ID ${DERIV_APP_ID} is valid.`
          );
          return 'error';
        }
        return prev;
      });
    }, AUTH_TIMEOUT_MS);
  }, [clearAuthTimeout]);

  useEffect(() => {
    const found = parseOAuthAccountsFromUrl();
    if (found.length) {
      setOauthAccounts(found);
      setActiveToken(found[0].token);
      setAccountMode(found[0].accountType);
      localStorage.setItem('kfx_deriv_token', found[0].token);
      localStorage.setItem('kfx_deriv_oauth_accounts', JSON.stringify(found));
      const cleanUrl = `${window.location.origin}${window.location.pathname}`;
      window.history.replaceState({}, document.title, cleanUrl);
    } else {
      try {
        const cached = JSON.parse(localStorage.getItem('kfx_deriv_oauth_accounts') || '[]');
        if (Array.isArray(cached) && cached.length) setOauthAccounts(cached);
      } catch {
        // ignore storage errors
      }
    }
  }, []);

  const sendRaw = useCallback((payload) => {
    const sock = wsRef.current;
    if (sock && sock.readyState === WebSocket.OPEN) {
      sock.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }, []);

  const connectSocket = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    manualDisconnectRef.current = false;
    setSocketState('connecting');
    setFeedMode('connecting');

    let socket;
    try {
      socket = new WebSocket(DERIV_WS_URL);
    } catch (err) {
      setSocketState('closed');
      setFeedMode('simulated');
      setConnectionIssue(err?.message || 'Unable to initialize WebSocket connection.');
      return;
    }

    wsRef.current = socket;

    socket.onopen = () => {
      reconnectAttemptsRef.current = 0;
      setSocketState('open');
      setFeedMode('live-ws');
      setConnectionIssue('');

      const seenSymbols = new Set();
      SYNTHETIC_MARKETS.forEach((m) => {
        if (seenSymbols.has(m.symbol)) return;
        seenSymbols.add(m.symbol);
        socket.send(JSON.stringify({ ticks: m.symbol, subscribe: 1 }));
      });

      if (pingTimerRef.current) clearInterval(pingTimerRef.current);
      pingTimerRef.current = setInterval(() => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ ping: 1 }));
        }
      }, PING_INTERVAL_MS);

      const savedToken = (localStorage.getItem('kfx_deriv_token') || activeTokenRef.current || '').trim();
      if (savedToken) {
        setAuthStatus('authorizing');
        setAuthError('');
        armAuthTimeout();
        socket.send(JSON.stringify({ authorize: savedToken }));
      }
    };

    socket.onmessage = (evt) => {
      let data;
      try {
        data = JSON.parse(evt.data);
      } catch {
        return;
      }

      if (data.error) {
        const isAuthErr =
          data.msg_type === 'authorize' ||
          Boolean(data.echo_req?.authorize) ||
          data.error.code === 'InvalidToken' ||
          data.error.code === 'AuthorizationRequired';

        if (isAuthErr) {
          clearAuthTimeout();
          setAuthStatus('error');
          setAuthError(data.error.message || 'Invalid or expired Deriv API token.');
        } else if (data.msg_type === 'buy' || data.echo_req?.buy) {
          const reqId = data.echo_req?.passthrough?.req_id;
          if (reqId && pendingTradesRef.current[reqId]) {
            const cb = pendingTradesRef.current[reqId];
            delete pendingTradesRef.current[reqId];
            cb({ ok: false, error: data.error.message || 'Order rejected by Deriv' });
          }
        }
        return;
      }

      if (data.msg_type === 'tick' && data.tick) {
        lastWsTickAtRef.current = Date.now();
        const { symbol, quote, epoch } = data.tick;
        const time = new Date(epoch * 1000).toLocaleTimeString('en-GB', { hour12: false });

        setTicksByMarket((prev) => {
          const next = { ...prev };
          SYNTHETIC_MARKETS.forEach((m) => {
            if (m.symbol !== symbol) return;
            const price = Number(Number(quote).toFixed(m.decimals));
            const digit = extractLastDigit(price, m.decimals);
            const arr = prev[m.id] || [];

            if (firstPriceRef.current[m.id] === undefined) {
              firstPriceRef.current[m.id] = price;
            }
            const baseRef = firstPriceRef.current[m.id] || price;
            const pct = baseRef ? ((price - baseRef) / baseRef) * 100 : 0;

            setLiveDeltas((dPrev) => ({
              ...dPrev,
              [m.id]: { value: Number(pct.toFixed(2)), up: pct >= 0 }
            }));

            next[m.id] = [...arr.slice(-(maxHistory - 1)), { price, digit, time }];
          });
          return next;
        });
      }

      if (data.msg_type === 'authorize' && data.authorize) {
        clearAuthTimeout();
        const auth = data.authorize;
        const isVirt = Boolean(auth.is_virtual);
        const rawBal = Number(auth.balance ?? 0);
        const acctCurr = auth.currency || 'USD';

        setAuthStatus('authorized');
        setAuthError('');
        setAccount({
          loginid: auth.loginid,
          balance: rawBal,
          currency: acctCurr,
          isVirtual: isVirt,
          email: auth.email || ''
        });
        setAccountMode(isVirt ? 'demo' : 'real');

        if (isVirt) {
          setDemoBalance(rawBal > 0 ? rawBal : DEFAULT_DEMO_USD);
        } else {
          setRealBalance(rawBal);
        }
        setCurrency(acctCurr);
        socket.send(JSON.stringify({ balance: 1, subscribe: 1 }));
      }

      if (data.msg_type === 'balance' && data.balance) {
        const balVal = Number(data.balance.balance ?? 0);
        const currVal = data.balance.currency || currencyRef.current;
        const loginVal = data.balance.loginid || '';
        setAccount((prev) => ({
          ...(prev || {}),
          loginid: loginVal || prev?.loginid || 'ACCOUNT',
          balance: balVal,
          currency: currVal
        }));
        if (loginVal.startsWith('VR')) {
          setDemoBalance(balVal);
        } else if (loginVal) {
          setRealBalance(balVal);
        }
      }

      if (data.msg_type === 'buy' && data.buy) {
        const buyInfo = data.buy;
        const reqId = data.echo_req?.passthrough?.req_id;
        if (buyInfo.contract_id) {
          socket.send(
            JSON.stringify({
              proposal_open_contract: 1,
              contract_id: buyInfo.contract_id,
              subscribe: 1
            })
          );
        }
        if (reqId && pendingTradesRef.current[reqId]) {
          const cb = pendingTradesRef.current[reqId];
          delete pendingTradesRef.current[reqId];
          cb({
            ok: true,
            contractId: buyInfo.contract_id,
            buyPrice: Number(buyInfo.buy_price || 0),
            balanceAfter: Number(buyInfo.balance_after || 0)
          });
        }
      }

      if (data.msg_type === 'proposal_open_contract' && data.proposal_open_contract) {
        const poc = data.proposal_open_contract;
        if (poc.is_sold || poc.is_expired) {
          const profit = Number(poc.profit ?? 0);
          const won = profit >= 0;
          if (settlementCbRef.current) {
            settlementCbRef.current({
              contractId: poc.contract_id,
              symbol: poc.underlying,
              profit,
              won,
              time: new Date().toLocaleTimeString('en-GB', { hour12: false })
            });
          }
        }
      }
    };

    socket.onerror = () => {
      if (pingTimerRef.current) clearInterval(pingTimerRef.current);
      setSocketState('closed');
      setFeedMode('simulated');
      setConnectionIssue(
        'WebSocket handshake to Deriv servers failed. Check network/VPN/firewall rules or try Deriv OAuth login.'
      );
      setAuthStatus((prev) => {
        if (prev === 'authorizing') {
          setAuthError('WebSocket connection error while contacting Deriv servers.');
          return 'error';
        }
        return prev;
      });
    };

    socket.onclose = (ev) => {
      if (pingTimerRef.current) clearInterval(pingTimerRef.current);
      clearAuthTimeout();
      setSocketState('closed');
      setFeedMode((m) => (m === 'live-ws' ? 'simulated' : m));

      if (!manualDisconnectRef.current) {
        const attempt = reconnectAttemptsRef.current + 1;
        reconnectAttemptsRef.current = attempt;
        const delay = Math.min(RECONNECT_MAX_MS, RECONNECT_BASE_MS * Math.pow(1.5, Math.min(attempt, 6)));
        if (ev && ev.code && ev.code !== 1000) {
          setConnectionIssue(`Deriv socket closed (code ${ev.code}). Retrying in ${Math.round(delay / 1000)}s...`);
        }
        reconnectTimerRef.current = setTimeout(() => {
          connectSocket();
        }, delay);
      }
    };
  }, [armAuthTimeout, clearAuthTimeout, maxHistory]);

  useEffect(() => {
    connectSocket();
    return () => {
      manualDisconnectRef.current = true;
      clearTimers();
      if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
        wsRef.current.close(1000, 'Component unmounted');
      }
    };
  }, [clearTimers, connectSocket]);

  const authorizeToken = useCallback(
    (token) => {
      const clean = (token || '').trim();
      if (!clean) {
        setAuthError('Please enter a valid Deriv API token.');
        setAuthStatus('error');
        return;
      }
      setActiveToken(clean);
      localStorage.setItem('kfx_deriv_token', clean);
      setAuthStatus('authorizing');
      setAuthError('');
      armAuthTimeout();

      const sent = sendRaw({ authorize: clean });
      if (!sent) {
        reconnectAttemptsRef.current = 0;
        connectSocket();
      }
    },
    [armAuthTimeout, connectSocket, sendRaw]
  );

  const retryConnection = useCallback(() => {
    reconnectAttemptsRef.current = 0;
    setConnectionIssue('');
    connectSocket();
    const savedToken = (localStorage.getItem('kfx_deriv_token') || activeTokenRef.current || '').trim();
    if (savedToken) {
      authorizeToken(savedToken);
    }
  }, [authorizeToken, connectSocket]);

  const disconnectAccount = useCallback(() => {
    clearAuthTimeout();
    setActiveToken('');
    setAccount(null);
    setAuthStatus('disconnected');
    setAuthError('');
    localStorage.removeItem('kfx_deriv_token');
  }, [clearAuthTimeout]);

  const switchAccountMode = useCallback(
    (nextMode) => {
      setAccountMode(nextMode);
      const matched = oauthAccounts.find((a) =>
        nextMode === 'demo' ? a.loginid.startsWith('VR') : !a.loginid.startsWith('VR')
      );
      if (matched?.token && matched.token !== activeToken) {
        authorizeToken(matched.token);
      }
    },
    [oauthAccounts, activeToken, authorizeToken]
  );

  const toggleCurrency = useCallback(() => {
    setCurrency((prev) => {
      const next = prev === 'KSH' ? 'USD' : 'KSH';
      if (next === 'USD') {
        setDemoBalance((d) => (d > 2500 ? Number((d / FX_KSH_PER_USD).toFixed(2)) : d));
        setRealBalance((r) => (r > 2500 ? Number((r / FX_KSH_PER_USD).toFixed(2)) : r));
      } else {
        setDemoBalance((d) => (d <= 2500 ? Number((d * FX_KSH_PER_USD).toFixed(2)) : d));
        setRealBalance((r) => (r <= 2500 ? Number((r * FX_KSH_PER_USD).toFixed(2)) : r));
      }
      return next;
    });
  }, []);

  const resetDemoCapital = useCallback(() => {
    const targetDemo =
      currencyRef.current === 'USD'
        ? DEFAULT_DEMO_USD
        : Number((DEFAULT_DEMO_USD * FX_KSH_PER_USD).toFixed(2));
    setDemoBalance(targetDemo);
    return {
      ok: true,
      message: `Demo account reset to ${currencyRef.current} ${targetDemo.toFixed(2)}`
    };
  }, []);

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

  const activeBalance = accountMode === 'demo' ? demoBalance : realBalance;

  const executeContract = useCallback(
    ({
      symbol = 'R_100',
      contractType = 'DIGITEVEN',
      amount = 1,
      duration = 1,
      durationUnit = 't',
      barrier = null,
      simulatedWon = true,
      botLabel = 'Engine'
    }) => {
      const stakeVal = Number(Math.max(0.35, amount).toFixed(2));
      const activeCurr = currencyRef.current || 'USD';
      const modeNow = accountModeRef.current;

      const canUseLiveDeriv =
        authStatus === 'authorized' &&
        wsRef.current?.readyState === WebSocket.OPEN &&
        ((modeNow === 'demo' && account?.isVirtual) || (modeNow === 'real' && !account?.isVirtual));

      if (canUseLiveDeriv) {
        const reqId = `kfx_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const parameters = {
          amount: stakeVal,
          basis: 'stake',
          contract_type: contractType,
          currency: account?.currency || activeCurr,
          duration: Number(duration) || 1,
          duration_unit: durationUnit,
          symbol
        };
        if (barrier !== null && barrier !== undefined && barrier !== '') {
          parameters.barrier = String(barrier);
        }

        return new Promise((resolve) => {
          pendingTradesRef.current[reqId] = (res) => {
            if (res.ok) {
              resolve({
                live: true,
                won: true,
                delta: 0,
                summary: `[${modeNow.toUpperCase()} #${res.contractId}] ${botLabel} ${contractType} (${symbol}) -> ${stakeVal} ${parameters.currency}`
              });
            } else {
              resolve({
                live: true,
                won: false,
                delta: 0,
                summary: `[DERIV ERROR] ${botLabel}: ${res.error}`
              });
            }
          };

          sendRaw({
            buy: 1,
            price: stakeVal,
            parameters,
            passthrough: { req_id: reqId }
          });
        });
      }

      const delta = simulatedWon
        ? Number((stakeVal * 0.85).toFixed(2))
        : Number((-stakeVal).toFixed(2));

      if (modeNow === 'demo') {
        setDemoBalance((b) => Number(Math.max(0, b + delta).toFixed(2)));
      } else {
        setRealBalance((b) => Number(Math.max(0, b + delta).toFixed(2)));
      }

      return Promise.resolve({
        live: false,
        won: simulatedWon,
        delta,
        summary: `[${modeNow.toUpperCase()}] ${botLabel} ${contractType} (${symbol}) -> ${
          delta >= 0 ? '+' : ''
        }${delta.toFixed(2)} ${activeCurr}`
      });
    },
    [account, authStatus, sendRaw]
  );

  return {
    appId: DERIV_APP_ID,
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
    balance: activeBalance,
    demoBalance,
    realBalance,
    resetDemoCapital,
    authorizeToken,
    disconnectAccount,
    executeContract
  };
}
