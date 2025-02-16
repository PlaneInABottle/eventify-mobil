import { Instance, SnapshotIn, flow, types } from "mobx-state-tree"
import { LocationModel } from "../location/LocationStore"
import { PublisherModel } from "../organizer/OrganizerEventStore"
import { ICampaignRuleSnapshotIn } from "./CampaignRuleStore"
import { handleError } from "@/utils/errorHandler"
import { supabase } from "@/services/auth/supabase"
import { getRootStore } from "../helpers/getRootStore"
import { handleSuccess } from "@/utils/successHandler"
import { withSetPropAction } from "../helpers/withSetPropAction"

export const CampaignModel = types
  .model("Campaign")
  .props({
    id: types.identifier,
    title: types.string,
    details: types.string,
    end_date: types.maybeNull(types.string),
    image_url: types.maybeNull(types.string),
    publisher_id: types.reference(PublisherModel),
    location_id: types.reference(LocationModel),
    is_user_favorite: types.maybeNull(types.boolean),
  })
  .actions((item) => ({
    toggleFavorite: flow(function* () {
      try {
        const userId: string = getRootStore(item).userStore.userId
        const { error } = yield supabase.rpc("toggle_favorite_campaign", {
          _user_id: userId,
          _campaign_id: item.id,
        })
        if (error) throw error
        item.is_user_favorite = !item.is_user_favorite
      } catch (e) {
        handleError(e)
      }
    }),
    generateCampaignCode: flow(function* () {
      try {
        const userId: string = getRootStore(item).userStore.userId
        const { data, error } = yield supabase
          .from("campaign_codes")
          .insert({
            campaign_id: item.id,
            user_id: userId,
          })
          .select()
          .single()
        if (error) throw error
        getRootStore(item).campaignCodeStore.addCode(data)
      } catch (e) {
        handleError(e)
      }
    }),
  }))

export const CampaignStoreModel = types
  .model("CampaignStore")
  .props({
    campaigns: types.array(CampaignModel),
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
  .actions(() => ({
    uploadCampaignImage: flow(function* (image: { path: string; mimeType: string; buffer: any }) {
      // We catch error on top.
      const { data, error } = yield supabase.storage
        .from("campaigns")
        .upload(image.path, image.buffer, {
          contentType: image?.mimeType,
          upsert: true,
        })

      if (error) throw error

      return data.path
    }),
    deleteCampaignImage: flow(function* (imageIdentifier: string) {
      try {
        const { error } = yield supabase.storage.from("campaigns").remove([imageIdentifier])
        if (error) throw error
      } catch (e) {
        handleError(e, { toast: false })
      }
    }),
  }))
  .actions((store) => ({
    createUpdateCampaignWithRules: flow(function* (
      fields: Omit<ICampaignSnapshotIn, "id"> & {
        id?: string
        image?: {
          path: string
          mimeType: string
          buffer: any
        }
        campaignRules: (Omit<ICampaignRuleSnapshotIn, "id" | "campaign_id"> & {
          id?: string
        })[]
      },
    ) {
      try {
        const { image: newImage, campaignRules, ...campaignFields } = fields
        const isUpdate = !!fields.id

        if (newImage) {
          if (fields.image_url && isUpdate) store.deleteCampaignImage(fields.image_url)
          campaignFields.image_url = yield store.uploadCampaignImage(newImage)
        }
        const { error } = yield supabase.rpc("create_update_campaign", {
          _campaign_id: campaignFields.id,
          _campaign_data: { ...campaignFields },
          _rules: campaignRules,
        })

        if (error) throw error

        getRootStore(store).authenticationStore.organizerFirstRequest(campaignFields.publisher_id)
        handleSuccess("success:campaignSaved")
        return true
      } catch (e) {
        return handleError(e).message
      }
    }),
  }))

export interface ICampaign extends Instance<typeof CampaignModel> {}
export interface ICampaignSnapshotIn extends SnapshotIn<typeof CampaignModel> {}

export interface ICampaignStore extends Instance<typeof CampaignStoreModel> {}
