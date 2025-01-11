import { Button, Screen, Text, TextField } from "@/components"
import { useStores } from "@/models"
import { AppStackScreenProps } from "@/navigators"
import { $styles, ThemedStyle } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import { useHeader } from "@/utils/useHeader"
import { observer } from "mobx-react-lite"
import { FC, useCallback, useState } from "react"
import { ViewStyle } from "react-native"

export const ReportScreen: FC<AppStackScreenProps<"Report">> = observer(
  function ReportScreen(_props) {
    const { reportedItemId, reportType } = _props.route.params
    const { userStore } = useStores()
    const { themed } = useAppTheme()
    const [reason, setReason] = useState("")

    useHeader(
      {
        title: "Report ",
        leftIcon: "back",
        onLeftPress: () => _props.navigation.navigate("Main", { screen: "ChatList" }),
      },
      [],
    )

    const handleSendReport = useCallback(() => {
      userStore.report(reportedItemId, reportType, reason)
      setReason("")
    }, [reason])

    return (
      <Screen preset="fixed" contentContainerStyle={$styles.container}>
        <TextField
          value={reason}
          onChangeText={setReason}
          placeholder="Please state the report reason"
          label="Reason"
          readOnly={userStore.isLoading}
          multiline
        />
        <Button
          disabled={!reason.trim() || userStore.isLoading}
          disabledStyle={themed($disabledButton)}
          text="Send Report"
          onPress={handleSendReport}
          style={themed($sendButtonStyle)}
        />
      </Screen>
    )
  },
)

const $sendButtonStyle: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.lg,
})
const $disabledButton: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.tintInactive,
})
