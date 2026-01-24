import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import './LoginPage.css';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { users, setCurrentUser, currentUser, isLoading } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // If already logged in, redirect to dashboard
    if (currentUser) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    if (!password) {
      setError('Please enter your password');
      return;
    }

    // Find user by email
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());

    if (!user) {
      setError('User not found with this email');
      return;
    }

    if (!user.isActive) {
      setError('This user account is inactive');
      return;
    }

    // Check password
    if (user.password !== password) {
      setError('Invalid password');
      return;
    }

    setCurrentUser(user);
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="login-logo">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3v18h18"/>
              <path d="M18 17V9"/>
              <path d="M13 17V5"/>
              <path d="M8 17v-3"/>
            </svg>
          </div>
          <h1>CRM App</h1>
          <p className="login-subtitle">Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="password-input"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="password-input"
              autoComplete="current-password"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-btn">
            Sign In
          </button>
        </form>

        <div className="login-info">
          <h3>Demo Credentials</h3>
          <div className="credentials-list">
            <div className="credential-item">
              <span className="role-dot" style={{ backgroundColor: '#e74c3c' }}></span>
              <div className="credential-info">
                <strong>Admin</strong>
                <span className="credential-email">admin@crm.com</span>
                <span className="credential-pass">admin123</span>
              </div>
            </div>
            <div className="credential-item">
              <span className="role-dot" style={{ backgroundColor: '#8e44ad' }}></span>
              <div className="credential-info">
                <strong>Team Leader</strong>
                <span className="credential-email">tl@crm.com</span>
                <span className="credential-pass">tl123</span>
              </div>
            </div>
            <div className="credential-item">
              <span className="role-dot" style={{ backgroundColor: '#27ae60' }}></span>
              <div className="credential-info">
                <strong>Manager</strong>
                <span className="credential-email">manager1@crm.com</span>
                <span className="credential-pass">manager123</span>
              </div>
            </div>
            <div className="credential-item">
              <span className="role-dot" style={{ backgroundColor: '#3498db' }}></span>
              <div className="credential-info">
                <strong>Caller</strong>
                <span className="credential-email">caller1@crm.com</span>
                <span className="credential-pass">caller123</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
