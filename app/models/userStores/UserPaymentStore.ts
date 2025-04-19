import { Instance, types } from "mobx-state-tree"
import { withSetPropAction } from "../helpers/withSetPropAction"

export const UserPaymentStoreModel = types
  .model("UserPaymentStore")
  .props({})
  .views((self) => ({}))
  .actions(withSetPropAction)
  .actions((store) => ({}))

export interface IUserPaymentStore extends Instance<typeof UserPaymentStoreModel> {}
