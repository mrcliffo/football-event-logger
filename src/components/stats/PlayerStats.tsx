import React from 'react';
import { useAuth } from '../../contexts/AuthContext';

const PlayerStats: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="player-stats">
      <div className="stats-header">
        <h2>Player Statistics</h2>
      </div>

      <div className="empty-state">
        <h3>Statistics Dashboard</h3>
        <p>Player statistics will appear here once match events are logged.</p>
        <p>Role: {user?.role}</p>
      </div>
    </div>
  );
};

export default PlayerStats;