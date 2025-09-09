// Database Types for Junior Football Event Logging App

export interface User {
  id?: number;
  email: string;
  password?: string; // Only stored for coaches, hashed
  firstName: string;
  lastName: string;
  role: 'coach' | 'parent' | 'player';
  teamIds: number[]; // Teams they're associated with
  createdAt: Date;
  updatedAt: Date;
}

export interface Team {
  id?: number;
  name: string;
  ageGroup: string; // e.g., "Under 10", "Under 12"
  season: string; // e.g., "2024-2025"
  coachId: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Player {
  id?: number;
  firstName: string;
  lastName: string;
  teamId: number;
  parentIds: number[]; // Associated parent user IDs
  playerUserId?: number; // If player has their own account
  position?: string;
  shirtNumber?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Match {
  id?: number;
  teamId: number;
  opponent: string;
  date: Date;
  venue: 'home' | 'away';
  result?: 'win' | 'loss' | 'draw';
  teamScore?: number;
  opponentScore?: number;
  duration: number; // minutes
  notes?: string;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface MatchEvent {
  id?: number;
  matchId: number;
  playerId?: number; // null for team events
  eventType: 'goal' | 'assist' | 'yellow_card' | 'red_card' | 'substitution_on' | 'substitution_off' | 'own_goal';
  minute: number;
  notes?: string;
  createdAt: Date;
  syncStatus: 'pending' | 'synced' | 'failed';
}

export interface Season {
  id?: number;
  name: string; // e.g., "2024-2025 Season"
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlayerStats {
  id?: number;
  playerId: number;
  seasonId: number;
  teamId: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  matchesPlayed: number;
  lastUpdated: Date;
}

export interface Award {
  id?: number;
  seasonId: number;
  teamId: number;
  playerId: number;
  awardType: 'top_scorer' | 'most_assists' | 'best_player' | 'most_improved' | 'team_player';
  value: number; // goals scored, assists made, etc.
  createdAt: Date;
}

// UI and State Types
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}

export interface MatchEventForm {
  playerId?: number;
  eventType: MatchEvent['eventType'];
  minute: number;
  notes?: string;
}

export interface PlayerStatsSummary extends PlayerStats {
  playerName: string;
  teamName: string;
}

export interface TeamStatsSummary {
  teamId: number;
  teamName: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}