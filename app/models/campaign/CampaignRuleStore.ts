import { Instance, SnapshotIn, types } from "mobx-state-tree"
import { CampaignModel } from "./CampaignStore"
import { withSetPropAction } from "../helpers/withSetPropAction"

const CampaignRule = types.enumeration("CampaignRule", [
  "MAX_PER_USER",
  "DAILY_LIMIT",
  "TOTAL_CODE_LIMIT",
  "MIN_INTERVAL",
])

export const CampaignRuleModel = types.model("CampaignRule").props({
  id: types.identifier,
  campaign_id: types.reference(CampaignModel),
  rule_type: CampaignRule,
  rule_value: types.number,
})

export const CampaignRuleStoreModel = types
  .model("CampaignRuleStore")
  .props({
    rules: types.array(CampaignRuleModel),
  })
  .views((self) => ({
    get rulesAsList() {
      return self.rules.slice()
    },
    rulesByCampaignId(campaignId?: string) {
      return self.rules.filter((rule) => rule.campaign_id.id === campaignId)
    },
  }))
  .actions(withSetPropAction)

export interface ICampaignRule extends Instance<typeof CampaignRuleModel> {}
export interface ICampaignRuleSnapshotIn extends SnapshotIn<typeof CampaignRuleModel> {}

export interface ICampaignRuleStore extends Instance<typeof CampaignRuleStoreModel> {}
