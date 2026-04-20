import React, { useState, useMemo } from 'react';
import './Items.css';

const CATEGORY_EMOJI = {
  Dairy: '🥛',
  Meat: '🥩',
  Vegetables: '🥦',
  Fruits: '🍎',
  Beverages: '🧃',
  Bakery: '🍞',
  Frozen: '❄️',
  General: '📦',
};

function normalizeName(name) {
  return (name || '').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function getDynamicEmoji(name, category) {
  const n = normalizeName(name);
  if (!n) return CATEGORY_EMOJI[category] || '📦';

  // Prefer specific food matches first.
  const rules = [
    { re: /\bstrawberry\b/, emoji: '🍓' },
    { re: /\bblueberry\b|\bblue berries\b/, emoji: '🫐' },
    { re: /\bgrape\b|\bgrapes\b/, emoji: '🍇' },
    { re: /\bbanana\b|\bbananas\b/, emoji: '🍌' },
    { re: /\bapple\b|\bapples\b/, emoji: '🍎' },
    { re: /\borange\b|\boranges\b/, emoji: '🍊' },
    { re: /\blemon\b|\blemons\b|\blime\b|\blimes\b/, emoji: '🍋' },
    { re: /\bmango\b|\bmangoes\b/, emoji: '🥭' },
    { re: /\bwatermelon\b/, emoji: '🍉' },
    { re: /\bpeach\b|\bpeaches\b/, emoji: '🍑' },
    { re: /\bpear\b|\bpears\b/, emoji: '🍐' },

    { re: /\btomato\b|\btomatoes\b/, emoji: '🍅' },
    { re: /\bcarrot\b|\bcarrots\b/, emoji: '🥕' },
    { re: /\bpotato\b|\bpotatoes\b/, emoji: '🥔' },
    { re: /\bonion\b|\bonions\b/, emoji: '🧅' },
    { re: /\bgarlic\b/, emoji: '🧄' },
    { re: /\bspinach\b|\blettuce\b|\bcabbage\b|\bkale\b/, emoji: '🥬' },
    { re: /\bbroccoli\b/, emoji: '🥦' },
    { re: /\bcucumber\b|\bcucumbers\b/, emoji: '🥒' },
    { re: /\bpepper\b|\bpeppers\b|\bcapsicum\b/, emoji: '🫑' },

    { re: /\bmilk\b/, emoji: '🥛' },
    { re: /\byogurt\b|\bcurd\b|\bdahi\b/, emoji: '🥣' },
    { re: /\bcheese\b/, emoji: '🧀' },
    { re: /\bbutter\b/, emoji: '🧈' },
    { re: /\begg\b|\beggs\b/, emoji: '🥚' },

    { re: /\bchicken\b/, emoji: '🍗' },
    { re: /\bfish\b|\bsalmon\b|\btuna\b/, emoji: '🐟' },
    { re: /\bbeef\b|\bmutton\b|\blamb\b|\bpork\b|\bmeat\b/, emoji: '🥩' },

    { re: /\bbread\b|\btoast\b|\bbun\b|\bbuns\b|\broll\b|\brolls\b/, emoji: '🍞' },
    { re: /\brice\b/, emoji: '🍚' },
    { re: /\bpasta\b|\bnoodle\b|\bnoodles\b/, emoji: '🍝' },
    { re: /\bflour\b|\batta\b/, emoji: '🌾' },

    { re: /\bcoffee\b/, emoji: '☕' },
    { re: /\btea\b/, emoji: '🍵' },
    { re: /\bwater\b/, emoji: '💧' },
    { re: /\bjuice\b/, emoji: '🧃' },

    { re: /\bice cream\b|\bicecream\b/, emoji: '🍨' },
  ];

  for (const r of rules) {
    if (r.re.test(n)) return r.emoji;
  }

  return CATEGORY_EMOJI[category] || '📦';
}

function parseLocalDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}
function getTodayLocal() {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate());
}
function recalcDays(expiryDateStr) {
  const diff = parseLocalDate(expiryDateStr).getTime() - getTodayLocal().getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

const getDaysLabel = (d) => {
  if (d < 0)   return `Expired ${Math.abs(d)} day${Math.abs(d)!==1?'s':''} ago`;
  if (d === 0)  return 'Expires today!';
  if (d === 1)  return 'Expires tomorrow';
  return `Expires in ${d} days`;
};

const SORT_OPTIONS = [
  { value: 'soonest',   label: 'Soonest expiry' },
  { value: 'latest',    label: 'Latest expiry'   },
  { value: 'name-az',   label: 'Name A → Z'      },
  { value: 'name-za',   label: 'Name Z → A'      },
];

export default function ItemList({ items, onRefresh }) {
  const [activeTab, setActiveTab] = useState('all');
  const [search,    setSearch]    = useState('');
  const [sortBy,    setSortBy]    = useState('soonest');

  // Recalculate days on the frontend for timezone accuracy
  const enriched = useMemo(() =>
    items.map(item => ({ ...item, daysRemaining: recalcDays(item.expiryDate) }))
  , [items]);

  const counts = {
    all:     enriched.length,
    fresh:   enriched.filter(i => i.daysRemaining > 3).length,
    soon:    enriched.filter(i => i.daysRemaining >= 0 && i.daysRemaining <= 3).length,
    expired: enriched.filter(i => i.daysRemaining < 0).length,
  };

  const filtered = useMemo(() => {
    let list = enriched;

    // Tab filter
    if (activeTab === 'fresh')   list = list.filter(i => i.daysRemaining > 3);
    if (activeTab === 'soon')    list = list.filter(i => i.daysRemaining >= 0 && i.daysRemaining <= 3);
    if (activeTab === 'expired') list = list.filter(i => i.daysRemaining < 0);

    // Search filter
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(i =>
        i.name.toLowerCase().includes(q) ||
        (i.category || '').toLowerCase().includes(q)
      );
    }

    // Sort
    list = [...list].sort((a, b) => {
      if (sortBy === 'soonest')  return a.daysRemaining - b.daysRemaining;
      if (sortBy === 'latest')   return b.daysRemaining - a.daysRemaining;
      if (sortBy === 'name-az')  return a.name.localeCompare(b.name);
      if (sortBy === 'name-za')  return b.name.localeCompare(a.name);
      return 0;
    });

    return list;
  }, [enriched, activeTab, search, sortBy]);

  // Derive status from recalculated days (don't trust backend status after recalc)
  const getStatus = (days) => {
    if (days < 0)  return 'expired';
    if (days <= 3) return 'expiring-soon';
    return 'fresh';
  };

  const getProgressPct = (d) => Math.min(100, Math.max(0, (d / 30) * 100));

  const TABS = [
    { key:'all',     label:'All',      count: counts.all     },
    { key:'fresh',   label:'Fresh',    count: counts.fresh   },
    { key:'soon',    label:'Expiring', count: counts.soon    },
    { key:'expired', label:'Expired',  count: counts.expired },
  ];

  return (
    <div className="inv-panel">

      {/* ── Panel header ── */}
      <div className="inv-header">
        <div>
          <h2 className="inv-title">Inventory</h2>
          <p  className="inv-sub">Prioritize items that are closest to expiry.</p>
        </div>
        <button className="inv-refresh-btn" onClick={onRefresh}>
          <span className="refresh-icon">↻</span> Refresh
        </button>
      </div>

      {/* ── Toolbar: pills + search + sort ── */}
      <div className="inv-toolbar">

        {/* Filter pills */}
        <div className="filter-pills">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`filter-pill ${activeTab === tab.key ? 'pill-active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
              <span className={`pill-count pill-count-${tab.key} ${activeTab===tab.key ? 'pill-count-active':''}`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search + Sort */}
        <div className="inv-controls">
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search by name or category..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch('')}>✕</button>
            )}
          </div>

          <div className="sort-wrap">
            <select
              className="sort-select"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <span className="sort-chevron">▾</span>
          </div>
        </div>
      </div>

      {/* ── Item grid ── */}
      {filtered.length === 0 ? (
        <div className="inv-empty">
          <span className="inv-empty-icon">
            {search ? '🔍' : activeTab==='expired' ? '🎉' : '🛒'}
          </span>
          <h3>{search ? `No results for "${search}"` : activeTab==='expired' ? 'No expired items!' : 'Nothing here yet'}</h3>
          <p>
            {search
              ? 'Try a different search term.'
              : activeTab==='all'
              ? 'Add your first food item using the form.'
              : activeTab==='expired'
              ? 'Great job keeping your pantry fresh!'
              : 'All your items look good here.'}
          </p>
        </div>
      ) : (
        <div className="item-grid">
          {filtered.map(item => {
            const days   = item.daysRemaining;
            const status = getStatus(days);
            const pct    = getProgressPct(days);
            const qty    = item.quantity != null
              ? (item.unit ? `${item.quantity} ${item.unit}` : `${item.quantity}`)
              : null;

            const icon = getDynamicEmoji(item.name, item.category);

            return (
              <div key={item.itemId} className={`item-card ic-${status}`}>
                <div className="ic-top">
                  <div className="ic-icon-wrap">
                    <span className="ic-emoji" aria-hidden>{icon}</span>
                  </div>
                  <div className="ic-body">
                    <div className="ic-name-row">
                      <h3 className="ic-name">{item.name}</h3>
                      <span className={`ic-pill ic-pill-${status}`}>
                        {status === 'fresh'         ? 'Fresh'
                         : status === 'expiring-soon' ? 'Expiring soon'
                         : 'Expired'}
                      </span>
                    </div>
                    <div className="ic-meta">
                      <span className="ic-category">{item.category}</span>
                      {qty && <span className="ic-qty">{qty}</span>}
                    </div>
                    <div className="ic-date-row">
                      <span className="ic-date">📅 {item.expiryDate}</span>
                    </div>
                    <div className="ic-days-row">
                      <span className={`ic-days ic-days-${status}`}>{getDaysLabel(days)}</span>
                    </div>
                    {/* Progress bar */}
                    <div className="ic-bar-track">
                      <div
                        className={`ic-bar-fill ic-bar-${status}`}
                        style={{ width: status === 'expired' ? '100%' : `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}