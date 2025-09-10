import { db } from './db';
import {
  User,
  Team,
  Player,
  Match,
  MatchEvent,
  MatchPeriod,
  EventType,
  Season,
  PlayerStats,
  Award,
  PlayerStatsSummary,
  TeamStatsSummary
} from '../types';

// User Services
export const userService = {
  async create(user: Omit<User, 'id'>): Promise<number> {
    return await db.users.add(user);
  },

  async getById(id: number): Promise<User | undefined> {
    return await db.users.get(id);
  },

  async getByEmail(email: string): Promise<User | undefined> {
    return await db.users.where('email').equals(email).first();
  },

  async getAllByRole(role: User['role']): Promise<User[]> {
    return await db.users.where('role').equals(role).toArray();
  },

  async update(id: number, changes: Partial<User>): Promise<number> {
    return await db.users.update(id, changes);
  },

  async delete(id: number): Promise<void> {
    await db.users.delete(id);
  }
};

// Team Services
export const teamService = {
  async create(team: Omit<Team, 'id'>): Promise<number> {
    const teamId = await db.teams.add(team);
    // Automatically create default event types for the new team
    await eventTypeService.createDefaultEventTypes(teamId);
    return teamId;
  },

  async getById(id: number): Promise<Team | undefined> {
    return await db.teams.get(id);
  },

  async getAllActive(): Promise<Team[]> {
    return await db.teams.filter(team => team.isActive === true).toArray();
  },

  async getByCoach(coachId: number): Promise<Team[]> {
    return await db.teams.where('coachId').equals(coachId).toArray();
  },

  async update(id: number, changes: Partial<Team>): Promise<number> {
    return await db.teams.update(id, changes);
  },

  async delete(id: number): Promise<void> {
    // Also need to handle cascading deletes for players, matches, etc.
    await db.teams.delete(id);
  },

  async getAll(): Promise<Team[]> {
    return await db.teams.toArray();
  }
};

// Player Services
export const playerService = {
  async create(player: Omit<Player, 'id'>): Promise<number> {
    return await db.players.add(player);
  },

  async getById(id: number): Promise<Player | undefined> {
    return await db.players.get(id);
  },

  async getByTeam(teamId: number): Promise<Player[]> {
    return await db.players.where('teamId').equals(teamId).and(p => p.isActive).toArray();
  },

  async getByParent(parentId: number): Promise<Player[]> {
    return await db.players.where('parentIds').equals(parentId).toArray();
  },

  async update(id: number, changes: Partial<Player>): Promise<number> {
    return await db.players.update(id, changes);
  },

  async delete(id: number): Promise<void> {
    await db.players.delete(id);
  },

  async getAll(): Promise<Player[]> {
    return await db.players.toArray();
  },

  async bulkCreate(players: Omit<Player, 'id'>[]): Promise<number[]> {
    const ids: number[] = [];
    for (const player of players) {
      const id = await this.create(player);
      ids.push(id);
    }
    return ids;
  }
};

// Match Services
export const matchService = {
  async create(match: Omit<Match, 'id'>): Promise<number> {
    return await db.matches.add(match);
  },

  async getById(id: number): Promise<Match | undefined> {
    return await db.matches.get(id);
  },

  async getByTeam(teamId: number): Promise<Match[]> {
    return await db.matches.where('teamId').equals(teamId).reverse().sortBy('date');
  },

  async getUpcoming(teamId: number): Promise<Match[]> {
    const now = new Date();
    return await db.matches
      .where('teamId').equals(teamId)
      .and(m => m.date > now && !m.isCompleted)
      .sortBy('date');
  },

  async getRecent(teamId: number, limit: number = 5): Promise<Match[]> {
    const now = new Date();
    return await db.matches
      .where('teamId').equals(teamId)
      .and(m => m.date <= now)
      .reverse()
      .sortBy('date')
      .then(matches => matches.slice(0, limit));
  },

  async update(id: number, changes: Partial<Match>): Promise<number> {
    return await db.matches.update(id, changes);
  },

  async delete(id: number): Promise<void> {
    // Also delete associated match events
    const events = await matchEventService.getByMatch(id);
    for (const event of events) {
      if (event.id) {
        await matchEventService.delete(event.id);
      }
    }
    await db.matches.delete(id);
  },

  async getAllByDateRange(startDate: Date, endDate: Date): Promise<Match[]> {
    return await db.matches
      .where('date')
      .between(startDate, endDate)
      .sortBy('date');
  }
};

// Match Event Services
export const matchEventService = {
  async create(event: Omit<MatchEvent, 'id'>): Promise<number> {
    const eventId = await db.matchEvents.add(event);
    
    // Update player stats when events are added
    if (event.playerId) {
      await updatePlayerStatsForEvent(event, 'add');
    }
    
    return eventId;
  },

  async getByMatch(matchId: number): Promise<MatchEvent[]> {
    return await db.matchEvents
      .where('matchId').equals(matchId)
      .sortBy('timestamp');
  },

  async getPendingSync(): Promise<MatchEvent[]> {
    return await db.matchEvents.where('syncStatus').equals('pending').toArray();
  },

  async updateSyncStatus(id: number, status: MatchEvent['syncStatus']): Promise<number> {
    return await db.matchEvents.update(id, { syncStatus: status });
  },

  async delete(id: number): Promise<void> {
    const event = await db.matchEvents.get(id);
    if (event && event.playerId) {
      await updatePlayerStatsForEvent(event, 'remove');
    }
    await db.matchEvents.delete(id);
  }
};

// Player Stats Services
export const playerStatsService = {
  async getByPlayer(playerId: number, seasonId: number): Promise<PlayerStats | undefined> {
    return await db.playerStats
      .where('[playerId+seasonId]')
      .equals([playerId, seasonId])
      .first();
  },

  async getByTeamAndSeason(teamId: number, seasonId: number): Promise<PlayerStatsSummary[]> {
    const stats = await db.playerStats
      .where('[teamId+seasonId]')
      .equals([teamId, seasonId])
      .toArray();

    const enrichedStats: PlayerStatsSummary[] = [];
    for (const stat of stats) {
      const player = await db.players.get(stat.playerId);
      const team = await db.teams.get(stat.teamId);
      if (player && team) {
        enrichedStats.push({
          ...stat,
          playerName: `${player.firstName} ${player.lastName}`,
          teamName: team.name
        });
      }
    }

    return enrichedStats.sort((a, b) => b.goals - a.goals);
  },

  async update(playerId: number, seasonId: number, teamId: number, changes: Partial<PlayerStats>): Promise<number> {
    const existing = await this.getByPlayer(playerId, seasonId);
    
    if (existing && existing.id) {
      return await db.playerStats.update(existing.id, { ...changes, lastUpdated: new Date() });
    } else {
      return await db.playerStats.add({
        playerId,
        seasonId,
        teamId,
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        matchesPlayed: 0,
        lastUpdated: new Date(),
        ...changes
      });
    }
  }
};

// Season Services
export const seasonService = {
  async create(season: Omit<Season, 'id'>): Promise<number> {
    // Set other seasons to inactive if this one is active
    if (season.isActive) {
      await db.seasons.filter(season => season.isActive === true).modify({ isActive: false });
    }
    return await db.seasons.add(season);
  },

  async getCurrent(): Promise<Season | undefined> {
    return await db.seasons.filter(season => season.isActive === true).first();
  },

  async getAll(): Promise<Season[]> {
    return await db.seasons.orderBy('startDate').reverse().toArray();
  },

  async update(id: number, changes: Partial<Season>): Promise<number> {
    // Set other seasons to inactive if this one is being set to active
    if (changes.isActive) {
      await db.seasons.filter(season => season.isActive === true).modify({ isActive: false });
    }
    return await db.seasons.update(id, changes);
  }
};

// Award Services
export const awardService = {
  async generateSeasonAwards(seasonId: number, teamId: number): Promise<Award[]> {
    const stats = await playerStatsService.getByTeamAndSeason(teamId, seasonId);
    const awards: Award[] = [];

    if (stats.length === 0) return awards;

    // Top Scorer
    const topScorer = stats.reduce((max, current) => 
      current.goals > max.goals ? current : max
    );
    if (topScorer.goals > 0) {
      awards.push({
        seasonId,
        teamId,
        playerId: topScorer.playerId,
        awardType: 'top_scorer',
        value: topScorer.goals,
        createdAt: new Date()
      });
    }

    // Most Assists
    const mostAssists = stats.reduce((max, current) => 
      current.assists > max.assists ? current : max
    );
    if (mostAssists.assists > 0 && mostAssists.playerId !== topScorer.playerId) {
      awards.push({
        seasonId,
        teamId,
        playerId: mostAssists.playerId,
        awardType: 'most_assists',
        value: mostAssists.assists,
        createdAt: new Date()
      });
    }

    // Save awards to database
    for (const award of awards) {
      await db.awards.add(award);
    }

    return awards;
  },

  async getByTeamAndSeason(teamId: number, seasonId: number): Promise<Award[]> {
    return await db.awards
      .where('[teamId+seasonId]')
      .equals([teamId, seasonId])
      .toArray();
  }
};

// Helper function to update player stats when events are added/removed
async function updatePlayerStatsForEvent(event: MatchEvent, action: 'add' | 'remove'): Promise<void> {
  if (!event.playerId) return;

  const match = await db.matches.get(event.matchId);
  if (!match) return;

  const player = await db.players.get(event.playerId);
  if (!player) return;

  const season = await seasonService.getCurrent();
  if (!season || !season.id) return;

  // Get the event type to determine the stat to update
  const eventType = await eventTypeService.getById(event.eventTypeId);
  if (!eventType) return;

  const multiplier = action === 'add' ? 1 : -1;
  const updates: Partial<PlayerStats> = {};

  // Map event type names to stats - this assumes standard naming
  const eventTypeName = eventType.name.toLowerCase();
  if (eventTypeName.includes('goal')) {
    updates.goals = multiplier;
  } else if (eventTypeName.includes('assist')) {
    updates.assists = multiplier;
  } else if (eventTypeName.includes('yellow')) {
    updates.yellowCards = multiplier;
  } else if (eventTypeName.includes('red')) {
    updates.redCards = multiplier;
  }

  if (Object.keys(updates).length > 0) {
    const currentStats = await playerStatsService.getByPlayer(event.playerId, season.id);
    const newStats = { ...updates };
    
    if (currentStats) {
      newStats.goals = (currentStats.goals || 0) + (updates.goals || 0);
      newStats.assists = (currentStats.assists || 0) + (updates.assists || 0);
      newStats.yellowCards = (currentStats.yellowCards || 0) + (updates.yellowCards || 0);
      newStats.redCards = (currentStats.redCards || 0) + (updates.redCards || 0);
    }

    await playerStatsService.update(event.playerId, season.id, player.teamId, newStats);
  }
}

// Match Period Services
export const matchPeriodService = {
  async create(period: Omit<MatchPeriod, 'id'>): Promise<number> {
    return await db.matchPeriods.add(period);
  },

  async getByMatch(matchId: number): Promise<MatchPeriod[]> {
    return await db.matchPeriods
      .where('matchId').equals(matchId)
      .sortBy('periodNumber');
  },

  async getCurrentPeriod(matchId: number): Promise<MatchPeriod | undefined> {
    // Return the most recent period (active or completed) to track progression
    return await db.matchPeriods
      .where('matchId').equals(matchId)
      .reverse()
      .sortBy('periodNumber')
      .then(periods => periods[0]);
  },

  async update(id: number, changes: Partial<MatchPeriod>): Promise<number> {
    return await db.matchPeriods.update(id, changes);
  },

  async startPeriod(matchId: number, periodNumber: number): Promise<void> {
    // End any currently active periods
    const activePeriods = await db.matchPeriods
      .where('matchId').equals(matchId)
      .and(p => p.isActive).toArray();
    
    for (const period of activePeriods) {
      if (period.id) {
        await this.update(period.id, { 
          isActive: false, 
          endTime: new Date() 
        });
      }
    }

    // Start the new period
    await this.create({
      matchId,
      periodNumber,
      startTime: new Date(),
      elapsedTime: 0,
      isActive: true,
      isCompleted: false
    });
  },

  async endPeriod(matchId: number, periodNumber: number): Promise<void> {
    const period = await db.matchPeriods
      .where('matchId').equals(matchId)
      .and(p => p.periodNumber === periodNumber && p.isActive)
      .first();

    if (period && period.id && period.startTime) {
      const now = new Date();
      const elapsedTime = Math.floor((now.getTime() - period.startTime.getTime()) / 1000);
      
      await this.update(period.id, {
        isActive: false,
        isCompleted: true,
        endTime: now,
        elapsedTime
      });
    }
  }
};

// Event Type Services
export const eventTypeService = {
  async create(eventType: Omit<EventType, 'id'>): Promise<number> {
    return await db.eventTypes.add(eventType);
  },

  async getByTeam(teamId: number): Promise<EventType[]> {
    return await db.eventTypes
      .where('teamId').equals(teamId)
      .sortBy('sortOrder');
  },

  async getById(id: number): Promise<EventType | undefined> {
    return await db.eventTypes.get(id);
  },

  async update(id: number, changes: Partial<EventType>): Promise<number> {
    return await db.eventTypes.update(id, changes);
  },

  async delete(id: number): Promise<void> {
    await db.eventTypes.delete(id);
  },

  async createDefaultEventTypesForExistingTeams(): Promise<void> {
    // Get all teams
    const teams = await db.teams.toArray();
    
    for (const team of teams) {
      if (team.id) {
        // Check if team already has event types
        const existingTypes = await this.getByTeam(team.id);
        if (existingTypes.length === 0) {
          await this.createDefaultEventTypes(team.id);
        }
      }
    }
  },

  async createDefaultEventTypes(teamId: number): Promise<void> {
    const defaultEventTypes: Omit<EventType, 'id'>[] = [
      {
        teamId,
        name: 'Goal',
        icon: '⚽',
        color: '#4caf50',
        requiresPlayer: true,
        isPositive: true,
        isActive: true,
        sortOrder: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        teamId,
        name: 'Assist',
        icon: '🎯',
        color: '#2196f3',
        requiresPlayer: true,
        isPositive: true,
        isActive: true,
        sortOrder: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        teamId,
        name: 'Tackle',
        icon: '🛡️',
        color: '#ff9800',
        requiresPlayer: true,
        isPositive: true,
        isActive: true,
        sortOrder: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        teamId,
        name: 'Save',
        icon: '🥅',
        color: '#9c27b0',
        requiresPlayer: true,
        isPositive: true,
        isActive: true,
        sortOrder: 4,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        teamId,
        name: 'Yellow Card',
        icon: '🟨',
        color: '#ffeb3b',
        requiresPlayer: true,
        isPositive: false,
        isActive: false, // Disabled by default for simplicity
        sortOrder: 5,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        teamId,
        name: 'Red Card',
        icon: '🟥',
        color: '#f44336',
        requiresPlayer: true,
        isPositive: false,
        isActive: false, // Disabled by default for simplicity
        sortOrder: 6,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const eventType of defaultEventTypes) {
      await this.create(eventType);
    }
  }
};