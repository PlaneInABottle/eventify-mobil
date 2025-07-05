# Eventify Documentation

Welcome to the Eventify project documentation. This guide will help you understand, set up, and contribute to the event management platform.

## 📖 Table of Contents

### 🚀 Getting Started
- [**Setup Guide**](./getting-started/setup-guide.md) - Complete development environment setup
- [**Quick Start**](../README.md) - Main project README with overview

### 🏗 Architecture
- [**System Overview**](./architecture/system-overview.md) - Technical architecture and design patterns
- [**Database Schema**](./features/payment-integration.md#database-schema) - Database structure and relationships

### ✨ Features
- [**Payment Integration**](./features/payment-integration.md) - iyzico payment system implementation and status

### 🛠 Development
- [**Contributing Guide**](./development/contributing.md) - Development workflow and coding standards
- [**Testing Strategy**](./ENHANCED_TESTING_STRATEGY.md) - Comprehensive testing approach for mobile development

## 🔍 Quick Navigation

### For New Developers
1. Start with the [Setup Guide](./getting-started/setup-guide.md)
2. Review the [System Overview](./architecture/system-overview.md)
3. Read the [Contributing Guide](./development/contributing.md)
4. Understand the [Testing Strategy](./ENHANCED_TESTING_STRATEGY.md)

### For Payment Integration
1. Check [Payment Integration Status](./features/payment-integration.md#current-implementation-status)
2. Review the [Database Schema](./features/payment-integration.md#database-schema)
3. Understand the [Payment Flow](./features/payment-integration.md#payment-flow)

### For Architecture Understanding
1. Read the [System Overview](./architecture/system-overview.md)
2. Study the [MobX-State-Tree patterns](./architecture/system-overview.md#state-management-app-models)
3. Review [Navigation structure](./architecture/system-overview.md#navigation-app-navigators)

## 📱 Project Overview

Eventify is a React Native event management and ticketing platform featuring:

- **Dual User Roles**: Regular users and event organizers
- **Real-time Features**: Chat system using Socket.io
- **Payment Processing**: iyzico marketplace integration
- **Maps Integration**: Location-based event discovery
- **Modern Stack**: React Native, Expo, TypeScript, MobX-State-Tree, Supabase

## 🔧 Technology Stack

### Frontend
- **React Native** (0.76.6) with **Expo** (~52.0.26)
- **TypeScript** for type safety
- **Ignite CLI** (v10.1.0) boilerplate
- **MobX-State-Tree** for state management
- **React Navigation** for routing

### Backend
- **Supabase** for database, auth, and real-time features
- **PostgreSQL** with PostGIS for geospatial data
- **Edge Functions** (Deno runtime) for payment processing

### Development & Testing
- **Jest** + **React Native Testing Library** for unit tests
- **Maestro** for E2E testing (with Samsung Galaxy M51 testing)
- **TypeScript** + **ESLint** + **Prettier** for code quality
- **Reactotron** for debugging and state inspection

## 📊 Current Status

### ✅ Completed
- Core app structure and navigation
- User authentication and profiles
- Event management system
- Real-time chat functionality
- Database schema and RLS policies
- E2E testing infrastructure with Maestro
- Comprehensive testing strategy documentation

### 🔄 In Development
- Payment integration (iyzico)
- User payment screens
- Organizer payment management
- Unit and integration test implementation

### 📋 Planned
- Push notifications
- Advanced analytics
- Multi-language expansion
- Performance optimizations

## 🤝 Contributing

We welcome contributions! Please read our [Contributing Guide](./development/contributing.md) for:

- Development workflow
- Coding standards
- Testing requirements
- Pull request process

## 📞 Support

- **Documentation Issues**: Create issues for unclear or missing documentation
- **Development Help**: Check existing documentation first, then create discussions
- **Bug Reports**: Use GitHub issues with detailed reproduction steps

## 📝 Documentation Maintenance

This documentation is actively maintained. If you notice outdated information:

1. Check if there's a newer version
2. Create an issue describing the problem
3. Submit a PR with corrections (preferred)

---

**Last Updated**: January 2025  
**Version**: Current development state  
**Maintainers**: Eventify Development Team