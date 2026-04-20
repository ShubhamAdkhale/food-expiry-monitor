import React, { useState, useEffect, useCallback } from 'react';
import { API_URL } from '../App';
import {
  FaCircleCheck,
  FaCircleXmark,
  FaEnvelopeOpenText,
  FaListUl,
  FaTriangleExclamation,
} from 'react-icons/fa6';
import AddItemForm from './AddItemForm';
import ItemList    from './ItemList';
import './Dashboard.css';

export default function Dashboard({ user, onLogout }) {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  const fetchItems = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_URL}/items?userEmail=${encodeURIComponent(user.email)}`);
      if (!res.ok) throw new Error();
      setItems(await res.json());
    } catch { setError('Could not load your items. Please try again.'); }
    finally  { setLoading(false); }
  }, [user.email]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const counts = {
    total:  items.length,
    fresh:  items.filter(i => i.status === 'fresh').length,
    soon:   items.filter(i => i.status === 'expiring-soon').length,
    expired:items.filter(i => i.status === 'expired').length,
  };

  const initials = user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0,2);

  return (
    <div className="dash-root">

      {/* ── Top header bar ── */}
      <header className="dash-header">
        <div className="dash-header-inner">
          <div className="dash-header-left">
            <div className="dash-label-pill">Smart Pantry Dashboard</div>
            <h1 className="dash-title">Food Expiry Monitor</h1>
            <p className="dash-subtitle">Track every item, spot risks early, and reduce food waste with confidence.</p>
          </div>
          <div className="dash-header-right">
            {!user.snsConfirmed && (
              <div className="sns-chip"><FaEnvelopeOpenText className="sns-chip-icon" aria-hidden /> Confirm email for alerts</div>
            )}
            <div className="user-pill">
              <div className="user-pill-avatar">{initials}</div>
              <span className="user-pill-name">{user.name}</span>
            </div>
            <button className="dash-logout-btn" onClick={onLogout}>Sign out</button>
          </div>
        </div>
      </header>

      <div className="dash-body">

        {/* ── Stat cards ── */}
        <div className="stat-row">
          {[
            { label: 'Total Items',   value: counts.total,   Icon: FaListUl,             color: 'stat-total'   },
            { label: 'Fresh',         value: counts.fresh,   Icon: FaCircleCheck,        color: 'stat-fresh'   },
            { label: 'Expiring Soon', value: counts.soon,    Icon: FaTriangleExclamation,color: 'stat-soon'    },
            { label: 'Expired',       value: counts.expired, Icon: FaCircleXmark,        color: 'stat-expired' },
          ].map(s => (
            <div key={s.label} className={`stat-card ${s.color}`}>
              <div className="stat-icon-wrap"><s.Icon className="stat-icon" aria-hidden /></div>
              <div className="stat-val">{s.value}</div>
              <div className="stat-lbl">{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── Two-column content ── */}
        <div className="dash-cols">
          <div className="dash-col-form">
            <AddItemForm apiUrl={API_URL} userEmail={user.email} onItemAdded={fetchItems} />
          </div>
          <div className="dash-col-list">
            {loading && (
              <div className="state-card">
                <div className="loading-dots"><span/><span/><span/></div>
                <p>Loading your pantry…</p>
              </div>
            )}
            {!loading && error && (
              <div className="state-card">
                <FaTriangleExclamation className="state-icon" aria-hidden />
                <p style={{color:'var(--red)'}}>{error}</p>
                <button className="retry-btn" onClick={fetchItems}>Try again</button>
              </div>
            )}
            {!loading && !error && (
              <ItemList items={items} onRefresh={fetchItems} />
            )}
          </div>
        </div>

      </div>
    </div>
  );
}