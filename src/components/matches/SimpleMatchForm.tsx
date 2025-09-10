import React, { useState } from 'react';
import { Match, Team } from '../../types';

interface SimpleMatchFormProps {
  match?: Match | null;
  team: Team;
  onSave: (matchData: Omit<Match, 'id'> | Match) => void;
  onCancel: () => void;
}

const SimpleMatchForm: React.FC<SimpleMatchFormProps> = ({ match, team, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    opponent: match?.opponent || '',
    date: match?.date ? new Date(match.date).toISOString().slice(0, 16) : '',
    venue: match?.venue || 'home' as 'home' | 'away',
    periods: match?.periods || 2,
    notes: match?.notes || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.opponent.trim()) {
      newErrors.opponent = 'Opponent is required';
    }

    if (!formData.date) {
      newErrors.date = 'Date and time are required';
    }

    if (formData.periods < 1 || formData.periods > 4) {
      newErrors.periods = 'Periods must be between 1 and 4';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    const matchData = {
      ...match,
      teamId: match?.teamId || team.id!,
      opponent: formData.opponent.trim(),
      date: new Date(formData.date),
      venue: formData.venue,
      periods: formData.periods,
      notes: formData.notes.trim() || undefined,
      isCompleted: false,
      isStarted: false,
      currentPeriod: 0,
      totalElapsedTime: 0,
      createdAt: match?.createdAt || new Date(),
      updatedAt: new Date()
    };

    if (match?.id) {
      onSave({ ...matchData, id: match.id });
    } else {
      onSave(matchData);
    }
  };

  return (
    <div className="simple-match-form">
      <div className="form-header">
        <h3>{match ? 'Edit Match' : 'Schedule New Match'}</h3>
        <button className="close-btn" onClick={onCancel}>×</button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Opponent Team *</label>
          <input
            type="text"
            value={formData.opponent}
            onChange={(e) => setFormData(prev => ({ ...prev, opponent: e.target.value }))}
            placeholder="Enter opponent team name"
            className={errors.opponent ? 'error' : ''}
          />
          {errors.opponent && <span className="error-message">{errors.opponent}</span>}
        </div>

        <div className="form-group">
          <label>Date & Time *</label>
          <input
            type="datetime-local"
            value={formData.date}
            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            className={errors.date ? 'error' : ''}
          />
          {errors.date && <span className="error-message">{errors.date}</span>}
        </div>

        <div className="form-group">
          <label>Venue</label>
          <select
            value={formData.venue}
            onChange={(e) => setFormData(prev => ({ ...prev, venue: e.target.value as 'home' | 'away' }))}
          >
            <option value="home">Home</option>
            <option value="away">Away</option>
          </select>
        </div>

        <div className="form-group">
          <label>Number of Periods</label>
          <select
            value={formData.periods}
            onChange={(e) => setFormData(prev => ({ ...prev, periods: parseInt(e.target.value) }))}
            className={errors.periods ? 'error' : ''}
          >
            <option value={1}>1 Period</option>
            <option value={2}>2 Halves</option>
            <option value={3}>3 Periods</option>
            <option value={4}>4 Quarters</option>
          </select>
          {errors.periods && <span className="error-message">{errors.periods}</span>}
        </div>

        <div className="form-group">
          <label>Notes (Optional)</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Additional match notes..."
            rows={3}
          />
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="cancel-btn">
            Cancel
          </button>
          <button type="submit" className="save-btn">
            {match ? 'Update Match' : 'Create Match'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SimpleMatchForm;