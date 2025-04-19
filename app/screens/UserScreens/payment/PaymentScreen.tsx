import { Button, Header, Screen } from "@/components"
import { useStores } from "@/models"
import { AppStackScreenProps } from "@/navigators"
import { $styles } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import { useHeader } from "@/utils/useHeader"
import { observer } from "mobx-react-lite"
import { FC, useState } from "react"
import { Modal } from "react-native"

export const PaymentScreen: FC<AppStackScreenProps<"UserPaymentScreen">> = observer(
  function PaymenScreen(_props) {
    const { goBack } = _props.navigation
    const { userPaymentStore } = useStores()
    const { themed } = useAppTheme()

    const [showWebViewModal, setShowWebViewModal] = useState(false)

    useHeader({
      title: "Event Payment Infor",
      leftIcon: "back",
      onLeftPress: () => goBack(),
    })

    const handleToggleModal = () => {
      setShowWebViewModal(!showWebViewModal)
    }

    return (
      <Screen preset="fixed" contentContainerStyle={$styles.flex1}>
        <Modal visible={showWebViewModal} animationType="slide">
          <Header
            title="Payment"
            safeAreaEdges={["bottom"]}
            leftIcon="back"
            onLeftPress={() => setShowWebViewModal(false)}
          />
        </Modal>
        <Button text="Open Close Modal" onPress={handleToggleModal} />
      </Screen>
    )
  },
)

export default PaymentScreen
