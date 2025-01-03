import { api } from "@/services/api"
import { Instance, SnapshotOut, types, flow } from "mobx-state-tree"
import { getRootStore } from "./helpers/getRootStore"
import { supabase } from "@/services/auth/supabase"
import { AuthError, QueryError } from "@supabase/supabase-js"

export const AuthenticationStoreModel = types
  .model("AuthenticationStore")
  .props({
    authToken: types.maybe(types.string),
    authEmail: "",
  })
  .volatile(() => ({
    isLoading: false,
    error: null as string | null,
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
      try {
        const {
          data: profile,
          error,
        }: {
          data: any
          error: QueryError
        } = yield supabase.from("profiles").select("*").eq("id", userId).single()

        if (error) {
          store.error = error.message
          return false
        }

        // Update the user store with profile data
        getRootStore(store).userStore.setUser(profile)
        return true
      } catch (error: any) {
        // Carefull about types
        store.error = error.message ? error.message : "There was an error"
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
    handleSuccessfulAuth: flow(function* (session, userId) {
      if (session?.access_token) {
        store.setAuthToken(session.access_token)
        // store.distributeAuthToken(session.access_token) // Do we need it ? Or can we handle everything with supabase client ?
        store.setAuthEmail(session.user?.email ?? "")
        // Fetch profile after setting auth token
        yield store.fetchProfile(userId)
      }
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
  }))

export interface AuthenticationStore extends Instance<typeof AuthenticationStoreModel> {}
export interface AuthenticationStoreSnapshot extends SnapshotOut<typeof AuthenticationStoreModel> {}
