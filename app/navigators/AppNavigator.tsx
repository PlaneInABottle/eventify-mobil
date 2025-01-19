/**
 * The app navigator (formerly "AppNavigator" and "MainNavigator") is used for the primary
 * navigation flows of your app.
 * Generally speaking, it will contain an auth flow (registration, login, forgot password)
 * and a "main" flow which the user will use once logged in.
 */
import { NavigationContainer, NavigatorScreenParams } from "@react-navigation/native"
import { createNativeStackNavigator, NativeStackScreenProps } from "@react-navigation/native-stack"
import { observer } from "mobx-react-lite"
import * as Screens from "@/screens"
import Config from "../config"
import { useStores } from "../models"
// import { DemoNavigator, DemoTabParamList } from "./DemoNavigator"
import { MainNavigator, MainTabParamList } from "./MainNavigator"
import { navigationRef, useBackButtonHandler } from "./navigationUtilities"
import { useAppTheme, useThemeProvider } from "@/utils/useAppTheme"
import { ComponentProps } from "react"
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet"
import * as Linking from "expo-linking"

/**
 * This type allows TypeScript to know what routes are defined in this navigator
 * as well as what properties (if any) they might take when navigating to them.
 *
 * If no params are allowed, pass through `undefined`. Generally speaking, we
 * recommend using your MobX-State-Tree store(s) to keep application state
 * rather than passing state through navigation params.
 *
 * For more information, see this documentation:
 *   https://reactnavigation.org/docs/params/
 *   https://reactnavigation.org/docs/typescript#type-checking-the-navigator
 *   https://reactnavigation.org/docs/typescript/#organizing-types
 */
export type AppStackParamList = {
  Welcome: undefined
  Login: undefined
  Register: undefined
  // Demo: NavigatorScreenParams<DemoTabParamList>
  Main: NavigatorScreenParams<MainTabParamList>
  // 🔥 Your screens go here
  ForgotPassword: undefined
  ResetPassword: undefined
  EditProfile: undefined
  Chat: { eventChatId: string }
  Report: { reportedItemId: string; reportType: string }
  Event: { eventId: string }
  // IGNITE_GENERATOR_ANCHOR_APP_STACK_PARAM_LIST
}

/**
 * This is a list of all the route names that will exit the app if the back button
 * is pressed while in that screen. Only affects Android.
 */
const exitRoutes = Config.exitRoutes

export type AppStackScreenProps<T extends keyof AppStackParamList> = NativeStackScreenProps<
  AppStackParamList,
  T
>

// Documentation: https://reactnavigation.org/docs/stack-navigator/
const Stack = createNativeStackNavigator<AppStackParamList>()

const AppStack = observer(function AppStack() {
  const {
    authenticationStore: { isAuthenticated, createSessionFromUrl },
  } = useStores()

  const {
    theme: { colors },
  } = useAppTheme()

  const url = Linking.useURL()
  if (url) createSessionFromUrl(url)
  console.log("URL: ", url)
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        navigationBarColor: colors.background,
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
      initialRouteName={isAuthenticated ? "Main" : "ResetPassword"}
    >
      {isAuthenticated ? (
        <>
          {/* <Stack.Screen name="Demo" component={DemoNavigator} /> */}
          <Stack.Screen name="Main" component={MainNavigator} />
          <Stack.Screen name="EditProfile" component={Screens.EditProfileScreen} />
          <Stack.Screen name="Chat" component={Screens.ChatScreen} />
          <Stack.Screen name="Report" component={Screens.ReportScreen} />
        </>
      ) : (
        <>
          {/* <Stack.Screen name="Main" component={MainNavigator} /> */}

          <Stack.Screen name="Welcome" component={Screens.WelcomeScreen} />
          <Stack.Screen name="Login" component={Screens.LoginScreen} />
          <Stack.Screen name="Register" component={Screens.RegisterScreen} />
          <Stack.Screen name="ForgotPassword" component={Screens.ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword" component={Screens.ResetPasswordScreen} />
        </>
      )}

      {/** 🔥 Your screens go here */}

      {/* IGNITE_GENERATOR_ANCHOR_APP_STACK_SCREENS */}
    </Stack.Navigator>
  )
})

export interface NavigationProps extends Partial<ComponentProps<typeof NavigationContainer>> {}

export const AppNavigator = observer(function AppNavigator(props: NavigationProps) {
  const { themeScheme, navigationTheme, setThemeContextOverride, ThemeProvider } =
    useThemeProvider()

  useBackButtonHandler((routeName) => exitRoutes.includes(routeName))
  return (
    <ThemeProvider value={{ themeScheme, setThemeContextOverride }}>
      <BottomSheetModalProvider>
        <NavigationContainer ref={navigationRef} theme={navigationTheme} {...props}>
          <AppStack />
        </NavigationContainer>
      </BottomSheetModalProvider>
    </ThemeProvider>
  )
})
