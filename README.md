# ⚽ Football Event Logger

A comprehensive, mobile-first football (soccer) event tracking application designed for coaches, parents, and team management. Built with React, TypeScript, and optimized for sideline use during matches.

## 🏆 Key Features

### Mobile-First Event Logging
- **Touch-optimized interface** designed for quick sideline use during matches
- **Two-step event logging**: Select event type → Select player → Automatic timestamp recording
- **Real-time match timer** with period-based timing system
- **Quick visual feedback** for recorded events
- **Recent events timeline** showing last 5 events with player details

### Flexible Match Management
- **Period-based matches** (configurable: 2 halves, 3 periods, etc.)
- **Start/pause/resume functionality** between periods
- **Automatic time tracking** with total elapsed time calculation
- **Live score updates** during matches
- **Match completion workflow**

### Configurable Event Types
- **Admin interface** for coaches to customize event types
- **Visual customization**: Custom icons (emoji support) and colors
- **Flexible configuration**: Player-specific vs team events
- **Active/inactive toggles** for different age groups or preferences
- **Sort order management** for optimal match-day workflow
- **Default event types**: Goal, Assist, Tackle, Save, Yellow Card, Red Card

### Comprehensive Team Management
- **Team roster management** with player profiles
- **Position tracking** and shirt numbers
- **Parent-player relationships** for family access
- **Season-based organization**
- **Role-based access control** (Coach vs Parent permissions)

### Statistics & Analytics
- **Player performance tracking** (goals, assists, cards, etc.)
- **Season-long statistics** with automatic aggregation
- **Top performer awards** (Top Scorer, Most Assists)
- **Team statistics dashboard**

### Offline-First Architecture
- **IndexedDB storage** for reliable offline functionality
- **Background sync** when internet connection is available
- **Graceful fallback** for offline-only usage
- **JWT authentication** with offline mode support

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation
```bash
# Clone the repository
git clone <repository-url>
cd football-event-logger

# Install dependencies
npm install

# Start development server
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

### Demo Data
The application includes automatic demo data seeding:
- **Coach login**: `coach@demo.com` / `password`
- **Parent login**: `parent@demo.com` / `password`
- Pre-configured team "Lightning Bolts" with players and sample matches

## 📱 Mobile Usage (Recommended Workflow)

### For Coaches - Match Day Workflow:

1. **Pre-Match Setup**:
   - Configure event types in Team Management
   - Verify player roster
   - Create match with appropriate periods (2 halves, 3 periods, etc.)

2. **During Match**:
   - Open match in Mobile Event Logger
   - Start first period when match begins
   - Log events with two taps: Event Type → Player
   - Timer runs automatically
   - Pause between periods, resume for next period

3. **Post-Match**:
   - Complete match when all periods finished
   - View statistics and player performance
   - Data syncs automatically when online

### For Parents:
- View child's statistics and match history
- Track performance across seasons
- Access read-only team information

## 🛠 Technical Architecture

### Frontend
- **React 18** with TypeScript
- **Responsive CSS** with mobile-first design
- **Context API** for state management
- **Component-based architecture**

### Data Storage
- **Dexie.js** (IndexedDB wrapper) for offline-first data persistence
- **Relational data model** with proper foreign key relationships
- **Automatic timestamping** and audit trails

### Database Schema
- **Users**: Coach and parent accounts with role-based access
- **Teams**: Season-based team organization
- **Players**: Full player profiles with positions and relationships
- **Matches**: Flexible period-based match structure
- **MatchEvents**: Timestamped event logging with player associations
- **MatchPeriods**: Period management with start/stop times
- **EventTypes**: Configurable event types per team
- **PlayerStats**: Aggregated statistics per season
- **Awards**: Auto-generated season awards

### Key Design Decisions
- **Period-based timing** instead of fixed match duration for flexibility
- **Two-step event logging** optimized for quick sideline use
- **Offline-first** architecture for reliable field conditions
- **Touch-optimized UI** with large buttons and clear visual feedback

## 📋 Available Scripts

### `npm start`
Runs the app in development mode at [http://localhost:3000](http://localhost:3000)

### `npm test`
Launches the test runner in interactive watch mode

### `npm run build`
Builds the app for production to the `build` folder

### `npm run eject`
**One-way operation** - copies all configuration files for full customization

## 🏗 Project Structure

```
src/
├── components/
│   ├── admin/           # Admin interfaces (Event Type Manager)
│   ├── auth/           # Authentication components
│   ├── dashboard/      # Dashboard and statistics
│   ├── match/          # Match management and mobile logger
│   ├── shared/         # Reusable components
│   └── teams/          # Team and player management
├── contexts/           # React contexts (Auth, etc.)
├── database/          # Database layer (Dexie, services)
├── services/          # External services (API, sync)
├── types/             # TypeScript type definitions
└── utils/             # Utility functions
```

## 🎯 Core Components

### MobileEventLogger
The heart of the match-day experience:
- Period-based timer with pause/resume
- Touch-optimized event type grid
- Player selection interface
- Real-time event timeline
- Score tracking

### EventTypeManager
Admin interface for event customization:
- Create/edit/delete event types
- Visual customization (icons, colors)
- Player requirement configuration
- Sort order management
- Active/inactive toggles

### TeamManagement
Comprehensive team administration:
- Player roster management
- Team settings and configuration
- Integration with event type management
- Role-based access control

## 🌟 Mobile Optimization Features

- **Large touch targets** (minimum 44px) for easy finger tapping
- **High contrast colors** for outdoor visibility
- **Minimal scrolling** with efficient screen usage
- **Quick visual feedback** for all interactions
- **Offline reliability** for poor network conditions
- **Battery-conscious design** with efficient rendering

## 🔐 Security & Privacy

- **Role-based access control** (Coach vs Parent permissions)
- **Local data storage** with no external data sharing
- **JWT authentication** with secure token management
- **Parent-child data relationships** for family privacy

## 🎨 Customization

### Event Types
Coaches can fully customize event types:
- Add sport-specific events (e.g., "Corner Kick", "Free Kick")
- Customize for different age groups
- Set positive/negative event classifications
- Choose visual appearance (colors, icons)

### Match Structure
- Configure number of periods per match
- Set custom period lengths
- Adapt to different league rules and formats

## 📈 Statistics Tracking

The app automatically tracks:
- **Goals and assists** per player per season
- **Cards and disciplinary events**
- **Match participation** and playing time
- **Team performance** across matches
- **Seasonal awards** and recognition

## 🔄 Data Management

### Sync Capabilities
- **Background synchronization** when online
- **Conflict resolution** for concurrent edits  
- **Offline queue** for pending changes
- **Manual sync triggers** for immediate updates

### Export & Backup
- Data stored locally in browser's IndexedDB
- Future: Export capabilities for season reports
- Future: Team data sharing between devices

## 📋 Recent Updates & Bug Fixes

### v1.2.0 - Period Management & Event Logging Improvements

#### Fixed Critical Issues:
- **Period Progression Logic**: Fixed bug where ending period 1 incorrectly returned to "start match" instead of progressing to "start period 2"
- **Timer Continuity**: Timer now properly continues from previous period's end time instead of resetting to 00:00
- **Default Event Types**: Teams now automatically get default event types (Goal ⚽, Assist 🎯, Tackle 💪, etc.) when created
- **Match Creation**: Resolved "disabled for mobile first redesign" message that prevented match creation

#### Technical Improvements:
- **Linear Period Flow**: Implemented single-button progression system (start match → end period 1 → start period 2 → etc.)
- **Enhanced State Management**: Updated `getCurrentPeriod()` to track most recent period for proper progression logic
- **Cumulative Time Tracking**: Fixed elapsed time calculation across multiple periods
- **Retroactive Event Types**: Added functionality to add default event types to existing teams

#### Key Files Modified:
- `MobileEventLogger.tsx`: Complete rewrite of period management logic
- `services.ts`: Enhanced period tracking and event type creation
- `SimpleMatchForm.tsx`: New component replacing disabled legacy form
- `MatchManagement.tsx`: Updated to use new match creation form

## 🚧 Future Enhancements

- **Capacitor integration** for native mobile apps
- **Advanced statistics** and performance analytics
- **Photo uploads** for match documentation
- **Multi-team management** for league administrators
- **Advanced reporting** and season summaries
- **Data export** to PDF/Excel formats

## 📝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

For support, please open an issue in the GitHub repository or contact the development team.

---

**Built with ❤️ for youth football coaches and families**