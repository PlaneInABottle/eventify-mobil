import { api } from "@/services/api"
import { Instance, SnapshotOut, types, flow, IAnyModelType } from "mobx-state-tree"
import { getRootStore } from "./helpers/getRootStore"
import { supabase } from "@/services/auth/supabase"
import { AuthChangeEvent, AuthError, Session } from "@supabase/supabase-js"
import * as QueryParams from "expo-auth-session/build/QueryParams"
import { handleError } from "@/utils/errorHandler"
import { handleSuccess } from "@/utils/successHandler"
import { NavigationProp, useNavigation } from "@react-navigation/native"
import { AppStackParamList } from "@/navigators"

export const AuthenticationStoreModel: IAnyModelType = types
  .model("AuthenticationStore")
  .props({
    authToken: types.maybe(types.string),
    authEmail: "",
  })
  .volatile(() => ({
    isLoading: false,
    authSubscription: null as any, // or proper Supabase subscription type
    error: undefined as string | undefined,
    resetPasswordError: undefined as string | undefined,
  }))
  .views((store) => ({
    get token() {
      return store.authToken
    },
    get isAuthenticated(): boolean {
      return !!store.authToken
    },
    get validationError(): string {
      if (store.authEmail.length === 0) return "errors:cantBeBlank"
      if (store.authEmail.length < 6) return "errors:must6Chars"
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(store.authEmail)) return "errors:mustBeValidEmail"
      return ""
    },
  }))
  .actions((store) => ({
    setLoading(value: boolean): void {
      store.isLoading = value
    },
    setError(value: string | undefined): void {
      store.error = value
    },
    clearAuthentication() {
      store.authEmail = ""
      store.authToken = undefined
      store.error = undefined
    },
  }))
  .actions((store) => ({
    setAuthToken(value?: string): void {
      store.authToken = value
    },
    distributeAuthToken(value?: string): void {
      // optionally grab the store's authToken if not passing a value
      const token = value || store.authToken
      api.apisauce.setHeader("Authorization", `Bearer ${token}`)
    },
    setAuthEmail(value: string): void {
      store.authEmail = value.replace(/ /g, "")
    },
    logout() {
      try {
        getRootStore(store).resetAllStores()
        handleSuccess("success:logoutSuccess")
      } catch (e) {
        handleError(e)
      }
    },
  }))
  .actions((store) => ({
    handleSuccessfulAuth: flow(function* (session: Session, userId: string) {
      try {
        if (!session?.access_token || !userId) {
          throw Error("Invalid session data")
        }
        store.setAuthToken(session.access_token)
        store.setAuthEmail(session.user?.email ?? "")
        store.distributeAuthToken(session.access_token)

        // Get initial data
        getRootStore(store).chatStore.connect(session.access_token)
        getRootStore(store).getInitialData(userId)

        return true
      } catch (error) {
        handleError(error, { toast: true })
        return false
      } finally {
        store.setLoading(false)
      }
    }),
  }))
  .actions((store) => ({
    login: flow(function* (email: string, password: string) {
      store.setLoading(true)
      store.setError(undefined)

      try {
        const { data, error }: { data: any; error: AuthError } =
          yield supabase.auth.signInWithPassword({
            email,
            password,
          })

        if (error) {
          store.setError(error.message)
          return false
        }

        if (data.session) {
          const success = yield store.handleSuccessfulAuth(data.session, data.user?.id)
          handleSuccess("success:loginSuccess")
          return success
        }

        throw Error("Session data couldn't fetched")
      } catch (error) {
        store.setError(error instanceof Error ? error.message : "An unexpected error occurred")
        return false
      } finally {
        store.setLoading(false)
      }
    }),

    register: flow(function* (email: string, password: string, name: string) {
      store.setLoading(true)
      store.setError(undefined)

      try {
        const { data, error }: { data: any; error: AuthError } = yield supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: name,
            },
          },
        })

        if (error) {
          store.setError(error.message)
          return false
        }

        if (data.session) {
          const success = yield store.handleSuccessfulAuth(data.session, data.user?.id)
          handleSuccess("success:signUpSuccess")
          return success
        }

        store.setError("No session data received")
        return false
      } catch (error) {
        store.setError(error instanceof Error ? error.message : "An unexpected error occurred")
        return false
      } finally {
        store.setLoading(false)
      }
    }),
    updatePassword: flow(function* (newPassword: string) {
      store.setLoading(true)
      try {
        const { error } = yield supabase.auth.updateUser({
          password: newPassword,
        })
        if (error) throw Error(error.message)
        const { error: signoutError } = yield supabase.auth.signOut()

        if (signoutError) throw Error(signoutError.message)
        handleSuccess("success:passwordChanged")
        return { status: "ok" }
      } catch (e: any) {
        handleError(e)
        return { status: "error", error: e.message ? e.message : "There was an error" }
      } finally {
        store.setLoading(false)
      }
    }),
    createSessionFromUrl: flow(function* (url: string) {
      try {
        const { params, errorCode } = QueryParams.getQueryParams(url)

        if (params.error) throw new Error(params.error)
        if (errorCode) throw new Error(errorCode)

        // eslint-disable-next-line camelcase
        const { access_token, refresh_token } = params

        // eslint-disable-next-line camelcase
        if (!access_token) return

        const { error } = yield supabase.auth.setSession({
          // eslint-disable-next-line camelcase
          access_token,
          // eslint-disable-next-line camelcase
          refresh_token,
        })
        if (error) throw Error(error.message)

        // store.handleSuccessfulAuth(data.session, data.session.user.id)
      } catch (e) {
        handleError("errors:linkProblem")
        const navigation = useNavigation<NavigationProp<AppStackParamList>>()
        navigation.navigate("Welcome")
      }
    }),
    setupAuthListener() {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(
        async (event: AuthChangeEvent, session: Session | null) => {
          // NEVER MAKE A SUPABASE REQUEST ON AUTH CHANGE EVENT
          switch (event) {
            case "SIGNED_IN":
              console.log("Signed in")
              if (store.authToken) getRootStore(store).chatStore.connect(store.authToken)
              break
            case "SIGNED_OUT":
              store.logout()
              break

            case "TOKEN_REFRESHED":
              console.log("TOKEN_REFRESHED")
              if (session?.access_token) {
                store.setAuthToken(session.access_token)
                store.distributeAuthToken(session.access_token)
                getRootStore(store).chatStore.connect(session?.access_token)
              }
              break

            case "USER_UPDATED":
              console.log("USER_UPDATED")
              break
          }
        },
      )

      store.authSubscription = subscription
    },
  }))
  .actions((store) => ({
    afterCreate() {
      store.setupAuthListener()
    },
    beforeDestroy() {
      if (store.authSubscription) {
        store.authSubscription.unsubscribe()
      }
    },
  }))

export interface AuthenticationStore extends Instance<typeof AuthenticationStoreModel> {}
export interface AuthenticationStoreSnapshot extends SnapshotOut<typeof AuthenticationStoreModel> {}
