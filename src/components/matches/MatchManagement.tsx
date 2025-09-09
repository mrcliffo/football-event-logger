import React, { useState, useEffect } from 'react';
import { matchService, teamService } from '../../database/services';
import { Match, Team } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import MatchForm from './MatchForm';
import MatchList from './MatchList';

const MatchManagement: React.FC = () => {
  const { user } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showMatchForm, setShowMatchForm] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'upcoming' | 'all' | 'completed'>('upcoming');

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    if (selectedTeam) {
      loadMatches();
    }
  }, [selectedTeam, view]);

  const loadData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      const userTeams = user.role === 'coach' 
        ? await teamService.getByCoach(user.id)
        : await teamService.getAllActive();

      setTeams(userTeams);

      // Auto-select first team
      if (userTeams.length > 0) {
        setSelectedTeam(userTeams[0]);
      }

    } catch (error) {
      console.error('Error loading match data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMatches = async () => {
    if (!selectedTeam?.id) return;

    try {
      let teamMatches: Match[];

      switch (view) {
        case 'upcoming':
          teamMatches = await matchService.getUpcoming(selectedTeam.id);
          break;
        case 'completed':
          const allMatches = await matchService.getByTeam(selectedTeam.id);
          teamMatches = allMatches.filter(m => m.isCompleted);
          break;
        default:
          teamMatches = await matchService.getByTeam(selectedTeam.id);
      }

      setMatches(teamMatches);
    } catch (error) {
      console.error('Error loading matches:', error);
    }
  };

  const handleMatchSave = async (matchData: Omit<Match, 'id'> | Match) => {
    try {
      if ('id' in matchData && matchData.id) {
        // Update existing match
        await matchService.update(matchData.id, matchData);
      } else {
        // Create new match
        await matchService.create({
          ...matchData,
          teamId: selectedTeam?.id || 0,
          isCompleted: false
        });
      }

      await loadMatches();
      setShowMatchForm(false);
      setEditingMatch(null);
    } catch (error) {
      console.error('Error saving match:', error);
      alert('Failed to save match. Please try again.');
    }
  };

  const handleEditMatch = (match: Match) => {
    setEditingMatch(match);
    setShowMatchForm(true);
  };

  const handleDeleteMatch = async (matchId: number) => {
    if (!confirm('Are you sure you want to delete this match? This will also delete all associated match events.')) {
      return;
    }

    try {
      await matchService.delete(matchId);
      await loadMatches();
    } catch (error) {
      console.error('Error deleting match:', error);
      alert('Failed to delete match. Please try again.');
    }
  };

  const handleCompleteMatch = async (matchId: number, teamScore: number, opponentScore: number) => {
    try {
      const result = teamScore > opponentScore ? 'win' : 
                    teamScore < opponentScore ? 'loss' : 'draw';

      await matchService.update(matchId, {
        isCompleted: true,
        teamScore,
        opponentScore,
        result,
        updatedAt: new Date()
      });

      await loadMatches();
    } catch (error) {
      console.error('Error completing match:', error);
      alert('Failed to complete match. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading match management...</div>
      </div>
    );
  }

  if (teams.length === 0) {
    return (
      <div className="empty-state">
        <h2>No Teams Found</h2>
        <p>You need to create a team before you can schedule matches.</p>
        <p>Go to Team Management to create your first team.</p>
      </div>
    );
  }

  return (
    <div className="match-management">
      <div className="match-management-header">
        <h2>Match Management</h2>
        {user?.role === 'coach' && selectedTeam && (
          <button 
            className="add-match-btn"
            onClick={() => {
              setEditingMatch(null);
              setShowMatchForm(true);
            }}
          >
            + Schedule Match
          </button>
        )}
      </div>

      {showMatchForm && selectedTeam && (
        <MatchForm
          match={editingMatch}
          team={selectedTeam}
          onSave={handleMatchSave}
          onCancel={() => {
            setShowMatchForm(false);
            setEditingMatch(null);
          }}
        />
      )}

      <div className="match-management-content">
        <div className="teams-sidebar">
          <h3>Select Team</h3>
          
          <div className="teams-list">
            {teams.map(team => (
              <div 
                key={team.id}
                className={`team-item ${selectedTeam?.id === team.id ? 'active' : ''}`}
                onClick={() => setSelectedTeam(team)}
              >
                <div className="team-name">{team.name}</div>
                <div className="team-details">{team.ageGroup}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="matches-content">
          {selectedTeam ? (
            <>
              <div className="matches-header">
                <h3>{selectedTeam.name} Matches</h3>
                <div className="view-filters">
                  <button 
                    className={`filter-btn ${view === 'upcoming' ? 'active' : ''}`}
                    onClick={() => setView('upcoming')}
                  >
                    Upcoming
                  </button>
                  <button 
                    className={`filter-btn ${view === 'all' ? 'active' : ''}`}
                    onClick={() => setView('all')}
                  >
                    All
                  </button>
                  <button 
                    className={`filter-btn ${view === 'completed' ? 'active' : ''}`}
                    onClick={() => setView('completed')}
                  >
                    Completed
                  </button>
                </div>
              </div>

              <MatchList
                matches={matches}
                team={selectedTeam}
                canEdit={user?.role === 'coach'}
                onEdit={handleEditMatch}
                onDelete={handleDeleteMatch}
                onComplete={handleCompleteMatch}
              />
            </>
          ) : (
            <div className="no-team-selected">
              <h3>Select a Team</h3>
              <p>Choose a team from the sidebar to manage its matches.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchManagement;