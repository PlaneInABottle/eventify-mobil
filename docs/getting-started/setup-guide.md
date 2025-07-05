# Getting Started with Eventify

This guide provides step-by-step instructions for setting up the Eventify project for local development.

## Prerequisites

### System Requirements
- **Node.js**: Version 18.18.0 or higher (as specified in package.json engines)
- **Bun**: Package manager (preferred) or npm/yarn
- **Git**: For version control
- **Expo CLI**: Command-line interface for Expo
- **Platform-specific tools**:
  - **Android**: Android Studio with configured emulator or physical device
  - **iOS**: Xcode with simulator or physical device (macOS only)

### Development Tools
- **Code Editor**: VS Code recommended with React Native extensions
- **Debug Tools**: Reactotron for state inspection and API monitoring
- **Testing**: Maestro for E2E testing (optional)

## Environment Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Eventify
```

### 2. Install Dependencies
```bash
# Using Bun (recommended)
bun install

# Or using npm
npm install
```

### 3. Environment Variables
Create a `.env` file in the project root:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: API Configuration
EXPO_PUBLIC_API_URL=your_api_url

# Development Settings
EXPO_PUBLIC_ENV=development
```

**Important**: Never commit the `.env` file to version control. It's included in `.gitignore`.

### 4. Platform Setup

#### Android Development
1. Install Android Studio
2. Configure Android SDK and emulator
3. Enable USB debugging on physical device (if using)
4. Run device connection commands:
   ```bash
   npm run adb
   ```

#### iOS Development (macOS only)
1. Install Xcode from App Store
2. Install Xcode Command Line Tools
3. Configure iOS Simulator
4. For physical devices, configure signing certificates

## Running the Application

### Development Server
Start the Expo development server:
```bash
npm start
# or
npx expo start
```

This opens the Expo developer tools where you can:
- Scan QR code with Expo Go app (easiest for testing)
- Launch on iOS simulator
- Launch on Android emulator
- Open in web browser

### Platform-Specific Commands

#### Android
```bash
# Run on Android emulator/device
npm run android
# or for specific device
npm run android:m51

# Build for Android
npm run build:android:dev  # Development build
npm run build:android:prod # Production build
```

#### iOS
```bash
# Run on iOS simulator/device
npm run ios

# Build for iOS
npm run build:ios:dev   # Development build
npm run build:ios:prod  # Production build
```

#### Web
```bash
# Run in web browser
npm run web

# Build for web
npm run bundle:web
npm run serve:web
```

## Project Structure Overview

```
Eventify/
├── app/                    # Main application code
│   ├── components/         # Reusable UI components
│   ├── screens/           # Application screens
│   │   ├── UserScreens/   # User-facing screens
│   │   └── OrganizerScreens/ # Organizer-specific screens
│   ├── models/            # MobX-State-Tree stores
│   ├── navigators/        # React Navigation setup
│   ├── services/          # API and authentication
│   ├── theme/             # Styling and theming
│   └── utils/             # Utility functions
├── assets/                # Static assets (images, fonts)
├── docs/                  # Project documentation
├── supabase/              # Supabase configuration (local)
└── test/                  # Test files and setup
```

## Development Workflow

### Code Quality
```bash
# Check and fix linting issues
npm run lint

# Type checking
npm run compile

# Run tests
npm test
npm run test:watch  # Watch mode
```

### State Management
The app uses MobX-State-Tree for state management:
- **RootStore**: Central state container
- **Domain Stores**: Feature-specific state (Events, Users, etc.)
- **Actions**: Business logic and API calls
- **Views**: Derived data and computed values

Access stores in components:
```typescript
import { useStores } from "../models"

const MyComponent = () => {
  const { eventStore, userStore } = useStores()
  // Use store data and actions
}
```

### Navigation
React Navigation is used for routing:
- **AppNavigator**: Main app navigation
- **MainNavigator**: User tab navigation
- **OrganizerNavigator**: Organizer tab navigation

### Theming
The app supports light/dark themes:
```typescript
import { useAppTheme } from "../utils/useAppTheme"

const MyComponent = () => {
  const { theme, themeType } = useAppTheme()
  // Use theme colors and spacing
}
```

## Testing

### Unit Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- MyComponent.test.ts
```

### E2E Tests (Maestro)
```bash
# Run E2E tests
npm run test:maestro
```

### Manual Testing
- Test on multiple devices/simulators
- Verify offline functionality
- Test authentication flows
- Validate payment integration (sandbox)

## Common Development Tasks

### Adding a New Screen
1. Create screen component in appropriate folder
2. Add to navigator
3. Create or update store if needed
4. Add tests
5. Update navigation types

### Working with Supabase
- Database changes should be made through Supabase dashboard
- Edge Functions are deployed separately
- Use `supabase-js` client for API calls
- Implement RLS policies for security

### Internationalization
Add new translations in `app/i18n/`:
```typescript
// en.ts
export const en = {
  common: {
    ok: "OK",
    cancel: "Cancel"
  }
}
```

Use in components:
```typescript
import { translate } from "../i18n"

const text = translate("common.ok")
```

## Troubleshooting

### Common Issues

#### Metro Bundler Issues
```bash
# Clear Metro cache
npx expo start --clear

# Reset node modules
rm -rf node_modules
npm install
```

#### Build Issues
```bash
# Clean Expo cache
npx expo install --fix

# Prebuild clean
npm run prebuild:clean
```

#### Device Connection
```bash
# For Android, ensure ADB is working
adb devices

# Restart Metro and reconnect
npm start
```

### Environment Issues
- Verify Node.js version matches requirements
- Ensure all environment variables are set
- Check Supabase connection and credentials
- Validate platform-specific setup

### Performance Issues
- Use Reactotron to monitor state updates
- Check for unnecessary re-renders
- Optimize image loading and caching
- Monitor memory usage

## Getting Help

### Resources
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [MobX-State-Tree Guide](https://mobx-state-tree.js.org/)

### Project-Specific
- Check `/docs` folder for detailed guides
- Review component examples in `/app/components`
- Study store patterns in `/app/models`
- Refer to navigation setup in `/app/navigators`

### Support
- Create issues for bugs or feature requests
- Review existing documentation for solutions
- Check console logs and error messages
- Use Reactotron for debugging state and API calls

---

You're now ready to start developing with Eventify! Begin by exploring the codebase structure and running the app on your preferred platform.