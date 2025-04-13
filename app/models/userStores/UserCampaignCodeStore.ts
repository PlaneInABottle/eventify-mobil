import { Instance, SnapshotIn, flow, types } from "mobx-state-tree"
import { supabase } from "@/services/auth/supabase"
import { formatDate } from "@/utils/formatDate"
import { handleError } from "@/utils/errorHandler"
import { UserCampaignModel } from "@/models/userStores/UserCampaignStore"
import { withSetPropAction } from "@/models/helpers/withSetPropAction"
import { UserProfileModel } from "@/models/userStores/UserProfileStore"

export const UserCampaignCodeModel = types
  .model("UserCampaignCode")
  .props({
    id: types.identifier,
    campaign_id: types.reference(UserCampaignModel),
    user_id: types.reference(UserProfileModel),
    code: types.string,
    is_used: types.boolean,
    created_at: types.string,
  })
  .views((self) => ({
    get timeFormatted() {
      const formatted = formatDate(self.created_at, "HH:mm")
      return {
        textLabel: formatted,
      }
    },
  }))
  .actions((store) => ({
    useCode: flow(function* () {
      try {
        const { error } = yield supabase
          .from("campaign_codes")
          .update({
            is_used: true,
          })
          .eq("id", store.id)

        if (error) throw error
        store.is_used = true
      } catch (e) {
        handleError(e)
      }
    }),
  }))

export const UserCampaignCodeStoreModel = types
  .model("UserCampaignCodeStore")
  .props({
    codes: types.array(UserCampaignCodeModel),
  })
  .views((self) => ({
    get codesAsList() {
      return self.codes.slice().sort((a, b) => {
        if (!a.is_used && b.is_used) {
          return -1 // a comes before b
        }
        if (a.is_used && !b.is_used) {
          return 1 // b comes before a
        }
        return 0 // a and b are equal
      })
    },
  }))
  .actions(withSetPropAction)
  .actions((store) => ({
    addCode(campaignCode: IUserCampaignCodeSnapshotIn) {
      store.codes.push(campaignCode)
    },
  }))

export interface IUserCampaignCode extends Instance<typeof UserCampaignCodeModel> {}
export interface IUserCampaignCodeSnapshotIn extends SnapshotIn<typeof UserCampaignCodeModel> {}

export interface IUserCampaignCodeStore extends Instance<typeof UserCampaignCodeStoreModel> {}
