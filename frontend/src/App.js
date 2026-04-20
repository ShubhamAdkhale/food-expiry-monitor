import React, { useState, useEffect } from 'react';
import LoginPage    from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import Dashboard    from './components/Dashboard';
import './index.css';

// Replace with your actual API Gateway base URL
export const API_URL = 'https://satq7hyjyf.execute-api.ap-south-1.amazonaws.com/prod';

export default function App() {
  const [page, setPage]               = useState('login');
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('foodExpiryUser');
      if (saved) { setCurrentUser(JSON.parse(saved)); setPage('dashboard'); }
    } catch { localStorage.removeItem('foodExpiryUser'); }
  }, []);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem('foodExpiryUser', JSON.stringify(user));
    setPage('dashboard');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('foodExpiryUser');
    setPage('login');
  };

  return (
    <>
      {page === 'login'     && <LoginPage    onLoginSuccess={handleLoginSuccess} onGoToRegister={() => setPage('register')} />}
      {page === 'register'  && <RegisterPage onRegisterSuccess={() => setPage('login')} onGoToLogin={() => setPage('login')} />}
      {page === 'dashboard' && currentUser && <Dashboard user={currentUser} onLogout={handleLogout} />}
    </>
  );
}