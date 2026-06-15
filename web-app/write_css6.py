import os
d = r'C:\Users\aslan\OneDrive\Desktop\civitas-big-project-aslan1.o\web-app\src\pages'

# ── AnalyticsPage.css ─────────────────────────────────────────────────────────
open(os.path.join(d, 'AnalyticsPage.css'), 'w', encoding='utf-8').write("""/* AnalyticsPage */
.analytics-page { padding: var(--sp-8); animation: fadeIn 0.35s ease both; }
.analytics-container { max-width: 1000px; margin: 0 auto; }
.not-connected { text-align: center; padding: var(--sp-16); color: var(--text-2); }
.not-connected h2 { font-size: 1.3rem; color: var(--text-1); margin-bottom: 8px; }

/* Header */
.analytics-header { margin-bottom: var(--sp-6); }
.analytics-header h1 { font-size: 1.9rem; font-weight: 800; color: var(--text-1); letter-spacing: -0.03em; margin-bottom: 4px; }
.analytics-header .subtitle { color: var(--text-2); font-size: .9rem; margin-bottom: var(--sp-4); }

/* Timeframe selector */
.timeframe-selector { display: flex; gap: 4px; background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--r-full); padding: 4px; display: inline-flex; }
.timeframe-selector button {
  padding: 6px 16px; border: none; border-radius: var(--r-full);
  background: transparent; color: var(--text-2); font-size: .8rem;
  font-weight: 600; cursor: pointer; transition: all var(--t-fast);
}
.timeframe-selector button.active, .timeframe-selector button:hover { background: var(--grad-primary); color: #fff; }

/* Loading */
.loading-analytics { text-align: center; padding: var(--sp-12); color: var(--text-3); }
.spinner {
  width: 36px; height: 36px; border: 3px solid var(--border);
  border-top-color: var(--violet); border-radius: 50%;
  animation: spin .8s linear infinite; margin: 0 auto var(--sp-3);
}

/* Tabs */
.analytics-tabs { display: flex; gap: 4px; border-bottom: 1px solid var(--border); margin-bottom: var(--sp-6); }
.analytics-tabs .tab {
  padding: 10px 20px; background: none; border: none;
  border-bottom: 2px solid transparent; color: var(--text-2);
  font-size: .875rem; font-weight: 500; cursor: pointer;
  transition: all var(--t-base); margin-bottom: -1px;
}
.analytics-tabs .tab:hover { color: var(--text-1); }
.analytics-tabs .tab.active { color: var(--violet-light); border-bottom-color: var(--violet); font-weight: 600; }

/* Tab content */
.tab-content { animation: fadeIn .25s ease; }

/* Metrics grid */
.metrics-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px,1fr)); gap: 14px; margin-bottom: var(--sp-6); }
.metric-card {
  background: var(--surface-1); border: 1px solid var(--border);
  border-radius: var(--r-2xl); padding: 20px; text-align: center;
  transition: all var(--t-base);
}
.metric-card:hover { border-color: var(--border-accent); transform: translateY(-2px); box-shadow: var(--shadow-md); }
.metric-icon { font-size: 1.6rem; margin-bottom: 8px; }
.metric-value { font-size: 1.5rem; font-weight: 800; color: var(--text-1); margin-bottom: 4px; }
.metric-label { font-size: .72rem; color: var(--text-3); text-transform: uppercase; letter-spacing: .06em; margin-bottom: 6px; }
.metric-growth { font-size: .78rem; font-weight: 600; }
.metric-growth.positive { color: var(--green); }
.metric-growth.negative { color: var(--red); }

/* Stats grid */
.stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px,1fr)); gap: 14px; }
.stat-card {
  background: var(--surface-1); border: 1px solid var(--border);
  border-radius: var(--r-2xl); padding: 20px;
}
.stat-card h3 { font-size: .875rem; font-weight: 700; color: var(--text-2); margin-bottom: var(--sp-4); text-transform: uppercase; letter-spacing: .05em; }
.stat-item { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid var(--border); font-size: .85rem; }
.stat-item:last-child { border-bottom: none; }
.stat-item span { color: var(--text-2); }
.stat-item strong { color: var(--text-1); }
.stat-icon { font-size: 1.5rem; margin-bottom: 8px; }
.stat-value { font-size: 1.4rem; font-weight: 800; color: var(--violet-light); margin-bottom: 4px; }
.stat-label { font-size: .72rem; color: var(--text-3); text-transform: uppercase; letter-spacing: .06em; }
.stats-grid-small { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px,1fr)); gap: 12px; margin-bottom: var(--sp-6); }
.no-data { text-align: center; color: var(--text-3); padding: var(--sp-6); font-size: .875rem; }

/* Leaderboards */
.leaderboards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px,1fr)); gap: 16px; }
.leaderboard-card {
  background: var(--surface-1); border: 1px solid var(--border);
  border-radius: var(--r-2xl); padding: 20px;
}
.leaderboard-card h3 { font-size: .9rem; font-weight: 700; color: var(--text-1); margin-bottom: var(--sp-4); }
.leaderboard-list { display: flex; flex-direction: column; gap: 2px; }
.leaderboard-item {
  display: flex; align-items: center; gap: 12px;
  padding: 10px; border-radius: var(--r-lg); transition: background var(--t-fast);
}
.leaderboard-item:hover { background: var(--surface-2); }
.rank { font-size: .8rem; font-weight: 800; color: var(--violet-light); min-width: 28px; }
.user-info { flex: 1; }
.user-name { font-size: .875rem; font-weight: 600; color: var(--text-1); }
.user-stat { font-size: .75rem; color: var(--text-3); margin-top: 2px; }

/* Categories */
.categories-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px,1fr)); gap: 16px; }
.category-card {
  background: var(--surface-1); border: 1px solid var(--border);
  border-radius: var(--r-2xl); padding: 20px;
}
.category-card h3 { font-size: .9rem; font-weight: 700; color: var(--text-1); margin-bottom: var(--sp-4); }
.category-list { display: flex; flex-direction: column; gap: 2px; }
.category-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px; border-radius: var(--r-md); transition: background var(--t-fast);
}
.category-item:hover { background: var(--surface-2); }
.category-name { font-size: .875rem; color: var(--text-1); }
.category-stats { display: flex; gap: 12px; font-size: .78rem; color: var(--text-3); }
.pass-rate { color: var(--green); }

/* Social */
.social-stats-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px,1fr)); gap: 14px; margin-bottom: var(--sp-6); }
.social-stat-card {
  background: var(--surface-1); border: 1px solid var(--border);
  border-radius: var(--r-2xl); padding: 20px; text-align: center;
}
.engagement-metrics {
  background: var(--surface-1); border: 1px solid var(--border);
  border-radius: var(--r-2xl); padding: 20px;
}
.engagement-metrics h3 { font-size: .9rem; font-weight: 700; color: var(--text-1); margin-bottom: var(--sp-4); }
.metric-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 0; border-bottom: 1px solid var(--border); font-size: .875rem;
}
.metric-row:last-child { border-bottom: none; }
.metric-row span { color: var(--text-2); }
.metric-row strong { color: var(--text-1); }

@media (max-width: 768px) {
  .analytics-page { padding: var(--sp-4); }
  .metrics-grid { grid-template-columns: repeat(2,1fr); }
}
""")

print('AnalyticsPage.css done')
