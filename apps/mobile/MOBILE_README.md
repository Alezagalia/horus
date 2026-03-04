# Horus Mobile App

React Native mobile application for the Horus personal productivity system.

## 📱 Overview

The Horus mobile app is a comprehensive personal productivity tool that helps users manage their habits, tasks, finances, fitness, calendar events, and knowledge resources. Built with React Native and Expo, it provides a native mobile experience with offline support and real-time synchronization with the backend API.

## ✨ Features

### 🔐 Authentication (Sprint 1)
- JWT-based authentication with refresh tokens
- Secure token storage using expo-secure-store
- Auto-login with stored credentials
- Login/Register screens with validation

### 🏠 Dashboard (Sprint 3)
- Personalized hero section with greeting
- Quick stats cards (habits, streaks, urgent tasks)
- Beautiful gradient background design
- Upcoming tasks widget (Sprint 5)
- Finance summary widgets
- Navigation to all app sections

### 🎯 Habits Management
- Create and track daily/weekly/monthly habits
- Visual progress tracking with charts
- Streak tracking and statistics
- Habit completion rates
- Categories and icons
- Detailed habit statistics

### ✅ Tasks Management
- Create tasks with priorities (alta, media, baja)
- Due dates and status tracking
- Categories and organization
- Checklist items support
- Filter by status and priority

### 💰 Finance Management (Sprint 2)
- **Accounts**: Multiple accounts with currency support
- **Transactions**: Income and expense tracking
- **Transfers**: Between accounts
- **Recurring Expenses**: Monthly expense templates
- **Monthly Expenses**: Track and pay monthly expenses
- **Statistics**: Finance stats and visualizations
- Complete transaction history with search

### 📅 Calendar Integration (Sprint 4)
- Create and manage calendar events
- All-day and timed events
- Recurring events support (via rrule)
- Event status management
- Category integration
- Location and reminders

### 💪 Fitness Tracking
- Exercise library management
- Workout routines
- Workout execution and tracking
- Exercise statistics and progress
- Personal records tracking

### 📚 Knowledge Management
- Resource collection (notes, code snippets, bookmarks)
- Tag-based organization
- Quick access to important information

### ⚙️ Settings (Sprint 3)
- User profile management
- Account settings
- App configuration
- Logout functionality

## 🏗️ Architecture

### Tech Stack
- **Framework**: React Native (Expo SDK 54)
- **Language**: TypeScript
- **Navigation**: React Navigation v7 (Bottom Tabs + Stack)
- **State Management**: React Query (TanStack Query v5)
- **HTTP Client**: Axios with interceptors
- **Secure Storage**: expo-secure-store
- **Validation**: Zod schemas
- **Date Handling**: date-fns v4
- **UI Components**: React Native built-ins + custom components

### Project Structure
```
apps/mobile/
├── src/
│   ├── api/              # API clients for backend endpoints
│   ├── components/       # Reusable UI components
│   ├── contexts/         # React contexts (Auth, etc.)
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility libraries (axios, storage)
│   ├── navigation/       # Navigation configuration
│   ├── screens/          # Screen components
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Helper functions
├── android/              # Android native project
├── assets/               # Images, fonts, etc.
└── App.tsx               # Root component
```

### Navigation Structure
```
App
├── AuthNavigator (unauthenticated)
│   ├── Login
│   └── Register
└── TabNavigator (authenticated)
    ├── HomeTab (Stack)
    │   └── Dashboard
    ├── HabitsTab (Stack)
    │   ├── HabitsList
    │   ├── HabitDetail
    │   ├── HabitForm
    │   └── HabitStats
    ├── TasksTab (Stack)
    │   └── TasksList
    ├── FinanceTab (Stack)
    │   ├── FinanceHome
    │   ├── Accounts
    │   ├── Transactions
    │   ├── RecurringExpenses
    │   └── MonthlyExpenses
    └── MoreTab (Stack)
        ├── Exercises
        ├── Routines
        ├── Resources
        ├── Calendar
        └── Settings
```

### API Integration

All API calls use a centralized axios instance (`lib/axios.ts`) with:
- Automatic auth token injection
- Token refresh on 401 errors
- Request/response interceptors
- Error handling
- Rate limiting support

**API Clients:**
- `auth.api.ts` - Authentication (login, register, getMe)
- `habits.api.ts` - Habits and habit records
- `tasks.api.ts` - Task management
- `accounts.api.ts` - Financial accounts
- `transactions.api.ts` - Income/expense transactions
- `recurringExpenses.api.ts` - Recurring expense templates
- `monthlyExpenses.api.ts` - Monthly expense instances
- `categories.api.ts` - Categories (habits, tasks, events, expenses)
- `financeStats.api.ts` - Financial statistics
- `events.api.ts` - Calendar events
- `exercises.api.ts` - Exercise library
- `routines.api.ts` - Workout routines
- `workouts.api.ts` - Workout sessions
- `resources.api.ts` - Knowledge resources

### State Management

**React Query** is used for server state:
- 5-minute stale time for most queries
- Automatic cache invalidation on mutations
- Optimistic updates where appropriate
- Background refetching on focus

**React Context** for global app state:
- `AuthContext` - User authentication state

### Data Flow
```
User Action → Component → Hook (useQuery/useMutation)
    ↓
API Client → Axios Instance (with auth) → Backend API
    ↓
Response → React Query Cache → Component Update
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and pnpm
- Expo CLI
- Android Studio (for Android builds)
- Physical device or emulator

### Installation
```bash
# Install dependencies (from monorepo root)
pnpm install

# Navigate to mobile app
cd apps/mobile

# Start Expo dev server
pnpm start

# Run on Android
pnpm android

# Run on iOS
pnpm ios
```

### Environment Variables
Create `.env` file in `apps/mobile/`:
```
EXPO_PUBLIC_API_URL=https://your-api-url.com/api
```

## 📦 Building

### Development Build
```bash
# Generate bundle
npx expo export --platform android

# Copy to assets
cp dist/_expo/static/js/android/*.hbc android/app/src/main/assets/index.android.bundle

# Build APK
cd android
./gradlew assembleDebug
```

### Production Build
See `DEPLOYMENT.md` for detailed build and release instructions.

## 🧪 Testing

### Manual Testing
- Use Expo Go app for quick testing
- Test on physical device for full feature testing
- Test offline functionality
- Test token refresh flow

### Key Test Scenarios
1. **Authentication**: Login, logout, token refresh
2. **Habits**: Create, complete, view stats
3. **Tasks**: Create, update status, set due dates
4. **Finance**: Create account, add transactions, pay expenses
5. **Calendar**: Create events, view calendar
6. **Navigation**: All tabs and screens accessible

## 📚 Sprint History

### Sprint 1: Authentication & Navigation
- JWT authentication with secure storage
- Login/Register screens
- Bottom tab navigation (4 tabs)
- Centralized axios instance with interceptors

### Sprint 2: Finance Integration
- Added 5th Finance tab
- Complete finance management (accounts, transactions, expenses)
- Finance statistics and visualizations
- Monthly expense tracking

### Sprint 3: Dashboard Enhancements
- Hero section with personalized greeting
- Quick stats cards
- Settings/Profile screen
- Gradient backgrounds

### Sprint 4: Calendar Integration
- Events API client
- React Query hooks for events
- Calendar navigation integration

### Sprint 5: Polish & Completion
- Upcoming tasks widget on HomeScreen
- Comprehensive documentation
- Final refinements

## 🐛 Known Issues

### APK Build
- Gradle build has environment-specific issues
- Workaround: Use Expo Go for testing or build on machine with proper Java/Gradle setup
- See `DEPLOYMENT.md` for troubleshooting

### Pending Features
- Interactive habit checkboxes on HomeScreen
- Combined tasks + events widget
- Push notifications
- Dark mode
- Offline sync improvements

## 🔮 Future Enhancements

### High Priority
1. Interactive widgets on HomeScreen
2. Push notifications for reminders
3. Offline-first architecture improvements
4. Dark mode support

### Medium Priority
1. Advanced filtering and search
2. Data export functionality
3. Charts and visualizations
4. Habit suggestions/templates
5. Calendar sync with Google Calendar

### Low Priority
1. Gamification features
2. Social features (share progress)
3. Widgets for device home screen
4. Wear OS support

## 📄 License

Part of the Horus monorepo. See root LICENSE file.

## 👥 Contributing

This is a personal productivity app. For contributing guidelines, see the main repository README.

## 🆘 Support

For issues and questions:
1. Check `DEPLOYMENT.md` for build issues
2. Check `SPRINT_SUMMARY.md` for feature documentation
3. Review API documentation in backend
4. Contact development team

---

**Last Updated**: Sprint 5 (February 2026)
**Version**: 1.0.0 (Sprint 5)
**Maintainers**: Horus Development Team
