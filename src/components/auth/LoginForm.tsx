import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    const success = await login(email, password);
    if (!success) {
      setError('Invalid email or password');
    }
  };

  const fillDemoCredentials = (userType: 'coach' | 'parent') => {
    setEmail(`${userType}@demo.com`);
    setPassword('password');
    setError('');
  };

  return (
    <div className="login-form-container">
      <div className="login-form">
        <h2>⚽ Football Event Logger</h2>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              placeholder="Enter your password"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="login-button"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="demo-accounts">
          <h4>🎮 Demo Accounts</h4>
          <p>Click to auto-fill credentials:</p>
          <div className="demo-buttons">
            <button 
              type="button"
              onClick={() => fillDemoCredentials('coach')}
              className="demo-btn coach"
              disabled={loading}
            >
              👨‍💼 Coach Demo
            </button>
            <button 
              type="button"
              onClick={() => fillDemoCredentials('parent')}
              className="demo-btn parent"
              disabled={loading}
            >
              👨‍👩‍👧‍👦 Parent Demo
            </button>
          </div>
          <div className="demo-details">
            <p><strong>Coach:</strong> coach@demo.com / password</p>
            <p><strong>Parent:</strong> parent@demo.com / password</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;