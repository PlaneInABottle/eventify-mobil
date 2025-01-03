import { api } from "@/services/api"
import { Instance, SnapshotOut, types, flow } from "mobx-state-tree"
import { getRootStore } from "./helpers/getRootStore"
import { supabase } from "@/services/auth/supabase"
import { AuthChangeEvent, AuthError, Session } from "@supabase/supabase-js"

export const AuthenticationStoreModel = types
  .model("AuthenticationStore")
  .props({
    authToken: types.maybe(types.string),
    authEmail: "",
  })
  .volatile(() => ({
    isLoading: false,
    error: null as string | null,
    authSubscription: null as any, // or proper Supabase subscription type
  }))
  .views((store) => ({
    get isAuthenticated() {
      return !!store.authToken
    },
    get validationError() {
      if (store.authEmail.length === 0) return "can't be blank"
      if (store.authEmail.length < 6) return "must be at least 6 characters"
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(store.authEmail))
        return "must be a valid email address"
      return ""
    },
  }))
  .actions((store) => ({
    fetchProfile: flow(function* (userId: string) {
      if (!userId) {
        store.error = "User ID is required"
        return false
      }

      try {
        const { data: profile, error } = yield supabase
          .from("profiles")
          .select("*")
          .eq("id", userId)
          .single()

        if (error) {
          store.error = error.message
          return false
        }

        if (!profile) {
          store.error = "Profile not found"
          return false
        }

        getRootStore(store).userStore.setUser(profile)
        return true
      } catch (error) {
        store.error = error instanceof Error ? error.message : "An unexpected error occurred"
        return false
      }
    }),
  }))
  .actions((store) => ({
    setAuthToken(value?: string) {
      store.authToken = value
    },
    distributeAuthToken(value?: string) {
      // optionally grab the store's authToken if not passing a value
      const token = value || store.authToken
      api.apisauce.setHeader("Authorization", `Bearer ${token}`)
    },
    setAuthEmail(value: string) {
      store.authEmail = value.replace(/ /g, "")
    },
    logout() {
      store.authToken = undefined
      store.authEmail = ""
      api.apisauce.deleteHeader("Authorization")
      getRootStore(store).userStore.clearUser()
    },
    clearError() {
      store.error = null
    },
  }))
  .actions((store) => ({
    handleSuccessfulAuth: flow(function* (session: Session, userId: string) {
      if (!session?.access_token || !userId) {
        store.error = "Invalid session data"
        return false
      }

      store.setAuthToken(session.access_token)
      store.setAuthEmail(session.user?.email ?? "")
      const profileSuccess = yield store.fetchProfile(userId)
      return profileSuccess
    }),
  }))
  .actions((store) => ({
    login: flow(function* (email: string, password: string) {
      const { data, error }: { data: any; error: AuthError } =
        yield supabase.auth.signInWithPassword({
          email,
          password,
        })

      if (error) {
        store.error = error.message
        return false
      }

      if (data.session) {
        yield store.handleSuccessfulAuth(data.session, data.user?.id)
        return true
      }

      return false
    }),

    register: flow(function* (email: string, password: string, name: string) {
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
        store.error = error.message
        return false
      }

      if (data.session) {
        yield store.handleSuccessfulAuth(data.session, data.user?.id)
        return true
      }

      return false
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
              }
              break

            case "USER_UPDATED":
              if (session?.user?.id) {
                await store.fetchProfile(session.user.id)
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
      // Properly remove the listener using the stored subscription
      if (store.authSubscription) {
        store.authSubscription.unsubscribe()
      }
    },
  }))
export interface AuthenticationStore extends Instance<typeof AuthenticationStoreModel> {}
export interface AuthenticationStoreSnapshot extends SnapshotOut<typeof AuthenticationStoreModel> {}
