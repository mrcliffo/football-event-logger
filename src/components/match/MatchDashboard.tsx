import React, { useState, useEffect } from 'react';
import { matchService, teamService } from '../../database/services';
import { Match, Team } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import EventLogger from './EventLogger';

const MatchDashboard: React.FC = () => {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      // Get teams managed by this coach
      const coachTeams = await teamService.getByCoach(user.id);
      setTeams(coachTeams);

      if (coachTeams.length === 0) {
        setLoading(false);
        return;
      }

      // Get upcoming and recent matches for all teams
      const allMatches: Match[] = [];
      for (const team of coachTeams) {
        if (team.id) {
          const [upcoming, recent] = await Promise.all([
            matchService.getUpcoming(team.id),
            matchService.getRecent(team.id, 3)
          ]);
          allMatches.push(...upcoming, ...recent);
        }
      }

      // Sort matches by date (upcoming first, then recent)
      allMatches.sort((a, b) => {
        const now = new Date();
        const aDate = new Date(a.date);
        const bDate = new Date(b.date);
        
        // Upcoming matches sorted by date (earliest first)
        if (aDate >= now && bDate >= now) {
          return aDate.getTime() - bDate.getTime();
        }
        
        // Recent matches sorted by date (most recent first)
        if (aDate < now && bDate < now) {
          return bDate.getTime() - aDate.getTime();
        }
        
        // Upcoming matches come before recent ones
        return aDate >= now ? -1 : 1;
      });

      setMatches(allMatches);

      // Auto-select first upcoming match or most recent match
      const upcomingMatch = allMatches.find(m => !m.isCompleted && new Date(m.date) >= new Date());
      const recentMatch = allMatches.find(m => !m.isCompleted);
      
      if (upcomingMatch) {
        setSelectedMatch(upcomingMatch);
      } else if (recentMatch) {
        setSelectedMatch(recentMatch);
      } else if (allMatches.length > 0) {
        setSelectedMatch(allMatches[0]);
      }

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMatchComplete = async (match: Match) => {
    if (!match.id) return;

    try {
      await matchService.update(match.id, { 
        isCompleted: true,
        updatedAt: new Date()
      });
      
      await loadDashboardData();
      // Find next active match to select
      const nextMatch = matches.find(m => m.id !== match.id && !m.isCompleted);
      setSelectedMatch(nextMatch || null);
    } catch (error) {
      console.error('Error completing match:', error);
      alert('Failed to complete match. Please try again.');
    }
  };

  const getTeamName = (teamId: number) => {
    const team = teams.find(t => t.id === teamId);
    return team ? team.name : 'Unknown Team';
  };

  const formatMatchDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const isMatchToday = (matchDate: Date) => {
    const today = new Date();
    const match = new Date(matchDate);
    return today.toDateString() === match.toDateString();
  };

  const isMatchUpcoming = (matchDate: Date) => {
    return new Date(matchDate) > new Date();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading matches...</div>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="empty-state">
        <h2>Welcome to Football Logger! 🎯</h2>
        <div style={{ marginTop: '2rem', padding: '2rem', background: '#f8f9fa', borderRadius: '12px', textAlign: 'left' }}>
          <h3>🚀 Match & Team Management Added!</h3>
          <ul style={{ marginTop: '1rem', lineHeight: '1.8' }}>
            <li>✅ <strong>Team Management:</strong> Create teams and manage player rosters</li>
            <li>✅ <strong>Match Scheduling:</strong> Schedule and manage matches</li>
            <li>✅ <strong>Event Logging:</strong> Log match events with offline support</li>
            <li>✅ <strong>Player Statistics:</strong> Automatic stat tracking</li>
            <li>✅ <strong>Season Awards:</strong> Automated award generation</li>
            <li>✅ <strong>Mobile Optimized:</strong> Works great on tablets/phones</li>
          </ul>
          
          <div style={{ marginTop: '2rem', padding: '1rem', background: '#e8f5e8', borderRadius: '8px' }}>
            <strong>🏃‍♂️ Next Steps:</strong>
            <ol style={{ marginTop: '0.5rem' }}>
              <li>Go to <strong>Teams</strong> tab to create your first team</li>
              <li>Add players to your team roster</li>
              <li>Go to <strong>Matches</strong> tab to schedule matches</li>
              <li>Return here to log live match events!</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="match-dashboard">
      <div className="dashboard-header">
        <h2>Match Dashboard</h2>
        <div className="coach-info">
          Welcome, {user?.firstName} {user?.lastName}
        </div>
      </div>

      <div className="dashboard-content">
        <div className="matches-sidebar">
          <h3>Your Matches</h3>
          
          {matches.length === 0 ? (
            <div className="no-matches">
              <p>No matches scheduled</p>
              <p>Go to <strong>Matches</strong> to schedule your first match!</p>
            </div>
          ) : (
            <div className="matches-list">
              {matches.map(match => (
                <div 
                  key={match.id}
                  className={`match-item ${selectedMatch?.id === match.id ? 'active' : ''} ${match.isCompleted ? 'completed' : ''} ${isMatchToday(match.date) ? 'today' : ''}`}
                  onClick={() => setSelectedMatch(match)}
                >
                  <div className="match-header">
                    <div className="team-name">{getTeamName(match.teamId)}</div>
                    <div className="match-status">
                      {match.isCompleted ? '✅' : 
                       isMatchToday(match.date) ? '🔴 TODAY' : 
                       isMatchUpcoming(match.date) ? '📅' : '⏱️'}
                    </div>
                  </div>
                  
                  <div className="match-details">
                    <div className="opponent">vs {match.opponent}</div>
                    <div className="date">{formatMatchDate(match.date)}</div>
                    <div className="venue">{match.venue}</div>
                  </div>

                  {match.isCompleted && match.teamScore !== undefined && match.opponentScore !== undefined && (
                    <div className="final-score">
                      Final: {match.teamScore} - {match.opponentScore}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="match-content">
          {selectedMatch ? (
            <div className="selected-match">
              <div className="match-info-header">
                <h3>{getTeamName(selectedMatch.teamId)} vs {selectedMatch.opponent}</h3>
                <div className="match-actions">
                  {!selectedMatch.isCompleted && (
                    <button 
                      className="complete-match-btn"
                      onClick={() => handleMatchComplete(selectedMatch)}
                    >
                      Complete Match
                    </button>
                  )}
                </div>
              </div>

              {!selectedMatch.isCompleted ? (
                <EventLogger 
                  match={selectedMatch} 
                  onEventAdded={() => loadDashboardData()}
                />
              ) : (
                <div className="completed-match">
                  <h4>Match Completed</h4>
                  <p>This match has been completed. View event history below.</p>
                  <EventLogger 
                    match={selectedMatch} 
                    onEventAdded={() => loadDashboardData()}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="no-match-selected">
              <h3>No Matches Available</h3>
              <p>Schedule matches in the <strong>Matches</strong> tab to start logging events!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchDashboard;