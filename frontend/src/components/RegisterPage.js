import React, { useState } from 'react';
import { API_URL } from '../App';
import {
  FaArrowRight,
  FaBoxOpen,
  FaChartLine,
  FaCircleCheck,
  FaCircleXmark,
  FaEnvelope,
  FaEye,
  FaEyeSlash,
  FaLeaf,
  FaLock,
  FaTriangleExclamation,
  FaUser,
} from 'react-icons/fa6';
import './Auth.css';

export default function RegisterPage({ onRegisterSuccess, onGoToLogin }) {
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [success,  setSuccess]  = useState('');
  const [showPass, setShowPass] = useState(false);

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : 3;

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSuccess('');
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 6)  { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(`Account created! Check ${email} for an AWS confirmation email — click "Confirm subscription" to enable alerts. Redirecting…`);
        setTimeout(onRegisterSuccess, 4500);
      } else setError(data.error || 'Registration failed.');
    } catch { setError('Network error. Please try again.'); }
    finally  { setLoading(false); }
  };

  return (
    <div className="auth-root">
      <div className="auth-left">
        <div className="auth-brand">
          <span className="auth-logo-mark" aria-hidden><FaLeaf /></span>
          <span className="auth-brand-name">FreshTrack</span>
        </div>
        <div className="auth-hero-text">
          <h1 className="auth-hero-heading">Your smart<br />kitchen<br />companion.</h1>
          <p className="auth-hero-sub">Never throw out forgotten food again. FreshTrack watches your pantry so you don't have to.</p>
        </div>
        <div className="auth-feature-list">
          {[
            { Icon: FaBoxOpen,  text: 'Track unlimited items' },
            { Icon: FaEnvelope, text: 'Daily email alerts' },
            { Icon: FaChartLine,text: 'Expiry dashboard' },
            { Icon: FaLock,     text: 'Private per-user data' },
          ].map(({ Icon, text }) => (
            <div className="auth-feature" key={text}>
              <span aria-hidden><Icon /></span>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-card">
          <div className="auth-form-header">
            <h2>Create your account</h2>
            <p>Free forever — no credit card needed</p>
          </div>
          {error   && <div className="auth-alert auth-alert-error">  <span className="alert-icon" aria-hidden><FaTriangleExclamation /></span>{error}</div>}
          {success && <div className="auth-alert auth-alert-success"><span className="alert-icon" aria-hidden><FaCircleCheck /></span>{success}</div>}
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="field-group">
              <label>Full name</label>
              <div className="input-wrap"><span className="input-icon" aria-hidden><FaUser /></span><input type="text" value={name} onChange={e=>setName(e.target.value)} placeholder="Rahul Sharma" required autoFocus /></div>
            </div>
            <div className="field-group">
              <label>Email address</label>
              <div className="input-wrap"><span className="input-icon" aria-hidden><FaEnvelope /></span><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required /></div>
            </div>
            <div className="field-group">
              <label>Password</label>
              <div className="input-wrap">
                <span className="input-icon" aria-hidden><FaLock /></span>
                <input type={showPass?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 6 characters" required />
                <button
                  type="button"
                  className="toggle-pass"
                  onClick={()=>setShowPass(p=>!p)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPass ? <FaEyeSlash aria-hidden /> : <FaEye aria-hidden />}
                </button>
              </div>
              {password.length > 0 && (
                <div className="strength-bar-wrap">
                  <div className={`strength-bar strength-${strength}`} />
                  <span className="strength-label">{['','Weak','Good','Strong'][strength]}</span>
                </div>
              )}
            </div>
            <div className="field-group">
              <label>Confirm password</label>
              <div className="input-wrap">
                <span className="input-icon" aria-hidden><FaLock /></span>
                <input type="password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Repeat your password" required />
                {confirm.length > 0 && (
                  <span className="match-icon" aria-hidden>
                    {confirm===password ? <FaCircleCheck /> : <FaCircleXmark />}
                  </span>
                )}
              </div>
            </div>
            <button type="submit" className="auth-submit-btn" disabled={loading||!!success}>
              {loading ? (
                <span className="btn-spinner" />
              ) : (
                <span className="auth-btn-label">
                  Create Account
                  <FaArrowRight className="auth-btn-icon" aria-hidden />
                </span>
              )}
            </button>
          </form>
          <p className="auth-switch">Already have an account? <button className="auth-link" onClick={onGoToLogin}>Sign in</button></p>
        </div>
      </div>
    </div>
  );
}