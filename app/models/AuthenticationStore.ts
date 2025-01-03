import { api } from "@/services/api"
import { Instance, SnapshotOut, types, flow, IAnyModelType } from "mobx-state-tree"
import { getRootStore } from "./helpers/getRootStore"
import { supabase } from "@/services/auth/supabase"
import { AuthChangeEvent, AuthError, Session } from "@supabase/supabase-js"

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
  }))
  .views((store) => ({
    get isAuthenticated(): boolean {
      return !!store.authToken
    },
    get validationError(): string {
      if (store.authEmail.length === 0) return "can't be blank"
      if (store.authEmail.length < 6) return "must be at least 6 characters"
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(store.authEmail))
        return "must be a valid email address"
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
    logout(): void {
      store.authToken = undefined
      store.authEmail = ""
      store.error = undefined
      api.apisauce.deleteHeader("Authorization")
      getRootStore(store).userStore.clearUser()
    },
  }))
  .actions((store) => ({
    handleSuccessfulAuth: flow(function* (
      session: Session,
      userId: string,
    ): Generator<any, boolean, any> {
      if (!session?.access_token || !userId) {
        store.setError("Invalid session data")
        return false
      }

      // First fetch profile
      const profileSuccess = yield getRootStore(store).userStore.fetchProfile(userId)
      if (!profileSuccess) {
        store.setError("Failed to load user profile")
        return false
      }

      // Then set auth state
      store.setAuthToken(session.access_token)
      store.setAuthEmail(session.user?.email ?? "")
      store.distributeAuthToken(session.access_token)

      return true
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

    register: flow(function* (email: string, password: string, name: string) {
      store.setLoading(true)
      store.setError(undefined)

      try {
        const { data, error }: { data: any; error: AuthError } = yield supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
            },
          },
        })

        if (error) {
          store.setError(error.message)
          return false
        }

        if (data.session) {
          const success = yield store.handleSuccessfulAuth(data.session, data.user?.id)
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
    setupAuthListener() {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(
        async (event: AuthChangeEvent, session: Session | null) => {
          switch (event) {
            case "SIGNED_IN":
              // Only handle automatic sign-ins (not from login/register)
              if (session?.access_token && !store.authToken) {
                await store.handleSuccessfulAuth(session, session.user?.id)
              }
              break

            case "SIGNED_OUT":
              store.logout()
              break

            case "TOKEN_REFRESHED":
              if (session?.access_token) {
                store.setAuthToken(session.access_token)
                store.distributeAuthToken(session.access_token)
              }
              break

            case "USER_UPDATED":
              if (session?.user?.id) {
                await getRootStore(store).userStore.fetchProfile(session.user.id)
              }
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
