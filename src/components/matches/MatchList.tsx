import React, { useState } from 'react';
import { Match, Team } from '../../types';

interface MatchListProps {
  matches: Match[];
  team: Team;
  canEdit: boolean;
  onEdit: (match: Match) => void;
  onDelete: (matchId: number) => void;
  onComplete: (matchId: number, teamScore: number, opponentScore: number) => void;
}

const MatchList: React.FC<MatchListProps> = ({ 
  matches, 
  team, 
  canEdit, 
  onEdit, 
  onDelete, 
  onComplete 
}) => {
  const [completingMatch, setCompletingMatch] = useState<number | null>(null);
  const [scoreForm, setScoreForm] = useState({ teamScore: 0, opponentScore: 0 });

  const formatMatchDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const getMatchResult = (match: Match) => {
    if (!match.isCompleted || match.teamScore === undefined || match.opponentScore === undefined) {
      return null;
    }

    const result = match.result;
    const resultText = result === 'win' ? 'W' : result === 'loss' ? 'L' : 'D';
    const resultClass = `result-${result}`;
    
    return (
      <div className={`match-result ${resultClass}`}>
        <span className="result-letter">{resultText}</span>
        <span className="score">{match.teamScore} - {match.opponentScore}</span>
      </div>
    );
  };

  const handleCompleteMatch = (matchId: number) => {
    setCompletingMatch(matchId);
    setScoreForm({ teamScore: 0, opponentScore: 0 });
  };

  const handleScoreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (completingMatch) {
      onComplete(completingMatch, scoreForm.teamScore, scoreForm.opponentScore);
      setCompletingMatch(null);
    }
  };

  const isMatchToday = (matchDate: Date) => {
    const today = new Date();
    const match = new Date(matchDate);
    return today.toDateString() === match.toDateString();
  };

  const isMatchUpcoming = (matchDate: Date) => {
    const now = new Date();
    return new Date(matchDate) > now;
  };

  if (matches.length === 0) {
    return (
      <div className="no-matches">
        <h4>No Matches Found</h4>
        <p>No matches scheduled for this view.</p>
        {canEdit && (
          <p>Click "Schedule Match" to add your first match!</p>
        )}
      </div>
    );
  }

  return (
    <div className="match-list">
      {matches.map(match => (
        <div key={match.id} className={`match-card ${match.isCompleted ? 'completed' : isMatchToday(match.date) ? 'today' : ''}`}>
          <div className="match-header">
            <div className="match-info">
              <div className="opponent-name">{team.name} vs {match.opponent}</div>
              <div className="match-details">
                <span className="date">{formatMatchDate(match.date)}</span>
                <span className="venue">{match.venue}</span>
                <span className="duration">{match.duration}min</span>
              </div>
            </div>

            {match.isCompleted ? (
              getMatchResult(match)
            ) : isMatchToday(match.date) ? (
              <div className="match-status today-badge">
                TODAY
              </div>
            ) : isMatchUpcoming(match.date) ? (
              <div className="match-status upcoming">
                Upcoming
              </div>
            ) : (
              <div className="match-status past">
                Past
              </div>
            )}
          </div>

          {match.notes && (
            <div className="match-notes">
              <strong>Notes:</strong> {match.notes}
            </div>
          )}

          {canEdit && (
            <div className="match-actions">
              {!match.isCompleted && (
                <>
                  <button 
                    className="complete-btn"
                    onClick={() => handleCompleteMatch(match.id!)}
                    title="Complete match"
                  >
                    ⚽ Complete
                  </button>
                  <button 
                    className="edit-btn"
                    onClick={() => onEdit(match)}
                    title="Edit match"
                  >
                    ✏️ Edit
                  </button>
                </>
              )}
              <button 
                className="delete-btn"
                onClick={() => onDelete(match.id!)}
                title="Delete match"
              >
                🗑️ Delete
              </button>
            </div>
          )}

          {/* Score completion form */}
          {completingMatch === match.id && (
            <div className="score-form-overlay">
              <div className="score-form">
                <h4>Complete Match</h4>
                <form onSubmit={handleScoreSubmit}>
                  <div className="score-inputs">
                    <div className="score-group">
                      <label>{team.name}</label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={scoreForm.teamScore}
                        onChange={(e) => setScoreForm(prev => ({ 
                          ...prev, 
                          teamScore: parseInt(e.target.value) || 0 
                        }))}
                        required
                      />
                    </div>
                    
                    <div className="vs-separator">-</div>
                    
                    <div className="score-group">
                      <label>{match.opponent}</label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={scoreForm.opponentScore}
                        onChange={(e) => setScoreForm(prev => ({ 
                          ...prev, 
                          opponentScore: parseInt(e.target.value) || 0 
                        }))}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="score-actions">
                    <button 
                      type="button" 
                      className="cancel-score-btn"
                      onClick={() => setCompletingMatch(null)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="save-score-btn">
                      Complete Match
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MatchList;