import React, { useState, useEffect } from 'react';
import { Match, MatchEvent, Player } from '../../types';
import { matchEventService, playerService } from '../../database/services';
import { useAuth } from '../../contexts/AuthContext';

interface EventLoggerProps {
  match: Match;
  onEventAdded: () => void;
}

const EventLogger: React.FC<EventLoggerProps> = ({ match, onEventAdded }) => {
  const { user } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [events, setEvents] = useState<MatchEvent[]>([]);
  const [eventForm, setEventForm] = useState({
    type: '',
    minute: '',
    playerId: '',
    description: ''
  });

  const eventTypes = [
    { value: 'goal', label: 'Goal' },
    { value: 'assist', label: 'Assist' },
    { value: 'yellow_card', label: 'Yellow Card' },
    { value: 'red_card', label: 'Red Card' },
    { value: 'substitution_on', label: 'Sub On' },
    { value: 'substitution_off', label: 'Sub Off' },
    { value: 'own_goal', label: 'Own Goal' }
  ];

  useEffect(() => {
    if (match.teamId) {
      loadPlayers();
      loadEvents();
    }
  }, [match.teamId, match.id]);

  const loadPlayers = async () => {
    if (!match.teamId) return;
    try {
      const teamPlayers = await playerService.getByTeam(match.teamId);
      setPlayers(teamPlayers);
    } catch (error) {
      console.error('Error loading players:', error);
    }
  };

  const loadEvents = async () => {
    if (!match.id) return;
    try {
      const matchEvents = await matchEventService.getByMatch(match.id);
      setEvents(matchEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!match.id || !user?.id) return;

    try {
      const newEvent: Omit<MatchEvent, 'id'> = {
        matchId: match.id,
        eventType: eventForm.type as any,
        minute: parseInt(eventForm.minute),
        playerId: eventForm.playerId ? parseInt(eventForm.playerId) : undefined,
        notes: eventForm.description || undefined,
        createdAt: new Date(),
        syncStatus: 'pending' as const
      };

      await matchEventService.create(newEvent);
      
      // Reset form
      setEventForm({
        type: '',
        minute: '',
        playerId: '',
        description: ''
      });

      await loadEvents();
      onEventAdded();
    } catch (error) {
      console.error('Error adding event:', error);
      alert('Failed to add event. Please try again.');
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;

    try {
      await matchEventService.delete(eventId);
      await loadEvents();
      onEventAdded();
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event. Please try again.');
    }
  };

  const getPlayerName = (playerId?: number) => {
    if (!playerId) return 'Team Event';
    const player = players.find(p => p.id === playerId);
    return player ? `${player.firstName} ${player.lastName}` : 'Unknown Player';
  };

  const formatEventTime = (minute: number) => {
    return `${minute}'`;
  };

  if (match.isCompleted && events.length === 0) {
    return (
      <div className="event-logger">
        <div className="match-summary">
          <h4>Match Summary</h4>
          <p>No events were logged for this match.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="event-logger">
      <div className="match-info">
        <div className="current-score">
          <h4>Current Score</h4>
          <div className="score-display">
            {match.teamScore !== undefined && match.opponentScore !== undefined ? (
              <span className="score">{match.teamScore} - {match.opponentScore}</span>
            ) : (
              <span className="score">0 - 0</span>
            )}
          </div>
        </div>
      </div>

      {!match.isCompleted && (
        <div className="event-form">
          <h4>Log Event</h4>
          <form onSubmit={handleEventSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Event Type</label>
                <select
                  value={eventForm.type}
                  onChange={(e) => setEventForm(prev => ({ ...prev, type: e.target.value }))}
                  required
                >
                  <option value="">Select event type</option>
                  {eventTypes.map(eventType => (
                    <option key={eventType.value} value={eventType.value}>{eventType.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Minute</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={eventForm.minute}
                  onChange={(e) => setEventForm(prev => ({ ...prev, minute: e.target.value }))}
                  placeholder="45"
                  required
                />
              </div>

              <div className="form-group">
                <label>Player (Optional)</label>
                <select
                  value={eventForm.playerId}
                  onChange={(e) => setEventForm(prev => ({ ...prev, playerId: e.target.value }))}
                >
                  <option value="">Team event</option>
                  {players.map(player => (
                    <option key={player.id} value={player.id}>
                      {player.firstName} {player.lastName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Description (Optional)</label>
              <input
                type="text"
                value={eventForm.description}
                onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Additional details..."
              />
            </div>

            <button type="submit" className="add-event-btn">
              Log Event
            </button>
          </form>
        </div>
      )}

      <div className="events-timeline">
        <h4>Match Events</h4>
        {events.length === 0 ? (
          <p className="no-events">No events logged yet.</p>
        ) : (
          <div className="events-list">
            {events
              .sort((a, b) => b.minute - a.minute)
              .map(event => (
                <div key={event.id} className={`event-item event-${event.eventType.toLowerCase().replace(' ', '-')}`}>
                  <div className="event-content">
                    <div className="event-header">
                      <span className="event-time">{formatEventTime(event.minute)}</span>
                      <span className="event-type">{event.eventType}</span>
                      {!match.isCompleted && user?.role === 'coach' && (
                        <button
                          className="delete-event-btn"
                          onClick={() => handleDeleteEvent(event.id!)}
                          title="Delete event"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    <div className="event-details">
                      <div className="event-player">{getPlayerName(event.playerId)}</div>
                      {event.notes && (
                        <div className="event-description">{event.notes}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default EventLogger;