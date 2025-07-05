# System Architecture Overview

This document outlines the high-level architecture of the Eventify application, a React Native event management and ticketing platform built with Expo.

## Core Philosophy

The architecture is designed to be **scalable, maintainable, and testable** by enforcing clear separation of concerns between UI components, state management, and backend services. The data flow is unidirectional and predictable, simplifying debugging and state reasoning.

## Technology Stack

### Frontend
- **React Native** (0.76.6) with **Expo** (~52.0.26)
- **TypeScript** for type safety
- **Ignite CLI** (v10.1.0) - Battle-tested React Native boilerplate
- **MobX-State-Tree** for state management
- **React Navigation** for routing and navigation
- **React Native Maps** for geolocation features
- **Socket.io Client** for real-time communication

### Backend
- **Supabase** for database, authentication, and real-time features
- **PostgreSQL** with PostGIS for geospatial data
- **Row Level Security (RLS)** for data protection
- **Supabase Edge Functions** (Deno runtime)

### Development Tools
- **ESLint** + **Prettier** for code quality
- **Jest** + **React Native Testing Library** for unit tests
- **Maestro** for end-to-end testing
- **Reactotron** for debugging
- **Sentry** for error monitoring

## High-Level Architecture

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│     Screens     │────▶ │  Store Actions  │────▶ │  Supabase API   │
│ (UI Components) │      │ (MST Flows)     │      │ (Backend)       │
└─────────────────┘      └─────────────────┘      └─────────────────┘
        ▲                        │
        │ (Reactive Update)      │
        │                        ▼
        └────────────────────────┤
        │      Store State       │
        │      (MST Models)      │
        └────────────────────────┘
```

### Data Flow
1. **User Interaction**: User interacts with a Screen (e.g., button press)
2. **Action Dispatch**: Screen calls an Action on a MobX-State-Tree Store
3. **API Call**: Store Action executes business logic and makes API calls to Supabase
4. **State Mutation**: Upon API response, Store Action updates the Store's State
5. **Reactive UI Update**: Screens (MobX observers) automatically re-render with new state

## Key Architectural Components

### Entry Point (`app/app.tsx`)
- Initializes global services (i18n, crash reporting, gesture handlers)
- Sets up the RootStore for application state
- Renders the main AppNavigator
- Provides necessary context providers

### Navigation (`app/navigators/`)
Built with React Navigation, defining all navigation paths:
- **AppNavigator**: Top-level stack determining auth vs main app flow
- **MainNavigator**: Bottom tab navigator for regular users
- **OrganizerNavigator**: Bottom tab navigator for event organizers
- **Nested Stacks**: Feature-specific navigation within tabs

### State Management (`app/models/`)
Centralized state using MobX-State-Tree:
- **RootStore**: Single source of truth, composition of domain stores
- **Feature Stores**: Domain-specific state management (Events, Users, Chat, etc.)
- **Actions**: Business logic using MST flows for async operations
- **Views**: Derived data that updates automatically
- **useStores() Hook**: Component access to state management

### Screens (`app/screens/`)
Top-level UI components for each route:
- **Observer Components**: Reactive to MST store changes
- **Logic-less**: Minimal business logic, primarily UI rendering
- **Role-based Organization**: Separate folders for User and Organizer features

### Backend Services (`app/services/`)
Abstracted backend communication:
- **Supabase Client**: Initialized in `app/services/auth/supabase.ts`
- **Encapsulated API Calls**: All Supabase operations within MST store actions
- **Decoupled Data Layer**: Components independent of data source

## User Roles & Features

### Regular Users (`/UserScreens/`)
- Event discovery and ticket booking
- Real-time event chat participation
- Profile and address management
- Favorites and ticket management

### Event Organizers (`/OrganizerScreens/`)
- Event creation and management
- Venue/location management
- Chat room moderation
- Campaign management (planned)

### System Features
- **Authentication**: Supabase Auth with role-based access
- **Real-time Chat**: Socket.io integration
- **Maps Integration**: Google Maps for location services
- **Internationalization**: Multi-language support
- **Dark Mode**: Complete theme system

## Database Architecture

The application uses Supabase PostgreSQL with the following key entities:

### Core Tables
- **profiles**: Public user information
- **user_private_profiles**: Sensitive user data (PII)
- **user_roles**: Role-based access control
- **events**: Event information with publisher relationships
- **events_dates_locations**: Event scheduling and venue details
- **locations**: Venue data with PostGIS geometry
- **event_chats**: Chat rooms for events
- **messages**: Real-time chat messages

### Payment System (In Development)
- **orders**: Transaction tracking
- **order_items**: Line item details
- **company_payment_profile**: Organizer payment information
- **addresses**: Billing and shipping addresses

*Note: Full payment integration is currently under development, starting with user-facing features.*

## Security Considerations

- **Row Level Security**: Enabled on all Supabase tables
- **JWT Authentication**: Supabase Auth tokens
- **Role-based Authorization**: Granular permissions system
- **Environment Variables**: Secure credential management
- **Client-side Validation**: Input sanitization and validation

## Development Patterns

### Code Organization
- **Feature-based Structure**: Grouped by domain functionality
- **Shared Components**: Reusable UI components with consistent theming
- **Utility Functions**: Centralized helpers and validators
- **Type Safety**: Comprehensive TypeScript coverage

### Testing Strategy
- **Unit Tests**: Component and utility function testing
- **Integration Tests**: Store action and flow testing
- **E2E Tests**: Critical user journey validation with Maestro
- **Type Checking**: Compile-time error prevention

## Performance Considerations

- **FlashList**: Optimized list rendering for large datasets
- **Image Optimization**: Expo Image for efficient loading
- **State Normalization**: MST models for optimal updates
- **Lazy Loading**: Route-based code splitting
- **Memory Management**: Proper cleanup in store actions

## Future Considerations

- **Payment Integration**: iyzico marketplace implementation
- **Push Notifications**: Real-time event updates
- **Offline Support**: Local data caching
- **Analytics**: Event and user behavior tracking
- **Scale Optimization**: Performance monitoring and optimization

---

This architecture provides a solid foundation for the Eventify platform while maintaining flexibility for future enhancements and integrations.