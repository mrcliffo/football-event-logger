import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { syncService } from './services/syncService';
import Navigation from './components/navigation/Navigation';
import MatchDashboard from './components/match/MatchDashboard';
import PlayerStats from './components/stats/PlayerStats';
import SeasonAwards from './components/awards/SeasonAwards';
import TeamManagement from './components/teams/TeamManagement';
import MatchManagement from './components/matches/MatchManagement';
import ProtectedRoute from './components/auth/ProtectedRoute';
import './App.css';

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    // Register service worker for offline functionality
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(() => console.log('Service Worker registered'))
        .catch(error => console.error('Service Worker registration failed:', error));
    }

    // Initialize sync service
    syncService.syncPendingData();
  }, []);

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return user?.role === 'coach' ? <MatchDashboard /> : <PlayerStats />;
      case 'teams':
        return (
          <ProtectedRoute allowedRoles={['coach']}>
            <TeamManagement />
          </ProtectedRoute>
        );
      case 'matches':
        return (
          <ProtectedRoute allowedRoles={['coach']}>
            <MatchManagement />
          </ProtectedRoute>
        );
      case 'stats':
        return <PlayerStats />;
      case 'awards':
        return (
          <ProtectedRoute allowedRoles={['coach']}>
            <SeasonAwards />
          </ProtectedRoute>
        );
      default:
        return user?.role === 'coach' ? <MatchDashboard /> : <PlayerStats />;
    }
  };

  if (!isAuthenticated) {
    return <div className="app-container" />;
  }

  return (
    <div className="app-container">
      <Navigation 
        currentView={currentView}
        onViewChange={setCurrentView}
      />
      <main className="main-content">
        {renderCurrentView()}
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
