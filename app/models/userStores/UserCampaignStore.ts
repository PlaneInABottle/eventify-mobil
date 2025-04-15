import { Instance, SnapshotIn, flow, types } from "mobx-state-tree"
import { supabase } from "@/services/auth/supabase"
import { handleError } from "@/utils/errorHandler"
import { getRootStore } from "@/models/helpers/getRootStore"
import { withSetPropAction } from "@/models/helpers/withSetPropAction"
import { UserPublisherModel } from "@/models/userStores/UserPublisherStore"
import { UserLocationModel } from "@/models/userStores/UserLocationStore"

export const UserCampaignModel = types
  .model("UserCampaign")
  .props({
    id: types.identifier,
    title: types.string,
    details: types.string,
    end_date: types.maybeNull(types.string),
    image_url: types.maybeNull(types.string),
    publisher_id: types.reference(UserPublisherModel),
    location_id: types.reference(UserLocationModel),
    is_user_favorite: types.maybeNull(types.boolean),
  })
  .actions((item) => ({
    toggleFavorite: flow(function* (): Generator<any, void, any> {
      try {
        const userId = getRootStore(item).userAuthenticationStore.getUserId

        yield supabase
          .rpc("toggle_favorite_campaign", {
            _user_id: userId,
            _campaign_id: item.id,
          })
          .throwOnError()

        item.is_user_favorite = !item.is_user_favorite
      } catch (e) {
        handleError(e)
      }
    }),
    generateCampaignCode: flow(function* (): Generator<any, void, any> {
      try {
        const userId = getRootStore(item).userAuthenticationStore.getUserId
        const { data } = yield supabase
          .from("campaign_codes")
          .insert({
            campaign_id: item.id,
            user_id: userId,
          })
          .select()
          .single()
          .throwOnError()

        getRootStore(item).userCampaignCodeStore.addCode(data)
      } catch (e) {
        handleError(e)
      }
    }),
  }))

export const UserCampaignStoreModel = types
  .model("UserCampaignStore")
  .props({
    campaigns: types.array(UserCampaignModel),
  })
  .views((self) => ({
    get campaignsAsList() {
      return self.campaigns.slice()
    },
    campaignById(campaignId?: string) {
      return self.campaigns.find((cam) => cam.id === campaignId)
    },
  }))
  .actions(withSetPropAction)

export interface IUserCampaign extends Instance<typeof UserCampaignModel> {}
export interface IUserCampaignSnapshotIn extends SnapshotIn<typeof UserCampaignModel> {}

export interface IUserCampaignStore extends Instance<typeof UserCampaignStoreModel> {}
