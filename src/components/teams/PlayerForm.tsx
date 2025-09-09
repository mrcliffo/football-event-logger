import React, { useState, useEffect } from 'react';
import { Player, Team } from '../../types';

interface PlayerFormProps {
  player?: Player | null;
  team: Team;
  availableShirtNumbers: number[];
  positions: string[];
  onSave: (playerData: Omit<Player, 'id'> | Player) => void;
  onCancel: () => void;
}

const PlayerForm: React.FC<PlayerFormProps> = ({ 
  player, 
  team,
  availableShirtNumbers,
  positions,
  onSave, 
  onCancel 
}) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    shirtNumber: undefined as number | undefined,
    position: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (player) {
      setFormData({
        firstName: player.firstName,
        lastName: player.lastName,
        shirtNumber: player.shirtNumber,
        position: player.position || ''
      });
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        shirtNumber: undefined,
        position: ''
      });
    }
  }, [player]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (formData.shirtNumber) {
      const availableNumbers = player?.shirtNumber 
        ? [...availableShirtNumbers, player.shirtNumber]
        : availableShirtNumbers;
      
      if (!availableNumbers.includes(formData.shirtNumber)) {
        newErrors.shirtNumber = 'This shirt number is already taken';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const playerData = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      shirtNumber: formData.shirtNumber,
      position: formData.position || undefined,
      teamId: team.id!,
      parentIds: [],
      isActive: true,
      createdAt: player?.createdAt || new Date(),
      updatedAt: new Date()
    };

    if (player?.id) {
      onSave({ ...playerData, id: player.id, parentIds: player.parentIds });
    } else {
      onSave(playerData);
    }
  };

  const handleChange = (field: string, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="player-form-overlay">
      <div className="player-form">
        <div className="form-header">
          <h3>{player ? 'Edit Player' : 'Add New Player'}</h3>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First Name *</label>
              <input
                type="text"
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                placeholder="e.g. Tommy"
                className={errors.firstName ? 'error' : ''}
              />
              {errors.firstName && <span className="error-text">{errors.firstName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Last Name *</label>
              <input
                type="text"
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                placeholder="e.g. Johnson"
                className={errors.lastName ? 'error' : ''}
              />
              {errors.lastName && <span className="error-text">{errors.lastName}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="shirtNumber">Shirt Number</label>
              <select
                id="shirtNumber"
                value={formData.shirtNumber || ''}
                onChange={(e) => handleChange('shirtNumber', e.target.value ? parseInt(e.target.value) : undefined)}
                className={errors.shirtNumber ? 'error' : ''}
              >
                <option value="">No number assigned</option>
                {(player?.shirtNumber ? [...availableShirtNumbers, player.shirtNumber].sort((a, b) => a - b) : availableShirtNumbers)
                  .map(num => (
                    <option key={num} value={num}>#{num}</option>
                  ))
                }
              </select>
              {errors.shirtNumber && <span className="error-text">{errors.shirtNumber}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="position">Position</label>
              <select
                id="position"
                value={formData.position}
                onChange={(e) => handleChange('position', e.target.value)}
              >
                <option value="">Select position</option>
                {positions.map(pos => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-info">
            <p><strong>Team:</strong> {team.name} ({team.ageGroup})</p>
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="save-btn">
              {player ? 'Update Player' : 'Add Player'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlayerForm;