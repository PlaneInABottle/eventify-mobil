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
    const { reportedItemId, reportType, reportContent } = _props.route.params
    const { userStore } = useStores()
    const { themed } = useAppTheme()
    const [reason, setReason] = useState("")

    useHeader(
      {
        titleTx: "reportScreen:report",
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
      <Screen preset="fixed" contentContainerStyle={themed($contentContainerExtraStyle)}>
        <TextField value={reportedItemId} labelTx="reportScreen:reportedItemId" editable={false} />
        <TextField value={reportType} labelTx="reportScreen:reportType" editable={false} />
        <TextField value={reportContent} labelTx="reportScreen:reportContent" editable={false} />

        <TextField
          value={reason}
          onChangeText={setReason}
          placeholderTx="reportScreen:textInputPlaceholder"
          labelTx="reportScreen:textInputLabel"
          readOnly={userStore.isLoading}
          multiline
        />
        <Button
          disabled={!reason.trim() || userStore.isLoading}
          disabledStyle={themed($disabledButton)}
          tx="reportScreen:sendReport"
          onPress={handleSendReport}
          style={themed($sendButtonStyle)}
        />
      </Screen>
    )
  },
)

const $contentContainerExtraStyle: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.xl,
  paddingTop: spacing.sm,
  paddingHorizontal: spacing.lg,
})

const $sendButtonStyle: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginTop: spacing.lg,
})
const $disabledButton: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.tintInactive,
})
