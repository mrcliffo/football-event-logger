import React, { useState, useEffect } from 'react';
import { Match, Player, EventType, MatchEvent, MatchPeriod } from '../../types';
import { playerService, eventTypeService, matchEventService, matchPeriodService, matchService } from '../../database/services';
import { useAuth } from '../../contexts/AuthContext';

interface MobileEventLoggerProps {
  match: Match;
  onMatchUpdate: () => void;
}

const MobileEventLogger: React.FC<MobileEventLoggerProps> = ({ match, onMatchUpdate }) => {
  const { user } = useAuth();
  const [players, setPlayers] = useState<Player[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [recentEvents, setRecentEvents] = useState<MatchEvent[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<MatchPeriod | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  // Two-step event logging state
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(null);
  const [showPlayerSelection, setShowPlayerSelection] = useState(false);

  useEffect(() => {
    loadData();
    loadCurrentPeriod();
    loadRecentEvents();
  }, [match.id]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && currentPeriod) {
      interval = setInterval(() => {
        // Increment from total elapsed time
        setElapsedTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, currentPeriod]);

  const loadData = async () => {
    if (!match.teamId) return;
    try {
      // Ensure existing teams have default event types
      await eventTypeService.createDefaultEventTypesForExistingTeams();
      
      const [teamPlayers, teamEventTypes] = await Promise.all([
        playerService.getByTeam(match.teamId),
        eventTypeService.getByTeam(match.teamId)
      ]);
      setPlayers(teamPlayers);
      setEventTypes(teamEventTypes.filter(et => et.isActive));
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadCurrentPeriod = async () => {
    if (!match.id) return;
    try {
      const period = await matchPeriodService.getCurrentPeriod(match.id);
      setCurrentPeriod(period || null);
      
      if (period && period.isActive) {
        setIsTimerRunning(true);
        // Calculate elapsed time for current period + total from previous periods
        if (period.startTime) {
          const now = new Date();
          const currentPeriodElapsed = Math.floor((now.getTime() - period.startTime.getTime()) / 1000);
          const totalElapsed = (match.totalElapsedTime || 0) + currentPeriodElapsed;
          setElapsedTime(totalElapsed);
        }
      } else {
        setIsTimerRunning(false);
        // Show total elapsed time even when not running
        setElapsedTime(match.totalElapsedTime || 0);
      }
    } catch (error) {
      console.error('Error loading current period:', error);
    }
  };

  const loadRecentEvents = async () => {
    if (!match.id) return;
    try {
      const events = await matchEventService.getByMatch(match.id);
      setRecentEvents(events.slice(-5)); // Last 5 events
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const handlePeriodAction = async () => {
    if (!match.id) return;
    
    const nextAction = getNextAction();
    if (!nextAction) return;
    
    try {
      if (nextAction.action === 'start') {
        // Start the specified period
        await matchPeriodService.startPeriod(match.id, nextAction.periodNumber);
        
        // Update match status
        if (nextAction.periodNumber === 1) {
          await matchService.update(match.id, { 
            isStarted: true, 
            currentPeriod: nextAction.periodNumber 
          });
        } else {
          await matchService.update(match.id, { 
            currentPeriod: nextAction.periodNumber 
          });
        }
      } else if (nextAction.action === 'end') {
        // End the current period
        await matchPeriodService.endPeriod(match.id, nextAction.periodNumber);
        
        // Update match with accumulated elapsed time
        const isMatchComplete = nextAction.periodNumber >= match.periods;
        await matchService.update(match.id, { 
          totalElapsedTime: elapsedTime,
          isCompleted: isMatchComplete
        });
      }
      
      await loadCurrentPeriod();
      onMatchUpdate();
    } catch (error) {
      console.error('Error with period action:', error);
    }
  };

  const handleEventTypeSelection = (eventType: EventType) => {
    setSelectedEventType(eventType);
    if (eventType.requiresPlayer) {
      setShowPlayerSelection(true);
    } else {
      // Record team event immediately
      recordEvent(eventType, null);
    }
  };

  const handlePlayerSelection = (player: Player) => {
    if (selectedEventType) {
      recordEvent(selectedEventType, player);
    }
  };

  const recordEvent = async (eventType: EventType, player: Player | null) => {
    if (!match.id || !currentPeriod || !eventType.id) return;
    
    try {
      const newEvent: Omit<MatchEvent, 'id'> = {
        matchId: match.id,
        eventTypeId: eventType.id,
        playerId: player?.id,
        periodNumber: currentPeriod.periodNumber,
        timestamp: elapsedTime,
        createdAt: new Date(),
        syncStatus: 'pending'
      };
      
      await matchEventService.create(newEvent);
      
      // Reset selection state
      setSelectedEventType(null);
      setShowPlayerSelection(false);
      
      // Reload recent events
      await loadRecentEvents();
      
    } catch (error) {
      console.error('Error recording event:', error);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getPeriodLabel = (periodNum: number): string => {
    if (match.periods === 2) return periodNum === 1 ? '1st Half' : '2nd Half';
    if (match.periods === 4) return `Quarter ${periodNum}`;
    return `Period ${periodNum}`;
  };

  const getNextAction = () => {
    // If no current period, start period 1
    if (!currentPeriod) {
      return { action: 'start', periodNumber: 1, label: 'Start Match' };
    }
    
    // If current period is active, end it
    if (currentPeriod.isActive) {
      return { action: 'end', periodNumber: currentPeriod.periodNumber, label: `End ${getPeriodLabel(currentPeriod.periodNumber)}` };
    }
    
    // If current period ended and there are more periods, start next
    if (currentPeriod.periodNumber < match.periods) {
      const nextPeriod = currentPeriod.periodNumber + 1;
      return { action: 'start', periodNumber: nextPeriod, label: `Start ${getPeriodLabel(nextPeriod)}` };
    }
    
    // All periods complete
    return null;
  };

  if (user?.role !== 'coach') {
    return (
      <div className="mobile-event-logger unauthorized">
        <p>Only coaches can log events during matches.</p>
      </div>
    );
  }

  return (
    <div className="mobile-event-logger">
      {/* Match Status & Timer */}
      <div className="match-status">
        <div className="match-info">
          <h3>{match.opponent}</h3>
          <div className="period-info">
            {currentPeriod ? (
              <>
                <span className="period-label">{getPeriodLabel(currentPeriod.periodNumber)}</span>
                <span className="timer">{formatTime(elapsedTime)}</span>
              </>
            ) : (
              <span className="status">Match Not Started</span>
            )}
          </div>
        </div>
      </div>

      {/* Period Controls */}
      <div className="period-controls">
        {(() => {
          const nextAction = getNextAction();
          if (!nextAction) {
            return (
              <div className="match-complete">
                <span className="completion-message">Match Complete</span>
              </div>
            );
          }
          
          return (
            <button 
              className={`period-btn ${nextAction.action}`}
              onClick={handlePeriodAction}
            >
              {nextAction.label}
            </button>
          );
        })()}
      </div>

      {/* Event Type Selection */}
      {currentPeriod && currentPeriod.isActive && !showPlayerSelection && (
        <div className="event-types-grid">
          <h4>Select Event Type</h4>
          <div className="event-buttons">
            {eventTypes.map((eventType) => (
              <button
                key={eventType.id}
                className={`event-btn ${eventType.isPositive ? 'positive' : 'negative'}`}
                style={{ backgroundColor: eventType.color }}
                onClick={() => handleEventTypeSelection(eventType)}
              >
                <span className="event-icon">{eventType.icon}</span>
                <span className="event-name">{eventType.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Player Selection */}
      {showPlayerSelection && selectedEventType && (
        <div className="player-selection">
          <div className="selection-header">
            <h4>Select Player for {selectedEventType.name}</h4>
            <button 
              className="cancel-btn"
              onClick={() => {
                setShowPlayerSelection(false);
                setSelectedEventType(null);
              }}
            >
              Cancel
            </button>
          </div>
          <div className="players-grid">
            {players.map((player) => (
              <button
                key={player.id}
                className="player-btn"
                onClick={() => handlePlayerSelection(player)}
              >
                <span className="player-number">#{player.shirtNumber || '?'}</span>
                <span className="player-name">{player.firstName} {player.lastName}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recent Events */}
      <div className="recent-events">
        <h4>Recent Events</h4>
        {recentEvents.length === 0 ? (
          <p>No events recorded yet</p>
        ) : (
          <div className="events-list">
            {recentEvents.slice().reverse().map((event) => (
              <div key={event.id} className="event-item">
                <div className="event-time">{formatTime(event.timestamp)}</div>
                <div className="event-details">
                  <span className="event-type">Event {event.eventTypeId}</span>
                  {event.playerId && (
                    <span className="player">Player {event.playerId}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileEventLogger;