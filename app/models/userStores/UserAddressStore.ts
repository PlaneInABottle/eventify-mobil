import { IAnyModelType, Instance, SnapshotIn, applySnapshot, flow, types } from "mobx-state-tree"
import { withSetPropAction } from "@/models/helpers/withSetPropAction"
import { getRootStore } from "../helpers/getRootStore"
import { supabase } from "@/services/auth/supabase"
import { handleError } from "@/utils/errorHandler"
import { handleSuccess } from "@/utils/successHandler"

export const UserAddressModel = types.model("UserAddress").props({
  id: types.identifier,
  user_id: types.maybeNull(types.string),
  title: types.string,
  city: types.string,
  country: types.string,
  address: types.string,
  zip_code: types.string,
})

export const UserAddressStoreModel: IAnyModelType = types
  .model("UserAddressStore")
  .props({
    addresses: types.array(UserAddressModel),
  })
  .views((store) => ({
    get addressesForList() {
      return store.addresses.slice()
    },
    get forSelectField() {
      return store.addresses
        .map((val) => {
          return { label: val.title, value: val.id }
        })
        .slice()
    },
    addressById(addressId: string | undefined) {
      return store.addresses.find((addr) => addr.id === addressId)
    },
  }))
  .actions(withSetPropAction)
  .actions((store) => ({
    upsertAddress: flow(function* (
      fields: Omit<IUserAddressSnapshotIn, "id" | "user_id"> & { id?: string },
    ) {
      try {
        const userId = getRootStore(store).userAuthenticationStore.getUserId
        let result
        if (fields.id) {
          result = yield supabase
            .from("addresses")
            .update(fields)
            .eq("id", fields.id)
            .select()
            .single()
            .throwOnError()

          const existingAddress = store.addressById(fields.id)
          if (existingAddress && result.data) {
            // Apply snapshot to update the existing MST node efficiently
            applySnapshot(existingAddress, result.data)
          }
        } else {
          result = yield supabase
            .from("addresses")
            .insert({ user_id: userId, ...fields })
            .select()
            .single()
            .throwOnError()

          if (result.data) {
            store.addresses.push(result.data)
          }
        }

        handleSuccess("success:addressSaved")
        return true
      } catch (error) {
        return handleError(error).message
      }
    }),
  }))

export interface IUserAddress extends Instance<typeof UserAddressModel> {}
export interface IUserAddressSnapshotIn extends SnapshotIn<typeof UserAddressModel> {}

export interface IUserAddressStore extends Instance<typeof UserAddressStoreModel> {}
