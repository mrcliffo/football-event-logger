import React, { useState, useEffect } from 'react';
import { eventTypeService } from '../../database/services';
import { EventType } from '../../types';

interface EventTypeManagerProps {
  teamId: number;
  onClose: () => void;
}

interface EventTypeForm {
  name: string;
  icon: string;
  color: string;
  requiresPlayer: boolean;
  isPositive: boolean;
  isActive: boolean;
  sortOrder: number;
}

const defaultForm: EventTypeForm = {
  name: '',
  icon: '⚽',
  color: '#4caf50',
  requiresPlayer: true,
  isPositive: true,
  isActive: true,
  sortOrder: 1
};

const commonIcons = ['⚽', '🎯', '🛡️', '🥅', '🟨', '🟥', '👟', '🏃', '💪', '🤝', '📝', '🔄', '⏱️'];
const commonColors = ['#4caf50', '#2196f3', '#ff9800', '#9c27b0', '#f44336', '#ffeb3b', '#607d8b', '#795548', '#e91e63', '#00bcd4'];

const EventTypeManager: React.FC<EventTypeManagerProps> = ({ teamId, onClose }) => {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEventType, setEditingEventType] = useState<EventType | null>(null);
  const [formData, setFormData] = useState<EventTypeForm>(defaultForm);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadEventTypes();
  }, [teamId]);

  const loadEventTypes = async () => {
    try {
      const types = await eventTypeService.getByTeam(teamId);
      // Include inactive event types for admin management
      const allTypes = await eventTypeService.getByTeam(teamId);
      setEventTypes(allTypes);
    } catch (error) {
      console.error('Error loading event types:', error);
      alert('Failed to load event types');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Event type name is required');
      return;
    }

    setLoading(true);
    try {
      if (editingEventType && editingEventType.id) {
        // Update existing event type
        await eventTypeService.update(editingEventType.id, {
          ...formData,
          updatedAt: new Date()
        });
      } else {
        // Create new event type
        await eventTypeService.create({
          teamId,
          ...formData,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      await loadEventTypes();
      resetForm();
    } catch (error) {
      console.error('Error saving event type:', error);
      alert('Failed to save event type');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (eventType: EventType) => {
    setEditingEventType(eventType);
    setFormData({
      name: eventType.name,
      icon: eventType.icon,
      color: eventType.color,
      requiresPlayer: eventType.requiresPlayer,
      isPositive: eventType.isPositive,
      isActive: eventType.isActive,
      sortOrder: eventType.sortOrder
    });
    setShowForm(true);
  };

  const handleDelete = async (eventType: EventType) => {
    if (!eventType.id) return;
    
    if (!window.confirm(`Are you sure you want to delete "${eventType.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await eventTypeService.delete(eventType.id);
      await loadEventTypes();
    } catch (error) {
      console.error('Error deleting event type:', error);
      alert('Failed to delete event type');
    }
  };

  const handleToggleActive = async (eventType: EventType) => {
    if (!eventType.id) return;

    try {
      await eventTypeService.update(eventType.id, {
        isActive: !eventType.isActive,
        updatedAt: new Date()
      });
      await loadEventTypes();
    } catch (error) {
      console.error('Error updating event type:', error);
      alert('Failed to update event type');
    }
  };

  const resetForm = () => {
    setFormData(defaultForm);
    setEditingEventType(null);
    setShowForm(false);
  };

  const updateSortOrder = async (eventType: EventType, newOrder: number) => {
    if (!eventType.id) return;

    try {
      await eventTypeService.update(eventType.id, {
        sortOrder: newOrder,
        updatedAt: new Date()
      });
      await loadEventTypes();
    } catch (error) {
      console.error('Error updating sort order:', error);
    }
  };

  return (
    <div className="event-type-manager">
      <div className="manager-header">
        <h2>Manage Event Types</h2>
        <button onClick={onClose} className="close-btn">✕</button>
      </div>

      <div className="manager-actions">
        <button 
          onClick={() => setShowForm(true)} 
          className="add-event-type-btn"
          disabled={loading}
        >
          + Add New Event Type
        </button>
      </div>

      {/* Event Types List */}
      <div className="event-types-list">
        <h3>Current Event Types</h3>
        {eventTypes.length === 0 ? (
          <p className="no-event-types">No event types found. Create your first event type above.</p>
        ) : (
          <div className="event-types-grid">
            {eventTypes.map((eventType, index) => (
              <div key={eventType.id} className={`event-type-card ${!eventType.isActive ? 'inactive' : ''}`}>
                <div className="event-type-preview">
                  <div 
                    className="event-type-icon"
                    style={{ backgroundColor: eventType.color }}
                  >
                    {eventType.icon}
                  </div>
                  <div className="event-type-info">
                    <h4>{eventType.name}</h4>
                    <div className="event-type-meta">
                      <span className={`requires-player ${eventType.requiresPlayer ? 'yes' : 'no'}`}>
                        {eventType.requiresPlayer ? 'Requires Player' : 'Team Event'}
                      </span>
                      <span className={`event-impact ${eventType.isPositive ? 'positive' : 'negative'}`}>
                        {eventType.isPositive ? 'Positive' : 'Negative'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="event-type-controls">
                  <div className="sort-controls">
                    <button 
                      onClick={() => updateSortOrder(eventType, eventType.sortOrder - 1)}
                      disabled={index === 0}
                      className="sort-btn"
                      title="Move up"
                    >
                      ↑
                    </button>
                    <span className="sort-order">{eventType.sortOrder}</span>
                    <button 
                      onClick={() => updateSortOrder(eventType, eventType.sortOrder + 1)}
                      disabled={index === eventTypes.length - 1}
                      className="sort-btn"
                      title="Move down"
                    >
                      ↓
                    </button>
                  </div>
                  
                  <div className="action-controls">
                    <button 
                      onClick={() => handleToggleActive(eventType)}
                      className={`toggle-active-btn ${eventType.isActive ? 'active' : 'inactive'}`}
                    >
                      {eventType.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button 
                      onClick={() => handleEdit(eventType)}
                      className="edit-btn"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(eventType)}
                      className="delete-btn"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="modal-overlay">
          <div className="event-type-form-modal">
            <div className="form-header">
              <h3>{editingEventType ? 'Edit Event Type' : 'Add New Event Type'}</h3>
              <button onClick={resetForm} className="close-btn">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="event-type-form">
              <div className="form-group">
                <label htmlFor="name">Name *</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Goal, Assist, Tackle"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="icon">Icon</label>
                <div className="icon-selection">
                  <input
                    type="text"
                    id="icon"
                    value={formData.icon}
                    onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                    placeholder="Emoji or symbol"
                  />
                  <div className="common-icons">
                    {commonIcons.map(icon => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, icon }))}
                        className={`icon-btn ${formData.icon === icon ? 'selected' : ''}`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="color">Color</label>
                <div className="color-selection">
                  <input
                    type="color"
                    id="color"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  />
                  <div className="common-colors">
                    {commonColors.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, color }))}
                        className={`color-btn ${formData.color === color ? 'selected' : ''}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="sortOrder">Sort Order</label>
                <input
                  type="number"
                  id="sortOrder"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 1 }))}
                  min="1"
                />
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.requiresPlayer}
                    onChange={(e) => setFormData(prev => ({ ...prev, requiresPlayer: e.target.checked }))}
                  />
                  <span>Requires Player Selection</span>
                  <small>If unchecked, this will be recorded as a team event</small>
                </label>
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isPositive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPositive: e.target.checked }))}
                  />
                  <span>Positive Event</span>
                  <small>Positive events (goals, assists) vs negative events (cards, fouls)</small>
                </label>
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                  />
                  <span>Active</span>
                  <small>Only active event types appear during matches</small>
                </label>
              </div>

              <div className="form-actions">
                <button type="button" onClick={resetForm} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="primary">
                  {loading ? 'Saving...' : (editingEventType ? 'Update Event Type' : 'Create Event Type')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventTypeManager;