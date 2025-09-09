import React, { useState, useEffect } from 'react';
import { teamService, playerService, seasonService } from '../../database/services';
import { Team, Player, Season } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import PlayerRoster from './PlayerRoster';
import TeamForm from './TeamForm';

const TeamManagement: React.FC = () => {
  const { user } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [currentSeason, setCurrentSeason] = useState<Season | null>(null);
  const [showTeamForm, setShowTeamForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [user]);

  useEffect(() => {
    if (selectedTeam) {
      loadPlayers();
    }
  }, [selectedTeam]);

  const loadData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      const [userTeams, allSeasons, currentSeason] = await Promise.all([
        user.role === 'coach' 
          ? teamService.getByCoach(user.id)
          : teamService.getAllActive(),
        seasonService.getAll(),
        seasonService.getCurrent()
      ]);

      setTeams(userTeams);
      setSeasons(allSeasons);
      setCurrentSeason(currentSeason || null);

      // Auto-select first team
      if (userTeams.length > 0) {
        setSelectedTeam(userTeams[0]);
      }

    } catch (error) {
      console.error('Error loading team data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPlayers = async () => {
    if (!selectedTeam?.id) return;

    try {
      const teamPlayers = await playerService.getByTeam(selectedTeam.id);
      setPlayers(teamPlayers);
    } catch (error) {
      console.error('Error loading players:', error);
    }
  };

  const handleTeamSave = async (teamData: Omit<Team, 'id'> | Team) => {
    try {
      if ('id' in teamData && teamData.id) {
        // Update existing team
        await teamService.update(teamData.id, teamData);
      } else {
        // Create new team
        await teamService.create({
          ...teamData,
          coachId: user?.id || 0,
          isActive: true
        });
      }

      await loadData();
      setShowTeamForm(false);
      setEditingTeam(null);
    } catch (error) {
      console.error('Error saving team:', error);
      alert('Failed to save team. Please try again.');
    }
  };

  const handleEditTeam = (team: Team) => {
    setEditingTeam(team);
    setShowTeamForm(true);
  };

  const handleDeleteTeam = async (teamId: number) => {
    if (!confirm('Are you sure you want to delete this team? This will also delete all associated players and matches.')) {
      return;
    }

    try {
      await teamService.delete(teamId);
      await loadData();
      
      if (selectedTeam?.id === teamId) {
        setSelectedTeam(teams.find(t => t.id !== teamId) || null);
      }
    } catch (error) {
      console.error('Error deleting team:', error);
      alert('Failed to delete team. Please try again.');
    }
  };

  const handlePlayerUpdate = () => {
    loadPlayers(); // Refresh players list
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">Loading team management...</div>
      </div>
    );
  }

  return (
    <div className="team-management">
      <div className="team-management-header">
        <h2>Team Management</h2>
        {user?.role === 'coach' && (
          <button 
            className="add-team-btn"
            onClick={() => {
              setEditingTeam(null);
              setShowTeamForm(true);
            }}
          >
            + Add Team
          </button>
        )}
      </div>

      {showTeamForm && (
        <TeamForm
          team={editingTeam}
          currentSeason={currentSeason}
          onSave={handleTeamSave}
          onCancel={() => {
            setShowTeamForm(false);
            setEditingTeam(null);
          }}
        />
      )}

      <div className="team-management-content">
        <div className="teams-sidebar">
          <h3>Your Teams</h3>
          
          {teams.length === 0 ? (
            <div className="no-teams">
              <p>No teams found</p>
              {user?.role === 'coach' && (
                <p>Create your first team to get started!</p>
              )}
            </div>
          ) : (
            <div className="teams-list">
              {teams.map(team => (
                <div 
                  key={team.id}
                  className={`team-item ${selectedTeam?.id === team.id ? 'active' : ''}`}
                  onClick={() => setSelectedTeam(team)}
                >
                  <div className="team-header">
                    <div className="team-name">{team.name}</div>
                    {user?.role === 'coach' && (
                      <div className="team-actions">
                        <button 
                          className="edit-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditTeam(team);
                          }}
                          title="Edit team"
                        >
                          ✏️
                        </button>
                        <button 
                          className="delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTeam(team.id!);
                          }}
                          title="Delete team"
                        >
                          🗑️
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="team-details">
                    <div className="age-group">{team.ageGroup}</div>
                    <div className="season">{team.season}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="team-content">
          {selectedTeam ? (
            <PlayerRoster 
              team={selectedTeam}
              players={players}
              onPlayerUpdate={handlePlayerUpdate}
              canEdit={user?.role === 'coach'}
            />
          ) : (
            <div className="no-team-selected">
              <h3>Select a Team</h3>
              <p>Choose a team from the sidebar to manage its roster.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeamManagement;