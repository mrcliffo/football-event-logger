import { userService, teamService, playerService, matchService, seasonService, eventTypeService } from './services';
import { User, Team, Player, Match, Season } from '../types';

export const seedDemoData = async (): Promise<void> => {
  try {
    console.log('Seeding demo data...');

    // Check if data already exists
    const existingUsers = await userService.getAllByRole('coach');
    if (existingUsers.length > 0) {
      console.log('Demo data already exists, skipping seed.');
      return;
    }

    // Create demo season
    const currentSeason: Omit<Season, 'id'> = {
      name: '2024-2025 Season',
      startDate: new Date('2024-09-01'),
      endDate: new Date('2025-06-30'),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const seasonId = await seasonService.create(currentSeason);
    console.log('Created demo season');

    // Create demo coach user
    const coachUser: Omit<User, 'id'> = {
      email: 'coach@demo.com',
      password: 'password', // In production, this would be hashed
      firstName: 'John',
      lastName: 'Coach',
      role: 'coach',
      teamIds: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const coachId = await userService.create(coachUser);
    console.log('Created demo coach user');

    // Create demo parent user
    const parentUser: Omit<User, 'id'> = {
      email: 'parent@demo.com',
      password: 'password',
      firstName: 'Sarah',
      lastName: 'Parent',
      role: 'parent',
      teamIds: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const parentId = await userService.create(parentUser);
    console.log('Created demo parent user');

    // Create demo team
    const team: Omit<Team, 'id'> = {
      name: 'Lightning Bolts',
      ageGroup: 'Under 12',
      season: '2024-2025',
      coachId,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const teamId = await teamService.create(team);
    console.log('Created demo team');

    // Update coach to include team
    await userService.update(coachId, { teamIds: [teamId] });

    // Create demo players
    const players: Omit<Player, 'id'>[] = [
      {
        firstName: 'Alex',
        lastName: 'Johnson',
        teamId,
        parentIds: [parentId],
        position: 'Forward',
        shirtNumber: 10,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        firstName: 'Emma',
        lastName: 'Davis',
        teamId,
        parentIds: [parentId],
        position: 'Midfielder',
        shirtNumber: 8,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        firstName: 'Liam',
        lastName: 'Wilson',
        teamId,
        parentIds: [],
        position: 'Defender',
        shirtNumber: 5,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        firstName: 'Sophie',
        lastName: 'Brown',
        teamId,
        parentIds: [],
        position: 'Goalkeeper',
        shirtNumber: 1,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const player of players) {
      await playerService.create(player);
    }
    console.log('Created demo players');

    // Create default event types for the team
    await eventTypeService.createDefaultEventTypes(teamId);
    console.log('Created default event types');

    // Create demo matches
    const matches: Omit<Match, 'id'>[] = [
      {
        teamId,
        opponent: 'Thunder Eagles',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
        venue: 'home',
        periods: 2, // Two halves
        notes: 'League match - important game',
        isCompleted: false,
        isStarted: false,
        currentPeriod: 0,
        totalElapsedTime: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        teamId,
        opponent: 'Storm Tigers',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last week
        venue: 'away',
        result: 'win',
        teamScore: 3,
        opponentScore: 1,
        periods: 2,
        notes: 'Great team performance',
        isCompleted: true,
        isStarted: true,
        currentPeriod: 2,
        totalElapsedTime: 2700, // 45 minutes
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        teamId,
        opponent: 'Fire Foxes',
        date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // Two weeks ago
        venue: 'home',
        result: 'draw',
        teamScore: 2,
        opponentScore: 2,
        periods: 3, // Three periods for variety
        notes: 'Close match, well fought',
        isCompleted: true,
        isStarted: true,
        currentPeriod: 3,
        totalElapsedTime: 3600, // 60 minutes
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    for (const match of matches) {
      await matchService.create(match);
    }
    console.log('Created demo matches');

    console.log('✅ Demo data seeded successfully!');
    console.log('👨‍💼 Coach login: coach@demo.com / password');
    console.log('👨‍👩‍👧‍👦 Parent login: parent@demo.com / password');

  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    throw error;
  }
};

// Auto-seed on first load
let seedPromise: Promise<void> | null = null;

export const ensureDemoData = async (): Promise<void> => {
  if (!seedPromise) {
    seedPromise = seedDemoData();
  }
  return seedPromise;
};