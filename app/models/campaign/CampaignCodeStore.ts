import { Instance, SnapshotIn, types } from "mobx-state-tree"
import { CampaignModel } from "./CampaignStore"
import { UserModel } from "../User"

export const CampaignCodeModel = types.model("CampaignCode").props({
  id: types.identifier,
  campaign_id: types.reference(CampaignModel),
  user_id: types.reference(UserModel),
  code: types.string,
  is_used: types.boolean,
})

export const CampaignCodeStoreModel = types.model("CampaignCodeStore").props({
  codes: types.array(CampaignCodeModel),
})

export interface ICampaignCode extends Instance<typeof CampaignCodeModel> {}
export interface ICampaignCodeSnapshotIn extends SnapshotIn<typeof CampaignCodeModel> {}

export interface ICampaignCodeStore extends Instance<typeof CampaignCodeStoreModel> {}
