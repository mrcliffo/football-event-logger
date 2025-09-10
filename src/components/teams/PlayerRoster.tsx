import React, { useState } from 'react';
import { Player, Team } from '../../types';
import { playerService } from '../../database/services';
import PlayerForm from './PlayerForm';

interface PlayerRosterProps {
  team: Team;
  players: Player[];
  onPlayerUpdate: () => void;
  canEdit: boolean;
}

const PlayerRoster: React.FC<PlayerRosterProps> = ({ 
  team, 
  players, 
  onPlayerUpdate, 
  canEdit 
}) => {
  const [showPlayerForm, setShowPlayerForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'number' | 'position'>('name');

  const handleAddPlayer = () => {
    setEditingPlayer(null);
    setShowPlayerForm(true);
  };

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player);
    setShowPlayerForm(true);
  };

  const handleDeletePlayer = async (playerId: number) => {
    if (!window.confirm('Are you sure you want to remove this player from the team?')) {
      return;
    }

    try {
      await playerService.delete(playerId);
      onPlayerUpdate();
    } catch (error) {
      console.error('Error deleting player:', error);
      alert('Failed to remove player. Please try again.');
    }
  };

  const handlePlayerSave = async (playerData: Omit<Player, 'id'> | Player) => {
    try {
      if ('id' in playerData && playerData.id) {
        // Update existing player
        await playerService.update(playerData.id, playerData);
      } else {
        // Create new player
        await playerService.create({
          ...playerData,
          teamId: team.id!,
          isActive: true
        });
      }

      onPlayerUpdate();
      setShowPlayerForm(false);
      setEditingPlayer(null);
    } catch (error) {
      console.error('Error saving player:', error);
      alert('Failed to save player. Please try again.');
    }
  };

  const getSortedPlayers = () => {
    return [...players].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
        case 'number':
          const aNum = a.shirtNumber || 999;
          const bNum = b.shirtNumber || 999;
          return aNum - bNum;
        case 'position':
          const aPos = a.position || 'Z';
          const bPos = b.position || 'Z';
          return aPos.localeCompare(bPos);
        default:
          return 0;
      }
    });
  };

  const getAvailableShirtNumbers = () => {
    const usedNumbers = players
      .filter(p => p.id !== editingPlayer?.id)
      .map(p => p.shirtNumber)
      .filter(n => n !== undefined);
    
    const available = [];
    for (let i = 1; i <= 99; i++) {
      if (!usedNumbers.includes(i)) {
        available.push(i);
      }
    }
    return available;
  };

  const positions = ['Goalkeeper', 'Defence', 'Midfield', 'Forward'];

  return (
    <div className="player-roster">
      <div className="roster-header">
        <div className="roster-title">
          <h3>{team.name} Roster</h3>
          <div className="team-info">
            <span className="age-group">{team.ageGroup}</span>
            <span className="player-count">{players.length} players</span>
          </div>
        </div>

        <div className="roster-controls">
          <div className="sort-controls">
            <label>Sort by:</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as 'name' | 'number' | 'position')}
            >
              <option value="name">Name</option>
              <option value="number">Shirt Number</option>
              <option value="position">Position</option>
            </select>
          </div>

          {canEdit && (
            <button className="add-player-btn" onClick={handleAddPlayer}>
              + Add Player
            </button>
          )}
        </div>
      </div>

      {showPlayerForm && (
        <PlayerForm
          player={editingPlayer}
          team={team}
          availableShirtNumbers={getAvailableShirtNumbers()}
          positions={positions}
          onSave={handlePlayerSave}
          onCancel={() => {
            setShowPlayerForm(false);
            setEditingPlayer(null);
          }}
        />
      )}

      <div className="roster-content">
        {players.length === 0 ? (
          <div className="no-players">
            <h4>No Players Added Yet</h4>
            <p>Start building your team by adding players to the roster.</p>
            {canEdit && (
              <button className="add-first-player-btn" onClick={handleAddPlayer}>
                Add First Player
              </button>
            )}
          </div>
        ) : (
          <div className="players-grid">
            {getSortedPlayers().map(player => (
              <div key={player.id} className="player-card">
                <div className="player-card-header">
                  <div className="player-number">
                    #{player.shirtNumber || '?'}
                  </div>
                  {canEdit && (
                    <div className="player-actions">
                      <button 
                        className="edit-player-btn"
                        onClick={() => handleEditPlayer(player)}
                        title="Edit player"
                      >
                        ✏️
                      </button>
                      <button 
                        className="delete-player-btn"
                        onClick={() => handleDeletePlayer(player.id!)}
                        title="Remove player"
                      >
                        🗑️
                      </button>
                    </div>
                  )}
                </div>

                <div className="player-details">
                  <div className="player-name">
                    {player.firstName} {player.lastName}
                  </div>
                  
                  {player.position && (
                    <div className="player-position">
                      {player.position}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="roster-summary">
        <h4>Squad Overview</h4>
        <div className="position-breakdown">
          {positions.map(position => {
            const count = players.filter(p => p.position === position).length;
            return (
              <div key={position} className="position-stat">
                <span className="position-name">{position}:</span>
                <span className="position-count">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PlayerRoster;