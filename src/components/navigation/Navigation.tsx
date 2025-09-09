import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface NavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, onViewChange }) => {
  const { user, logout, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="login-form-container">
        <LoginForm />
      </div>
    );
  }

  return (
    <nav className="navigation">
      <div className="nav-header">
        <div className="app-title">
          <span className="app-icon">⚽</span>
          Football Logger
        </div>
        <div className="user-info">
          <span className="user-name">{user?.firstName} {user?.lastName}</span>
          <span className="user-role">({user?.role})</span>
          <button onClick={logout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>

      <div className="nav-menu">
        <button
          className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
          onClick={() => onViewChange('dashboard')}
        >
          <span className="nav-icon">🏠</span>
          <span className="nav-label">Dashboard</span>
        </button>

        {user?.role === 'coach' && (
          <>
            <button
              className={`nav-item ${currentView === 'teams' ? 'active' : ''}`}
              onClick={() => onViewChange('teams')}
            >
              <span className="nav-icon">👥</span>
              <span className="nav-label">Teams</span>
            </button>

            <button
              className={`nav-item ${currentView === 'matches' ? 'active' : ''}`}
              onClick={() => onViewChange('matches')}
            >
              <span className="nav-icon">⚽</span>
              <span className="nav-label">Matches</span>
            </button>

            <button
              className={`nav-item ${currentView === 'awards' ? 'active' : ''}`}
              onClick={() => onViewChange('awards')}
            >
              <span className="nav-icon">🏆</span>
              <span className="nav-label">Awards</span>
            </button>
          </>
        )}

        <button
          className={`nav-item ${currentView === 'stats' ? 'active' : ''}`}
          onClick={() => onViewChange('stats')}
        >
          <span className="nav-icon">📊</span>
          <span className="nav-label">Statistics</span>
        </button>
      </div>
    </nav>
  );
};

const LoginForm: React.FC = () => {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const success = await login(email, password);
    if (!success) {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="login-form">
      <h2>Login to Football Logger</h2>
      
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="login-button">
          Login
        </button>
      </form>

      <div className="demo-accounts">
        <h4>Demo Accounts:</h4>
        <p><strong>Coach:</strong> coach@demo.com / password</p>
        <p><strong>Parent:</strong> parent@demo.com / password</p>
      </div>
    </div>
  );
};

export default Navigation;