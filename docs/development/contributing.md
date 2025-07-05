# Contributing to Eventify

This guide outlines the development workflow, coding standards, and best practices for contributing to the Eventify project.

## Development Workflow

### Getting Started
1. Follow the [Setup Guide](../getting-started/setup-guide.md) to configure your development environment
2. Read the [System Overview](../architecture/system-overview.md) to understand the project architecture
3. Review the current [Payment Integration](../features/payment-integration.md) status

### Branch Strategy
- **main**: Production-ready code
- **develop**: Integration branch for features
- **feature/**: Individual feature development
- **fix/**: Bug fixes

### Making Changes
1. Create a feature branch from `develop`
2. Make your changes following coding standards
3. Write/update tests for your changes
4. Run quality checks before committing
5. Create a pull request with clear description

## Code Quality Standards

### TypeScript
- Use strict TypeScript configuration
- Define proper interfaces and types
- Avoid `any` type usage
- Document complex type definitions

### React Native Components
```typescript
// Good: Typed component with proper interface
interface UserCardProps {
  user: User
  onPress: (user: User) => void
}

export const UserCard: FC<UserCardProps> = ({ user, onPress }) => {
  // Implementation
}
```

### MobX-State-Tree Stores
```typescript
// Good: Proper MST model with typed actions
export const UserStoreModel = types
  .model("UserStore")
  .props({
    users: types.array(UserModel),
    isLoading: types.optional(types.boolean, false)
  })
  .actions((store) => ({
    fetchUsers: flow(function* () {
      store.isLoading = true
      try {
        const users = yield api.getUsers()
        store.users.replace(users)
      } catch (error) {
        console.error("Failed to fetch users:", error)
      } finally {
        store.isLoading = false
      }
    })
  }))
```

### Styling
- Use the centralized theme system
- Follow responsive design principles
- Maintain consistency across platforms

```typescript
// Good: Using theme system
const $container: ViewStyle = {
  flex: 1,
  backgroundColor: theme.colors.background,
  padding: theme.spacing.md
}
```

## Testing Standards

### Unit Tests
```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Test Structure
```typescript
// Good: Comprehensive component test
describe("UserCard", () => {
  it("should render user information correctly", () => {
    const mockUser = { id: "1", name: "John Doe" }
    render(<UserCard user={mockUser} onPress={jest.fn()} />)
    
    expect(screen.getByText("John Doe")).toBeOnTheScreen()
  })

  it("should call onPress when tapped", () => {
    const mockUser = { id: "1", name: "John Doe" }
    const mockOnPress = jest.fn()
    render(<UserCard user={mockUser} onPress={mockOnPress} />)
    
    fireEvent.press(screen.getByText("John Doe"))
    expect(mockOnPress).toHaveBeenCalledWith(mockUser)
  })
})
```

### E2E Tests
```bash
# Run Maestro tests
npm run test:maestro
```

## Code Review Guidelines

### Pull Request Requirements
- [ ] Tests pass
- [ ] Code follows style guidelines
- [ ] Documentation updated if needed
- [ ] No linting errors
- [ ] TypeScript compilation successful

### Review Checklist
- **Functionality**: Does the code work as intended?
- **Performance**: Are there any performance implications?
- **Security**: Are there any security concerns?
- **Maintainability**: Is the code readable and well-structured?
- **Testing**: Are there adequate tests?

## Commit Guidelines

### Commit Message Format
```
type(scope): description

[optional body]

[optional footer]
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Build process or auxiliary tool changes

### Examples
```bash
git commit -m "feat(payment): add iyzico integration"
git commit -m "fix(auth): resolve token refresh issue"
git commit -m "docs(api): update payment flow documentation"
```

## State Management Patterns

### Store Organization
- Each domain has its own store (User, Event, Payment, etc.)
- Stores are composed in the RootStore
- Actions use MST flows for async operations
- Views provide derived data

### API Integration
```typescript
// Good: Proper error handling in store actions
const fetchUserProfile: flow(function* () {
  try {
    store.isLoading = true
    const profile = yield api.getUserProfile()
    store.setProfile(profile)
  } catch (error) {
    store.setError(handleError(error))
  } finally {
    store.isLoading = false
  }
})
```

### State Updates
- Use MST actions for state modifications
- Avoid direct property mutations
- Handle loading and error states consistently

## Navigation Patterns

### Screen Organization
- Screens are organized by user role (User/Organizer)
- Each screen focuses on a single responsibility
- Navigation state is managed by React Navigation

### Deep Linking
```typescript
// Good: Proper deep link handling
const linking = {
  prefixes: ['eventify://'],
  config: {
    screens: {
      EventDetails: 'event/:eventId',
      PaymentResult: 'payment/result'
    }
  }
}
```

## Security Best Practices

### Data Handling
- Never log sensitive user data
- Validate all user inputs
- Use proper authentication headers
- Implement proper error boundaries

### API Security
- Use Supabase RLS policies
- Validate permissions server-side
- Handle authentication state properly
- Secure environment variables

## Performance Guidelines

### Optimization Techniques
- Use FlashList for large datasets
- Implement proper image caching
- Minimize re-renders with MST views
- Use React.memo for expensive components

### Memory Management
- Clean up subscriptions and timers
- Avoid memory leaks in stores
- Optimize image loading and caching

## Documentation Standards

### Code Documentation
```typescript
// Good: Proper JSDoc documentation
/**
 * Initializes payment flow with iyzico
 * @param basketItems - Items to be purchased
 * @param billingAddress - User's billing address
 * @returns Promise resolving to payment URL
 */
const initializePayment = async (
  basketItems: BasketItem[],
  billingAddress: Address
): Promise<PaymentInitResponse> => {
  // Implementation
}
```

### README Updates
- Keep README.md current with features
- Update installation instructions
- Document new environment variables
- Add troubleshooting information

## Release Process

### Pre-release Checklist
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Version numbers updated
- [ ] Changelog prepared
- [ ] Build artifacts tested

### Deployment
1. Merge to main branch
2. Tag release version
3. Build production artifacts
4. Deploy to app stores
5. Monitor for issues

## Getting Help

### Resources
- [Architecture Documentation](../architecture/system-overview.md)
- [Setup Guide](../getting-started/setup-guide.md)
- [Payment Integration](../features/payment-integration.md)

### Support Channels
- Create GitHub issues for bugs
- Use discussions for questions
- Review existing documentation first
- Include relevant error logs and context

---

Thank you for contributing to Eventify! Your efforts help create a better event management platform for everyone.