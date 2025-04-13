import { Instance, SnapshotOut, types, flow, IAnyModelType } from "mobx-state-tree"
import { AuthChangeEvent, AuthError, Session } from "@supabase/supabase-js"
import { supabase } from "@/services/auth/supabase"
import { handleError } from "@/utils/errorHandler"
import { handleSuccess } from "@/utils/successHandler"
import { decodeJwt } from "@/utils/decodeJwt"
import { getRootStore } from "@/models/helpers/getRootStore"
import { withSetPropAction } from "@/models/helpers/withSetPropAction"
import { UserRole } from "@/enums/userRoles"

export const UserAuthenticationStoreModel: IAnyModelType = types
  .model("UserAuthenticationStore")
  .props({
    authEmail: types.maybeNull(types.string),
    authRole: types.maybeNull(types.string),
    userId: types.maybeNull(types.string),
  })
  .volatile(() => ({
    authSubscription: null as any, // or proper Supabase subscription type, wtf is this
    error: undefined as string | undefined,
  }))
  .views((store) => ({
    get isAuthenticated(): boolean {
      return !!store.authEmail && !!store.userId
    },
  }))
  .actions(withSetPropAction)
  .actions((store) => ({
    clearUserAuthentication() {
      store.authEmail = null
      store.authRole = null
      store.userId = null
    },
  }))
  .actions((store) => ({
    logoutUser: flow(function* () {
      try {
        // Logout from supabase
        getRootStore(store).resetAllStores()
        const { error } = yield supabase.auth.signOut()
        if (error) throw error

        handleSuccess("success:logoutSuccess")
      } catch (e) {
        handleError(e)
      }
    }),
    userFirstRequest: flow(function* () {
      const userId = store.userId

      const [profileRes, eventChatsRes] = yield Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        supabase.rpc("get_user_chat_events", {
          _user_id: userId,
        }),
      ])

      if (profileRes.error || eventChatsRes.error) {
        throw profileRes.error || eventChatsRes.error
      }

      getRootStore(store).organizerEventStore.setProp("events", eventChatsRes.data.events ?? [])
      getRootStore(store).locationStore.setProp("locations", eventChatsRes.data.locations ?? [])
      getRootStore(store).publisherStore.setProp("publishers", eventChatsRes.data.publishers ?? [])
      getRootStore(store).organizerEventDateLocationStore.setProp(
        "datesLocations",
        eventChatsRes.data.datesLocations ?? [],
      )
      getRootStore(store).organizerChatStore.setProp("chats", eventChatsRes.data.eventChats ?? [])
      getRootStore(store).campaignStore.setProp("campaigns", eventChatsRes.data.campaigns ?? [])
      getRootStore(store).campaignRuleStore.setProp("rules", eventChatsRes.data.campaignRules ?? [])
      getRootStore(store).campaignCodeStore.setProp("codes", eventChatsRes.data.campaignCodes ?? [])
      getRootStore(store).userStore.setProp("user", profileRes.data ?? [])
    }),
    userFirstRequestV2: flow(function* () {
      const userId = store.userId
      const [
        favoriteEvents,
        favoriteEventsLocations,
        favoriteEventsPublishers,
        favoriteEventsDatesLocations,
        joinedEventChats,
        relatedCampaigns,
        unusedCampaignCodes,
        userProfile,
      ] = yield Promise.all([
        supabase.rpc("find_user_favorite_events", {
          _user_id: userId,
        }),
        supabase.rpc("find_user_favorite_event_locations", {
          _user_id: userId,
        }),
        supabase.rpc("find_publishers_of_favorite_events", {
          _user_id: userId,
        }),
        supabase.rpc("find_favorite_dates_locations", {
          _user_id: userId,
        }),
        supabase.rpc("find_user_joined_event_chats", {
          _user_id: userId,
        }),
        supabase.rpc("find_user_related_campaigns", {
          _user_id: userId,
        }),
        supabase.rpc("find_user_unused_campaign_codes", {
          _user_id: userId,
        }),
        supabase.from("profiles").select("*").eq("id", userId).single(),
      ])

      getRootStore(store).userEventStore.setProp("events", favoriteEvents.data ?? [])
      getRootStore(store).userLocationStore.setProp("locations", favoriteEventsLocations.data ?? [])
      getRootStore(store).userPublisherStore.setProp(
        "publishers",
        favoriteEventsPublishers.data ?? [],
      )
      getRootStore(store).userEventDateLocationStore.setProp(
        "datesLocations",
        favoriteEventsDatesLocations.data ?? [],
      )
      getRootStore(store).userChatStore.setProp("chats", joinedEventChats.data ?? [])
      getRootStore(store).userCampaignStore.setProp("campaigns", relatedCampaigns.data ?? [])
      getRootStore(store).userCampaignCodeStore.setProp("codes", unusedCampaignCodes.data ?? [])
      getRootStore(store).userProfileStore.setProp("profile", userProfile.data ?? [])
    }),
  }))
  .actions((store) => ({
    loginUser: flow(function* (email: string, password: string) {
      try {
        const { data, error }: { data: any; error: AuthError } =
          yield supabase.auth.signInWithPassword({
            email,
            password,
          })

        if (error) {
          throw error
        }
        const decodedToken: any = decodeJwt(data.session.access_token)

        store.setProp("authRole", decodedToken.user_role)
        store.setProp("authEmail", decodedToken.email)
        store.setProp("userId", decodedToken.sub)

        store.userFirstRequestV2()

        handleSuccess("success:loginSuccess")
        return true
        /*
        if (data.session) {
          yield store.handleSuccessfulAuth(data.session, data.user?.id)
          handleSuccess("success:loginSuccess")
          return true
        }
            */

        // throw Error("errors:notFound")
      } catch (error) {
        return handleError(error).message
      }
    }),
    registerUser: flow(function* (email: string, password: string, displayName: string) {
      try {
        const { data, error }: { data: any; error: AuthError } = yield supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: displayName,
              role: UserRole.User,
            },
          },
        })

        if (error) {
          throw error
        }

        if (data.session) {
          // const success = yield store.handleSuccessfulAuth(data.session, data.user?.id)
          // handleSuccess("success:signUpSuccess")
          // return success
        }

        throw Error("errors:notFound")
      } catch (error) {
        handleError(error)
        return false
      }
    }),
    setupAuthListener() {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(
        async (event: AuthChangeEvent, session: Session | null) => {
          // NEVER MAKE A SUPABASE REQUEST ON AUTH CHANGE EVENT
          switch (event) {
            case "INITIAL_SESSION":
              console.log("init session")
              break
            case "SIGNED_IN":
              console.log("Signed In")
              // if (store.authToken) getRootStore(store).chatStore.connect()
              //      store.setProp("authToken", session?.access_token)
              break
            case "SIGNED_OUT":
              console.log("Signed Out")
              break

            case "TOKEN_REFRESHED":
              console.log("TOKEN_REFRESHED")
              if (session?.access_token) {
                // store.setAuthToken(session.access_token)
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

export interface UserAuthenticationStore extends Instance<typeof UserAuthenticationStoreModel> {}
export interface UserAuthenticationStoreSnapshot
  extends SnapshotOut<typeof UserAuthenticationStoreModel> {}
