import { db } from './db';
import {
  User,
  Team,
  Player,
  Match,
  MatchEvent,
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
    return await db.teams.add(team);
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
      .sortBy('minute');
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

  const multiplier = action === 'add' ? 1 : -1;
  const updates: Partial<PlayerStats> = {};

  switch (event.eventType) {
    case 'goal':
      updates.goals = multiplier;
      break;
    case 'assist':
      updates.assists = multiplier;
      break;
    case 'yellow_card':
      updates.yellowCards = multiplier;
      break;
    case 'red_card':
      updates.redCards = multiplier;
      break;
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