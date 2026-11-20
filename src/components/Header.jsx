import React, { useState } from 'react';
import {
  DERIV_APP_ID,
  DERIV_OAUTH_URL,
  NAV_ITEMS,
  SYNTHETIC_MARKETS
} from '../data/markets';
import { CurrencyFlagIcon, NavIcon } from './Icons';

export default function Header({
  activeNav,
  onSelectNav,
  balance = 0,
  demoBalance = 10000,
  realBalance = 0,
  accountMode = 'demo',
  onSwitchAccountMode = () => {},
  onResetDemoCapital = () => {},
  currency = 'USD',
  onToggleCurrency = () => {},
  onOpenReports = () => {},
  liveDeltas = {},
  ticksByMarket = {},
  socketState = 'connecting',
  connectionIssue = '',
  onRetryConnection = () => {},
  authStatus = 'disconnected',
  authError = '',
  account = null,
  oauthAccounts = [],
  onAuthorizeToken = () => {},
  onDisconnect = () => {}
}) {
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [notice, setNotice] = useState('');

  const handleTokenSubmit = (e) => {
    e.preventDefault();
    setNotice('');
    onAuthorizeToken(tokenInput);
    setTokenInput('');
  };

  return (
    <>
      <header>
        <div className="kfx-topbar">
          <div className="kfx-topbar-left">
            <div className="kfx-brand" onClick={() => onSelectNav('dashboard')}>
              <div className="kfx-brand-name">
                Kings<span>FX</span>
              </div>
              <div className="kfx-brand-sub">powered by deriv · app {DERIV_APP_ID.slice(0, 8)}...</div>
            </div>

            <button type="button" className="kfx-reports-btn" onClick={onOpenReports}>
              <NavIcon name="reports" size={14} />
              <span>Reports</span>
            </button>
          </div>

          <div className="kfx-topbar-right" style={{ gap: 8 }}>
            <div
              style={{
                display: 'inline-flex',
                background: '#F3F4F6',
                border: '1px solid #D1D5DB',
                borderRadius: 6,
                padding: 2
              }}
            >
              <button
                type="button"
                onClick={() => onSwitchAccountMode('demo')}
                style={{
                  border: 'none',
                  borderRadius: 4,
                  padding: '4px 9px',
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: accountMode === 'demo' ? '#0F172A' : 'transparent',
                  color: accountMode === 'demo' ? '#FFFFFF' : '#374151'
                }}
              >
                Demo
              </button>
              <button
                type="button"
                onClick={() => onSwitchAccountMode('real')}
                style={{
                  border: 'none',
                  borderRadius: 4,
                  padding: '4px 9px',
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: accountMode === 'real' ? '#9B0D18' : 'transparent',
                  color: accountMode === 'real' ? '#FFFFFF' : '#374151'
                }}
              >
                Real
              </button>
            </div>

            <button
              type="button"
              className="kfx-wallet-btn"
              onClick={() => {
                setNotice('');
                setAccountModalOpen(true);
              }}
              title="Manage Deriv Account & API Token"
            >
              <CurrencyFlagIcon currency={currency} />
              <span>
                {currency}{' '}
                {Number(balance).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: '2px 6px',
                  borderRadius: 4,
                  background:
                    authStatus === 'authorized'
                      ? '#ECFDF5'
                      : accountMode === 'real'
                      ? '#FEF2F2'
                      : '#EFF6FF',
                  color:
                    authStatus === 'authorized'
                      ? '#047857'
                      : accountMode === 'real'
                      ? '#9B0D18'
                      : '#1D4ED8'
                }}
              >
                {authStatus === 'authorized'
                  ? account?.loginid || accountMode.toUpperCase()
                  : authStatus === 'authorizing'
                  ? 'AUTH...'
                  : accountMode.toUpperCase()}
              </span>
            </button>

            <button
              type="button"
              className="kfx-reports-btn"
              onClick={onToggleCurrency}
              title="Switch between KSH (Kenya Flag) and USD (USA Flag)"
            >
              <CurrencyFlagIcon currency={currency === 'KSH' ? 'USD' : 'KSH'} width={15} height={10} />
              <span>{currency === 'KSH' ? 'USD' : 'KSH'}</span>
            </button>
          </div>
        </div>

        <nav className="kfx-navstrip" aria-label="Primary Workspace Navigation">
          <button
            type="button"
            className="kfx-nav-toggle"
            onClick={() => onSelectNav('dashboard')}
            title="Workspace Home"
          >
            <NavIcon name="dashboard" size={14} />
          </button>

          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`kfx-nav-btn ${activeNav === item.id ? 'is-active' : ''}`}
              onClick={() => onSelectNav(item.id)}
            >
              <NavIcon name={item.id} size={14} />
              <span>{item.label}</span>
              {item.badge && <span className="kfx-badge-new">{item.badge}</span>}
            </button>
          ))}
        </nav>

        <div className="kfx-ticker-bar">
          <div className="kfx-ticker-track">
            {[...SYNTHETIC_MARKETS, ...SYNTHETIC_MARKETS].map((m, idx) => {
              const ticks = ticksByMarket[m.id] || [];
              const latest = ticks[ticks.length - 1]?.price ?? m.base;
              const delta = liveDeltas[m.id] || { value: parseFloat(m.delta) || 0, up: true };
              return (
                <div key={`${m.id}-${idx}`} className="kfx-ticker-item">
                  <span className="kfx-ticker-sym">{m.short}</span>
                  <span className="kfx-ticker-price">{Number(latest).toFixed(m.decimals)}</span>
                  <span className={delta.up ? 'kfx-up' : 'kfx-down'}>
                    {delta.up ? '+' : '-'}
                    {Math.abs(delta.value).toFixed(2)}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </header>

      {accountModalOpen && (
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
          onClick={() => setAccountModalOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 500,
              background: '#FFFFFF',
              color: '#111827',
              borderRadius: 12,
              padding: 20,
              boxShadow: '0 20px 40px rgba(0,0,0,0.28)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#9B0D18' }}>
                  DERIV WEBSOCKET V3 ({socketState.toUpperCase()}) · APP ID: {DERIV_APP_ID}
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 900, marginTop: 2 }}>
                  Demo &amp; Real Account Hub
                </h3>
              </div>
              <button
                type="button"
                className="kfx-mini-btn is-ready"
                onClick={() => setAccountModalOpen(false)}
              >
                Close
              </button>
            </div>

            {connectionIssue && (
              <div
                style={{
                  marginTop: 10,
                  padding: '8px 10px',
                  borderRadius: 6,
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  color: '#991B1B',
                  fontSize: 11,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <span>{connectionIssue}</span>
                <button type="button" className="kfx-mini-btn is-ready" onClick={onRetryConnection}>
                  Retry Socket
                </button>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 14 }}>
              <div style={{ padding: 10, borderRadius: 8, background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#1D4ED8' }}>DEMO ACCOUNT</div>
                <div style={{ fontSize: 15, fontWeight: 900, marginTop: 2 }}>
                  {currency}{' '}
                  {Number(demoBalance).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </div>
              </div>
              <div style={{ padding: 10, borderRadius: 8, background: '#FEF2F2', border: '1px solid #FECACA' }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#9B0D18' }}>REAL ACCOUNT</div>
                <div style={{ fontSize: 15, fontWeight: 900, marginTop: 2 }}>
                  {currency}{' '}
                  {Number(realBalance).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 10,
                padding: '8px 10px',
                borderRadius: 6,
                background: '#F9FAFB',
                border: '1px solid #E5E7EB',
                fontSize: 11,
                color: '#4B5563',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 8
              }}
            >
              <span>Demo and Real balances are strictly segregated.</span>
              <button
                type="button"
                className="kfx-mini-btn is-ready"
                onClick={() => {
                  const res = onResetDemoCapital();
                  if (res?.message) setNotice(res.message);
                }}
              >
                Reset Demo ($10,000)
              </button>
            </div>

            {authStatus === 'authorized' && account ? (
              <div
                style={{
                  marginTop: 12,
                  padding: 12,
                  borderRadius: 8,
                  background: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  fontSize: 12
                }}
              >
                <div style={{ fontWeight: 800, color: '#047857' }}>
                  Authorized: {account.loginid} ({account.isVirtual ? 'Demo' : 'Real'})
                </div>
                <div style={{ fontSize: 11, color: '#065F46', marginTop: 2 }}>
                  Live Deriv Balance: {account.currency} {Number(account.balance).toFixed(2)}
                </div>
                <button
                  type="button"
                  className="kfx-reset-crimson"
                  style={{ marginTop: 8 }}
                  onClick={onDisconnect}
                >
                  Disconnect Deriv Token
                </button>
              </div>
            ) : authStatus === 'authorizing' ? (
              <div
                style={{
                  marginTop: 12,
                  padding: 10,
                  borderRadius: 8,
                  background: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#1E40AF'
                }}
              >
                Authorizing token with Deriv WebSocket...
              </div>
            ) : null}

            {oauthAccounts.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 800, marginBottom: 6 }}>
                  OAuth Accounts:
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {oauthAccounts.map((acc) => (
                    <button
                      key={acc.loginid}
                      type="button"
                      className="kfx-mini-btn is-ready"
                      onClick={() => onAuthorizeToken(acc.token)}
                    >
                      {acc.loginid} ({acc.currency})
                    </button>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleTokenSubmit} style={{ marginTop: 14 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, marginBottom: 6 }}>
                Deriv API Token (Read + Trade + Account scopes)
              </label>
              <input
                type="password"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Paste Deriv API token..."
                style={{
                  width: '100%',
                  padding: '9px 10px',
                  borderRadius: 6,
                  border: '1px solid #D1D5DB',
                  fontSize: 12
                }}
              />

              {authError && (
                <div style={{ marginTop: 6, fontSize: 11, fontWeight: 700, color: '#DC2626' }}>
                  {authError}
                </div>
              )}

              {notice && (
                <div style={{ marginTop: 6, fontSize: 11, fontWeight: 700, color: '#047857' }}>
                  {notice}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <button
                  type="submit"
                  className="kfx-btn-primary"
                  disabled={authStatus === 'authorizing'}
                >
                  {authStatus === 'authorizing' ? 'Authorizing...' : 'Connect Token'}
                </button>
                <a
                  href={DERIV_OAUTH_URL}
                  className="kfx-mini-btn is-ready"
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                >
                  Deriv OAuth Login
                </a>
                <a
                  href="https://deriv.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="kfx-mini-btn is-ready"
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                >
                  Deriv Official Site
                </a>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
