import demoEn from "./demo-en"

const en = {
  common: {
    ok: "OK!",
    cancel: "Cancel",
    back: "Back",
    logOut: "Log Out",
    login: "Log In",
    register: "Register",
    forgotPassword: "Forgot Password?",
    searching: "Searching...",
    loading: "Loading...",
  },
  welcomeScreen: {
    welcome: "Welcome to Eventify",
    tagLine: "Your one-stop platform for discovering and creating amazing events",
    joinUs: "Join our community today!",
    postscript:
      "psst  — This probably isn't what your app looks like. (Unless your designer handed you these screens, and in that case, ship it!)",
    readyForLaunch: "Your app, almost ready for launch!",
    exciting: "(ohh, this is exciting!)",
    letsGo: "Let's go!",
  },
  errorScreen: {
    title: "Something went wrong!",
    friendlySubtitle:
      "This is the screen that your users will see in production when an error is thrown. You'll want to customize this message (located in `app/i18n/en.ts`) and probably the layout as well (`app/screens/ErrorScreen`). If you want to remove this entirely, check `app/app.tsx` for the <ErrorBoundary> component.",
    reset: "RESET APP",
    traceTitle: "Error from %{name} stack",
  },
  emptyStateComponent: {
    generic: {
      heading: "So empty... so sad",
      content: "No data found yet. Try clicking the button to refresh or reload the app.",
      button: "Let's try this again",
    },
  },

  errors: {
    invalidEmail: "Invalid email address.",
    timeout: "Request timed out. Please try again.",
    cannotConnect: "Cannot connect to the server. Please check your internet connection.",
    server: "Server error occurred. Please try again later.",
    unauthorized: "Please sign in to continue.",
    forbidden: "You don't have permission to perform this action.",
    notFound: "The requested resource was not found.",
    rejected: "Your request was rejected. Please check your input and try again.",
    unknown: "An unexpected error occurred. Please try again.",
    badData: "Invalid data received from the server.",
    passwordsNotMatch: "Passwords do not match, check again!",
    passwordShort: "Passwords should be longer than 5 characters",
  },
  loginScreen: {
    logIn: "Welcome Back!",
    enterDetails:
      "Sign in to your account to discover and join amazing events happening around you.",
    emailFieldLabel: "Email",
    passwordFieldLabel: "Password",
    emailFieldPlaceholder: "Enter your email address",
    passwordFieldPlaceholder: "Enter your password",
    tapToLogIn: "Sign In",
    forgotPasswordText: "Trouble signing in?",
  },
  registerScreen: {
    signUp: "Create Account",
    createAccount: "Join us and start discovering amazing events near you.",
    nameFieldLabel: "Display Name",
    nameFieldPlaceholder: "Enter your display name",
    nameRequired: "Display name is required",
    emailFieldLabel: "Email",
    passwordFieldLabel: "Password",
    confirmPasswordFieldLabel: "Confirm Password",
    emailFieldPlaceholder: "Enter your email address",
    passwordFieldPlaceholder: "Enter your password",
    confirmPasswordFieldPlaceholder: "Confirm your password",
    tapToSignUp: "Sign Up",
  },
  resetPasswordScreen: {
    resetPassword: "Reset Password",
    tagline: "You can reset your old password here",
    newPasswordFieldLabel: "New Password",
    newPasswordFielPlaceholder: "Enter New Password",
    confirmNewPasswordFieldLabel: "Confirm New Password",
    confirmNewPasswordFieldPlaceholder: "Confirm New Password",
  },
  upcomingEventsScreen: {
    title: "Upcoming Events",
    description: "Discover and join exciting events happening soon",
  },
  pastEventsScreen: {
    title: "Past Events",
    description: "Browse through events you've attended or missed",
  },
  profileScreen: {
    title: "Profile",
    description: "Manage your account and preferences",
  },
  upcomingEvents: {
    title: "Upcoming Events",
    description: "Discover events happening around you",
    searchThisArea: "Search This Area",
  },
  eventsListScreen: {
    favoriteButton: "Favorite",
    unfavoriteButton: "Unfavorite",
    joinChat: "Join Chat",
    quitChat: "Quit Chat",
    title: "Events",
    onlyFavorites: "Only Show Favorites",
    noEventsEmptyState: {
      heading: "No Events Found",
      content:
        "There are currently no events in this area. Try adjusting your search or exploring nearby regions.",
    },
    noFavoritesEmptyState: {
      heading: "No Favorite Events",
      content:
        "You haven't added any events to your favorites yet. Tap the heart icon on an event to save it here!",
    },
    accessibility: {
      cardHint: "Double tap to view event details. Double tap and hold to {{action}} this event.",
      favoriteAction: "Toggle Favorite",
      favoriteIcon: "Event not favorited",
      unfavoriteIcon: "Event favorited",
      publishLabel: "Published {{date}}",
      timePublishedLabel: "Time: {{time}}",
      switch: "Switch on to only show favorites",
    },
  },

  ...demoEn,
}

export default en
export type Translations = typeof en
