export const DERIV_APP_ID = '1089';
export const DERIV_WS_URL = `wss://ws.derivws.com/websockets/v3?app_id=${DERIV_APP_ID}`;
export const DERIV_OAUTH_URL = `https://oauth.deriv.com/oauth2/authorize?app_id=${DERIV_APP_ID}`;
export const DERIV_PARTNER_SIGNUP_URL = 'https://track.deriv.com/_KMwae3caD3JZl7VyVw174GNd7ZgqdRLk/1/';

export const SYNTHETIC_MARKETS = [
  { id: '1HZ100V', symbol: '1HZ100V', label: 'Volatility 100 (1s) Index', short: 'VOL 100 (1S)', base: 1465.46, decimals: 2, delta: '+0.64%' },
  { id: '1HZ10V', symbol: '1HZ10V', label: 'Volatility 10 (1s) Index', short: 'VOL 10 (1S)', base: 9566.85, decimals: 2, delta: '+0.31%' },
  { id: '1HZ15V', symbol: '1HZ15V', label: 'Volatility 15 (1s) Index', short: 'VOL 15 (1S)', base: 14528.59, decimals: 2, delta: '-0.19%' },
  { id: '1HZ25V', symbol: '1HZ25V', label: 'Volatility 25 (1s) Index', short: 'VOL 25 (1S)', base: 879209.19, decimals: 2, delta: '+0.48%' },
  { id: '1HZ30V', symbol: '1HZ30V', label: 'Volatility 30 (1s) Index', short: 'VOL 30 (1S)', base: 6419.96, decimals: 2, delta: '-0.27%' },
  { id: '1HZ75V', symbol: '1HZ75V', label: 'Volatility 75 (1s) Index', short: 'VOL 75 (1S)', base: 1988.84, decimals: 2, delta: '+0.73%' },
  { id: '1HZ90V', symbol: '1HZ90V', label: 'Volatility 90 (1s) Index', short: 'VOL 90 (1S)', base: 29870.439, decimals: 3, delta: '+0.22%' },
  { id: 'R_10', symbol: 'R_10', label: 'Volatility 10 Index', short: 'VOL 10', base: 4857.858, decimals: 3, delta: '+0.42%' },
  { id: 'R_100', symbol: 'R_100', label: 'Volatility 100 Index', short: 'VOL 100', base: 571.98, decimals: 2, delta: '-1.53%' },
  { id: 'R_25', symbol: 'R_25', label: 'Volatility 25 Index', short: 'VOL 25', base: 2896.364, decimals: 3, delta: '+0.18%' },
  { id: 'R_75', symbol: 'R_75', label: 'Volatility 75 Index', short: 'VOL 75', base: 37623.8915, decimals: 4, delta: '+0.89%' }
];

export const BLOCK_GROUPS = [
  {
    id: 'trade-params',
    title: 'Trade parameters',
    collapsible: true,
    items: ['Market', 'Trade Type', 'Contract Type', 'Duration', 'Stake', 'Virtual Hook']
  },
  {
    id: 'purchase-conds',
    title: 'Purchase conditions',
    collapsible: true,
    items: ['Purchase Rise', 'Purchase Fall', 'Purchase Even', 'Purchase Odd', 'Purchase Over', 'Purchase Under']
  },
  {
    id: 'sell-conds',
    title: 'Sell conditions',
    collapsible: true,
    items: ['Sell is available', 'Sell at market']
  },
  {
    id: 'restart-conds',
    title: 'Restart trading conditions',
    collapsible: true,
    items: ['Trade again', 'Martingale stake', 'Stop on TP/SL']
  },
  {
    id: 'digit-analysis',
    title: 'Digit & Tick analysis',
    collapsible: true,
    items: ['Last Digit', 'Even / Odd streak', 'Over / Under barrier']
  }
];

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'bot-builder', label: 'Bot Builder' },
  { id: 'free-bots', label: 'Free Bots' },
  { id: 'premium-ai-bots', label: 'Premium AI Bots' },
  { id: 'pulse-scanner', label: 'Pulse AI Scanner' },
  { id: 'quick-bot', label: 'Quick Bot' },
  { id: 'confluence-ai', label: 'Confluence AI' },
  { id: 'analysis-tools', label: 'Analysis Tools' },
  { id: 'hedging', label: 'Hedging' },
  { id: 'premium-bots', label: 'Premium Bots' },
  { id: 'auto-trading', label: 'Auto Trading', badge: 'NEW' },
  { id: 'signal-ai', label: 'Signal AI' },
  { id: 'manual-trader', label: 'Manual Trader' },
  { id: 'bulk-trader', label: 'Bulk Trader' },
  { id: 'smart-ai', label: 'Smart AI' },
  { id: 'copy-trader', label: 'Copy Trader' },
  { id: 'chart', label: 'Charts' },
  { id: 'speedbot', label: 'Speedbot' }
];

export const KPI_CARDS = [
  { id: 'free-bots', value: '4', label: 'Free Bots', sub: 'Ready to load', icon: 'free-bots', target: 'free-bots' },
  { id: 'trading-tools', value: '13', label: 'Trading Tools', sub: 'Advanced tools', icon: 'analysis-tools', target: 'analysis-tools' },
  { id: 'volatility-markets', value: '11', label: 'Volatility Markets', sub: 'Live markets', icon: 'globe', target: 'analysis-tools' },
  { id: 'synthetic-24-7', value: '24/7', label: 'Synthetic Markets', sub: 'Always open', icon: 'clock', target: 'bot-builder' }
];

export const TOOLS_AND_FEATURES = [
  { id: 't1', title: 'Free Bots', desc: 'Ready-made strategies you can load in one click.', cta: 'Explore', icon: 'free-bots', category: 'Automation', nav: 'free-bots' },
  { id: 't2', title: 'Bot Builder', desc: 'Build, edit and run your own custom strategy.', cta: 'Open Builder', icon: 'bot-builder', category: 'Automation', nav: 'bot-builder' },
  { id: 't3', title: 'Load a Strategy', desc: 'Open a bot file from your computer or workspace.', cta: 'Load', icon: 'folder', category: 'Automation', nav: 'quick-bot' },
  { id: 't4', title: 'Quick Bot', desc: 'Pick a strategy, set your stake and start.', cta: 'Start Trading', icon: 'quick-bot', category: 'Trading', nav: 'quick-bot' },
  { id: 't5', title: 'Speedbot', desc: 'Fast automated execution on every incoming tick.', cta: 'Launch', icon: 'speedbot', category: 'Automation', nav: 'speedbot' },
  { id: 't6', title: 'Analysis Tools', desc: 'Live 11-market Dcircles & digit probability matrix.', cta: 'Analyze', icon: 'analysis-tools', category: 'Analysis', nav: 'analysis-tools' },
  { id: 't7', title: 'Charts', desc: 'Live price charts for every volatility index.', cta: 'View Charts', icon: 'chart', category: 'Analysis', nav: 'chart' },
  { id: 't8', title: 'Copy Trading', desc: 'Mirror trades across your connected accounts.', cta: 'Configure', icon: 'copy-trader', category: 'Risk Management', nav: 'copy-trader' }
];
