import React, { useState, useEffect } from 'react';
import { Team, Season } from '../../types';

interface TeamFormProps {
  team?: Team | null;
  currentSeason: Season | null;
  onSave: (teamData: any) => void;
  onCancel: () => void;
}

const TeamForm: React.FC<TeamFormProps> = ({ 
  team, 
  currentSeason, 
  onSave, 
  onCancel 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    ageGroup: '',
    season: currentSeason?.name || ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (team) {
      setFormData({
        name: team.name,
        ageGroup: team.ageGroup,
        season: team.season
      });
    } else {
      setFormData({
        name: '',
        ageGroup: '',
        season: currentSeason?.name || ''
      });
    }
  }, [team, currentSeason]);

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Team name is required';
    }

    if (!formData.ageGroup.trim()) {
      newErrors.ageGroup = 'Age group is required';
    }

    if (!formData.season.trim()) {
      newErrors.season = 'Season is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const teamData = {
      name: formData.name.trim(),
      ageGroup: formData.ageGroup.trim(),
      season: formData.season.trim(),
      isActive: true,
      createdAt: team?.createdAt || new Date(),
      updatedAt: new Date()
    };

    if (team?.id) {
      onSave({ ...teamData, id: team.id, coachId: team.coachId });
    } else {
      onSave(teamData);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const ageGroups = [
    'Under 6',
    'Under 7',
    'Under 8',
    'Under 9',
    'Under 10',
    'Under 11',
    'Under 12',
    'Under 13',
    'Under 14',
    'Under 15',
    'Under 16',
    'Under 17',
    'Under 18'
  ];

  return (
    <div className="team-form-overlay">
      <div className="team-form">
        <div className="form-header">
          <h3>{team ? 'Edit Team' : 'Create New Team'}</h3>
          <button className="close-btn" onClick={onCancel}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="teamName">Team Name *</label>
            <input
              type="text"
              id="teamName"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g. Lions FC, Eagles United"
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <span className="error-text">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="ageGroup">Age Group *</label>
            <select
              id="ageGroup"
              value={formData.ageGroup}
              onChange={(e) => handleChange('ageGroup', e.target.value)}
              className={errors.ageGroup ? 'error' : ''}
            >
              <option value="">Select Age Group</option>
              {ageGroups.map(group => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>
            {errors.ageGroup && <span className="error-text">{errors.ageGroup}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="season">Season *</label>
            <input
              type="text"
              id="season"
              value={formData.season}
              onChange={(e) => handleChange('season', e.target.value)}
              placeholder="e.g. 2024-2025"
              className={errors.season ? 'error' : ''}
            />
            {errors.season && <span className="error-text">{errors.season}</span>}
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="save-btn">
              {team ? 'Update Team' : 'Create Team'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeamForm;