import React, { useMemo, useState } from 'react';
import { KPI_CARDS, SYNTHETIC_MARKETS, TOOLS_AND_FEATURES } from '../data/markets';

const CATEGORIES = ['All Tools', 'Trading', 'Analysis', 'Automation', 'Risk Management'];

export default function DashboardPro({ ticksByMarket, onNavigate, activeBotsCount = 0 }) {
  const [timeframe, setTimeframe] = useState('1M');
  const [category, setCategory] = useState('All Tools');
  const [selectedMarketId, setSelectedMarketId] = useState('R_100');

  const market =
    SYNTHETIC_MARKETS.find((m) => m.id === selectedMarketId) || SYNTHETIC_MARKETS[4];
  const rawSeries = ticksByMarket[market.id] || [];
  const count = timeframe === '1M' ? 26 : timeframe === '5M' ? 42 : timeframe === '15M' ? 60 : 80;
  const points = rawSeries.slice(-count);

  const latestPrice = points[points.length - 1]?.price ?? market.base;
  const firstPrice = points[0]?.price ?? latestPrice;
  const diff = latestPrice - firstPrice;
  const pct = firstPrice ? (diff / firstPrice) * 100 : 0;

  const polyline = useMemo(() => {
    if (!points.length) return '';
    const prices = points.map((p) => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const span = max - min || 1;
    return points
      .map((p, idx) => {
        const x = (idx / Math.max(1, points.length - 1)) * 340;
        const y = 76 - ((p.price - min) / span) * 62;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [points]);

  const filteredTools = useMemo(() => {
    if (category === 'All Tools') return TOOLS_AND_FEATURES;
    return TOOLS_AND_FEATURES.filter((t) => t.category === category);
  }, [category]);

  return (
    <section className="kfx-pro-dash">
      <div className="kfx-pro-container">
        <div className="kfx-pro-hero">
          <div>
            <div className="kfx-workspace-tag">
              KINGSFX WORKSPACE · THIRD-PARTY DERIV BOT SUITE
            </div>
            <h1 className="kfx-pro-title">
              Good evening, <span>trader</span>
            </h1>
            <p className="kfx-hero-sub">
              Trade smarter with AI-powered bots, real-time digit statistics and synthetic index
              analytics. Discipline today for a better tomorrow.
            </p>
            <div className="kfx-hero-actions">
              <button
                type="button"
                className="kfx-btn-primary"
                onClick={() => onNavigate('free-bots')}
              >
                Browse Free Bots →
              </button>
              <button
                type="button"
                className="kfx-btn-ghost"
                onClick={() => onNavigate('premium-ai-bots')}
              >
                👑 Premium AI Bots ({activeBotsCount} live)
              </button>
            </div>
          </div>

          <div className="kfx-pro-chart-box">
            <div className="kfx-overview-top">
              <div className="kfx-live-pill">
                <span className="kfx-live-dot" />
                <span>Market Overview · {market.label}</span>
              </div>
              <div className="kfx-tf-group">
                {['1M', '5M', '15M', '1H'].map((tf) => (
                  <button
                    key={tf}
                    type="button"
                    className={`kfx-tf-btn ${timeframe === tf ? 'is-active' : ''}`}
                    onClick={() => setTimeframe(tf)}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            <div className="kfx-spot-big">
              {Number(latestPrice).toFixed(market.decimals)}{' '}
              <span
                style={{ fontSize: 13, fontWeight: 700 }}
                className={diff >= 0 ? 'kfx-up' : 'kfx-down'}
              >
                {diff >= 0 ? '+' : ''}
                {diff.toFixed(market.decimals)} ({pct >= 0 ? '+' : ''}
                {pct.toFixed(2)}%)
              </span>
            </div>

            <svg width="100%" height="82" viewBox="0 0 340 82" preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke="#FF444F"
                strokeWidth="2.4"
                points={polyline}
              />
            </svg>

            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              {SYNTHETIC_MARKETS.slice(0, 5).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedMarketId(m.id)}
                  className={`kfx-tf-btn ${market.id === m.id ? 'is-active' : ''}`}
                >
                  {m.short}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="kfx-pro-kpis">
          {KPI_CARDS.map((card) => (
            <div
              key={card.id}
              className="kfx-pro-kpi"
              onClick={() => onNavigate(card.target)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{card.icon}</span>
                <span style={{ fontSize: 12, color: '#FCA5A5' }}>↗</span>
              </div>
              <div className="kfx-pro-kpi-num">{card.value}</div>
              <div style={{ fontSize: 13, fontWeight: 800 }}>{card.label}</div>
              <div style={{ fontSize: 11, color: '#D4B5B8', marginTop: 2 }}>{card.sub}</div>
            </div>
          ))}
        </div>

        <div className="kfx-section-head">
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 900 }}>Tools &amp; Features</h2>
            <p style={{ fontSize: 12, color: '#D6B9BC' }}>
              Everything you need to trade smarter
            </p>
          </div>
          <div className="kfx-filter-pills">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`kfx-filter-pill ${category === cat ? 'is-active' : ''}`}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="kfx-tools-grid">
          {filteredTools.map((tool) => (
            <div
              key={tool.id}
              className="kfx-tool-card"
              onClick={() => onNavigate(tool.nav)}
            >
              <div>
                <div style={{ fontSize: 20 }}>{tool.icon}</div>
                <div className="kfx-tool-title">{tool.title}</div>
                <div className="kfx-tool-desc">{tool.desc}</div>
              </div>
              <div className="kfx-tool-cta">{tool.cta}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
