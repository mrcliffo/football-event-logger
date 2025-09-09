import React, { useState, useEffect } from 'react';
import { Match, Team } from '../../types';

interface MatchFormProps {
  match?: Match | null;
  team: Team;
  onSave: (matchData: Omit<Match, 'id'> | Match) => void;
  onCancel: () => void;
}

const MatchForm: React.FC<MatchFormProps> = ({ 
  match, 
  team,
  onSave, 
  onCancel 
}) => {
  const [formData, setFormData] = useState({
    opponent: '',
    date: '',
    time: '',
    venue: 'home' as 'home' | 'away',
    duration: 80,
    notes: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (match) {
      const matchDate = new Date(match.date);
      setFormData({
        opponent: match.opponent,
        date: matchDate.toISOString().split('T')[0],
        time: matchDate.toTimeString().slice(0, 5),
        venue: match.venue,
        duration: match.duration,
        notes: match.notes || ''
      });
    } else {
      // Default to next Saturday at 10:00 AM
      const nextSaturday = new Date();
      const daysUntilSaturday = (6 - nextSaturday.getDay() + 7) % 7 || 7;
      nextSaturday.setDate(nextSaturday.getDate() + daysUntilSaturday);
      
      setFormData({
        opponent: '',
        date: nextSaturday.toISOString().split('T')[0],
        time: '10:00',
        venue: 'home',
        duration: 80,
        notes: ''
      });
    }
  }, [match]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.opponent.trim()) {
      newErrors.opponent = 'Opponent team name is required';
    }

    if (!formData.date) {
      newErrors.date = 'Match date is required';
    } else {
      const matchDate = new Date(formData.date + 'T' + formData.time);
      const now = new Date();
      if (matchDate < now && !match) {
        newErrors.date = 'Match date cannot be in the past';
      }
    }

    if (!formData.time) {
      newErrors.time = 'Match time is required';
    }

    if (formData.duration < 30 || formData.duration > 120) {
      newErrors.duration = 'Match duration must be between 30 and 120 minutes';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const matchDateTime = new Date(formData.date + 'T' + formData.time);

    const matchData = {
      opponent: formData.opponent.trim(),
      date: matchDateTime,
      venue: formData.venue,
      duration: formData.duration,
      notes: formData.notes.trim() || undefined,
      isCompleted: false,
      createdAt: match?.createdAt || new Date(),
      updatedAt: new Date()
    };

    if (match?.id) {
      onSave({ 
        ...matchData, 
        id: match.id, 
        teamId: match.teamId,
        result: match.result,
        teamScore: match.teamScore,
        opponentScore: match.opponentScore
      });
    } else {
      onSave({ ...matchData, teamId: team.id! });
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const formatDateForDisplay = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="match-form-overlay">
      <div className="match-form">
        <div className="form-header">
          <h3>{match ? 'Edit Match' : 'Schedule New Match'}</h3>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="opponent">Opponent Team *</label>
            <input
              type="text"
              id="opponent"
              value={formData.opponent}
              onChange={(e) => handleChange('opponent', e.target.value)}
              placeholder="e.g. Eagles United, Sharks FC"
              className={errors.opponent ? 'error' : ''}
            />
            {errors.opponent && <span className="error-text">{errors.opponent}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date">Match Date *</label>
              <input
                type="date"
                id="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                className={errors.date ? 'error' : ''}
              />
              {formData.date && (
                <div className="date-preview">
                  {formatDateForDisplay(formData.date)}
                </div>
              )}
              {errors.date && <span className="error-text">{errors.date}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="time">Kick-off Time *</label>
              <input
                type="time"
                id="time"
                value={formData.time}
                onChange={(e) => handleChange('time', e.target.value)}
                className={errors.time ? 'error' : ''}
              />
              {errors.time && <span className="error-text">{errors.time}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="venue">Venue *</label>
              <select
                id="venue"
                value={formData.venue}
                onChange={(e) => handleChange('venue', e.target.value)}
              >
                <option value="home">Home</option>
                <option value="away">Away</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="duration">Duration (minutes) *</label>
              <input
                type="number"
                id="duration"
                min="30"
                max="120"
                step="5"
                value={formData.duration}
                onChange={(e) => handleChange('duration', parseInt(e.target.value))}
                className={errors.duration ? 'error' : ''}
              />
              {errors.duration && <span className="error-text">{errors.duration}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes (Optional)</label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Match location, special instructions, etc."
              rows={3}
            />
          </div>

          <div className="form-info">
            <p><strong>Team:</strong> {team.name} ({team.ageGroup})</p>
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="save-btn">
              {match ? 'Update Match' : 'Schedule Match'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MatchForm;