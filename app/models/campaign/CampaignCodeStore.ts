import { Instance, SnapshotIn, flow, types } from "mobx-state-tree"
import { CampaignModel } from "./CampaignStore"
import { UserModel } from "../User"
import { withSetPropAction } from "../helpers/withSetPropAction"
import { formatDate } from "@/utils/formatDate"
import { supabase } from "@/services/auth/supabase"
import { handleError } from "@/utils/errorHandler"

export const CampaignCodeModel = types
  .model("CampaignCode")
  .props({
    id: types.identifier,
    campaign_id: types.reference(CampaignModel),
    user_id: types.reference(UserModel),
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

export const CampaignCodeStoreModel = types
  .model("CampaignCodeStore")
  .props({
    codes: types.array(CampaignCodeModel),
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
    addCode(campaignCode: ICampaignCodeSnapshotIn) {
      store.codes.push(campaignCode)
    },
  }))

export interface ICampaignCode extends Instance<typeof CampaignCodeModel> {}
export interface ICampaignCodeSnapshotIn extends SnapshotIn<typeof CampaignCodeModel> {}

export interface ICampaignCodeStore extends Instance<typeof CampaignCodeStoreModel> {}
