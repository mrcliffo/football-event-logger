import Dexie, { Table } from 'dexie';
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
  Award
} from '../types';

export class FootballEventDatabase extends Dexie {
  users!: Table<User>;
  teams!: Table<Team>;
  players!: Table<Player>;
  matches!: Table<Match>;
  matchEvents!: Table<MatchEvent>;
  matchPeriods!: Table<MatchPeriod>;
  eventTypes!: Table<EventType>;
  seasons!: Table<Season>;
  playerStats!: Table<PlayerStats>;
  awards!: Table<Award>;

  constructor() {
    super('FootballEventDatabase');
    
    this.version(3).stores({
      users: '++id, email, role, *teamIds',
      teams: '++id, name, ageGroup, season, coachId, isActive',
      players: '++id, firstName, lastName, teamId, *parentIds, playerUserId, isActive',
      matches: '++id, teamId, date, opponent, isCompleted, isStarted, currentPeriod, periods',
      matchEvents: '++id, matchId, playerId, eventTypeId, periodNumber, timestamp, syncStatus',
      matchPeriods: '++id, matchId, periodNumber, isActive, isCompleted',
      eventTypes: '++id, teamId, name, isActive, sortOrder',
      seasons: '++id, name, startDate, endDate, isActive',
      playerStats: '++id, playerId, seasonId, teamId',
      awards: '++id, seasonId, teamId, playerId, awardType'
    });

    // Add hooks for automatic timestamp updates
    this.users.hook('creating', (primKey, obj, trans) => {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.users.hook('updating', (modifications) => {
      (modifications as any).updatedAt = new Date();
    });

    this.teams.hook('creating', (primKey, obj, trans) => {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.teams.hook('updating', (modifications) => {
      (modifications as any).updatedAt = new Date();
    });

    this.players.hook('creating', (primKey, obj, trans) => {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.players.hook('updating', (modifications) => {
      (modifications as any).updatedAt = new Date();
    });

    this.matches.hook('creating', (primKey, obj, trans) => {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.matches.hook('updating', (modifications) => {
      (modifications as any).updatedAt = new Date();
    });

    this.matchEvents.hook('creating', (primKey, obj, trans) => {
      obj.createdAt = new Date();
      obj.syncStatus = 'pending';
    });

    this.seasons.hook('creating', (primKey, obj, trans) => {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.seasons.hook('updating', (modifications) => {
      (modifications as any).updatedAt = new Date();
    });

    this.playerStats.hook('updating', (modifications) => {
      (modifications as any).lastUpdated = new Date();
    });

    this.awards.hook('creating', (primKey, obj, trans) => {
      obj.createdAt = new Date();
    });

    this.eventTypes.hook('creating', (primKey, obj, trans) => {
      obj.createdAt = new Date();
      obj.updatedAt = new Date();
    });

    this.eventTypes.hook('updating', (modifications) => {
      (modifications as any).updatedAt = new Date();
    });
  }
}

export const db = new FootballEventDatabase();