import React, { useState } from 'react';
import { API_URL } from '../App';
import {
  FaArrowRight,
  FaEye,
  FaEyeSlash,
  FaLeaf,
  FaLock,
  FaTriangleExclamation,
  FaEnvelope,
} from 'react-icons/fa6';
import './Auth.css';
import './Dashboard.css';

export default function LoginPage({ onLoginSuccess, onGoToRegister }) {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const res  = await fetch(`${API_URL}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) onLoginSuccess(data.user);
      else setError(data.error || 'Login failed. Please try again.');
    } catch { setError('Network error. Check your connection.'); }
    finally  { setLoading(false); }
  };

  return (
    <div className="dash-root auth-login-root">
      <header className="dash-header">
        <div className="dash-header-inner">
          <div className="dash-header-left">
            <div className="dash-label-pill">Smart Pantry</div>
            <h1 className="dash-title">
              <span className="auth-login-brand">
                <FaLeaf className="auth-login-brand-icon" aria-hidden />
                FreshTrack
              </span>
            </h1>
            <p className="dash-subtitle">Sign in to track expiry dates and get daily alerts.</p>
          </div>
          <div className="dash-header-right">
            <button className="dash-logout-btn" onClick={onGoToRegister}>Create account</button>
          </div>
        </div>
      </header>

      <div className="dash-body">
        <div className="auth-login-center">
          <div className="auth-login-card">
            <div className="auth-form-header">
              <h2>Welcome back</h2>
              <p>Sign in to your dashboard</p>
            </div>

            {error && (
              <div className="auth-alert auth-alert-error">
                <span className="alert-icon" aria-hidden><FaTriangleExclamation /></span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="field-group">
                <label htmlFor="l-email">Email address</label>
                <div className="input-wrap">
                  <span className="input-icon" aria-hidden><FaEnvelope /></span>
                  <input
                    id="l-email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="field-group">
                <label htmlFor="l-pass">Password</label>
                <div className="input-wrap">
                  <span className="input-icon" aria-hidden><FaLock /></span>
                  <input
                    id="l-pass"
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Your password"
                    required
                  />
                  <button
                    type="button"
                    className="toggle-pass"
                    onClick={() => setShowPass(p => !p)}
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPass ? <FaEyeSlash aria-hidden /> : <FaEye aria-hidden />}
                  </button>
                </div>
              </div>

              <button type="submit" className="auth-submit-btn" disabled={loading}>
                {loading ? (
                  <span className="btn-spinner" />
                ) : (
                  <span className="auth-btn-label">
                    Sign In
                    <FaArrowRight className="auth-btn-icon" aria-hidden />
                  </span>
                )}
              </button>
            </form>

            <p className="auth-switch">Don't have an account? <button className="auth-link" onClick={onGoToRegister}>Create one free</button></p>
          </div>
        </div>
      </div>
    </div>
  );
}