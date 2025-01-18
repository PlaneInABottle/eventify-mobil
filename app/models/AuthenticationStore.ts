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
      } catch (e) {
        if (e instanceof Error) console.error(e.message)
        else console.error("There was an unknown error while logging out")
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
        console.error(error)
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
