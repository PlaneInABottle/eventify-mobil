import { api } from "@/services/api"
import { Instance, SnapshotOut, types, flow } from "mobx-state-tree"
import { getRootStore } from "./helpers/getRootStore"

export const AuthenticationStoreModel = types
  .model("AuthenticationStore")
  .props({
    authToken: types.maybe(types.string),
    authEmail: "",
  })
  .volatile(() => ({
    isLoading: false,
    error: null,
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
    login: flow(function* (email: string, password: string) {
      const response = yield api.login(email, password)
      if (response.kind === "ok") {
        store.setAuthToken(response.token)
        store.setAuthEmail(response.user.email)
        getRootStore(store).userStore.setUser(response.user)
        store.distributeAuthToken(response.token)
        store.error = null
      } else {
        store.error = response.kind
      }
    }),
  }))

export interface AuthenticationStore extends Instance<typeof AuthenticationStoreModel> {}
export interface AuthenticationStoreSnapshot extends SnapshotOut<typeof AuthenticationStoreModel> {}
