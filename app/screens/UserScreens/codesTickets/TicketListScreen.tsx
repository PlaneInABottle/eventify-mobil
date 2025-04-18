import { observer } from "mobx-react-lite"
import { $styles, type ThemedStyle } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import { FC, useCallback, useRef } from "react"
import { Button, ListItem, ListItemProps, ListView, Screen, Text } from "@/components"
import { Alert, View, ViewStyle } from "react-native"
import { useStores } from "@/models"
import {
  BottomSheetBackdrop,
  BottomSheetFooter,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { translate } from "@/i18n"
import { CodesTicketsTabScreenProps } from "@/navigators/userNavigationTypes"
import { IUserCampaignCode } from "@/models/userStores/UserCampaignCodeStore"
import { ContentStyle } from "@shopify/flash-list"

export const TicketListScreen: FC<CodesTicketsTabScreenProps<"TicketListScreen">> = observer(
  function TicketListScreen(_props) {
    const { navigation } = _props
    const navigate = navigation.navigate

    const { userCampaignCodeStore } = useStores()

    const { themed } = useAppTheme()
    return (
      <Screen preset="fixed" contentContainerStyle={$styles.flex1}>
        <ListView<IUserCampaignCode>
          data={userCampaignCodeStore.codesAsList}
          contentContainerStyle={themed($listContentContainer)}
          estimatedItemSize={10}
          ListHeaderComponent={
            <View style={themed($heading)}>
              <Text preset="heading" tx="ticketListScreen:tickets" />
            </View>
          }
          renderItem={({ item }) => (
            <TicketListItem item={item} bottomSeparator rightIcon="caretRight" />
          )}
        />
      </Screen>
    )
  },
)

interface ITicketListItem extends ListItemProps {
  item: IUserCampaignCode
}

const TicketListItem = observer(function TicketListItem(props: ITicketListItem) {
  const { item, ...ListItemProps } = props

  const { themed } = useAppTheme()

  const { bottom } = useSafeAreaInsets()

  const sheet = useRef<BottomSheetModal>(null)

  const presentOptions = useCallback(() => {
    sheet.current?.present()
  }, [])

  const dismissOptions = useCallback(() => {
    sheet.current?.dismiss()
  }, [])

  const handleUseCode = () => {
    Alert.alert(
      translate("codeListScreen:useCodeWarning"),
      translate("codeListScreen:useCodeWarningDescription"),
      [
        {
          text: translate("common:cancel"),
          style: "cancel",
        },
        {
          text: translate("codeListScreen:useCode"),
          onPress: async () => {
            item.useCode()
            dismissOptions()
          },
        },
      ],
    )
  }

  const handleTicketPayment = () => {}
  return (
    <>
      <ListItem {...ListItemProps} onPress={presentOptions}>
        <Text
          tx="codeListScreen:title"
          txOptions={{
            title: item.campaign_id.title,
          }}
        />
        {"\n"}
        <Text
          weight="light"
          size="xxs"
          tx="codeListScreen:publisherNameAndTime"
          txOptions={{
            publisherName: item.campaign_id.publisher_id.display_name,
            time: item.timeFormatted.textLabel,
          }}
        />
      </ListItem>
      <BottomSheetModal
        ref={sheet}
        backgroundStyle={themed($bottomSheetBackground)}
        stackBehavior="replace"
        handleIndicatorStyle={themed($handleIndicator)}
        enableDismissOnClose
        detached
        snapPoints={["80%"]}
        bottomInset={bottom} // What is this
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
        )}
        footerComponent={(props) => (
          <BottomSheetFooter {...props} style={themed($bottomSheetFooter)} bottomInset={bottom}>
            <Button tx={"codeListScreen:useCode"} preset="reversed" onPress={handleUseCode} />
          </BottomSheetFooter>
        )}
      >
        <BottomSheetView style={themed($bottomSheetContent)}>
          <Text
            tx={"codeListScreen:code"}
            txOptions={{
              code: item.code,
            }}
          />
          <Text
            tx={"codeListScreen:isUsed"}
            txOptions={{
              isUsed: item.is_used,
            }}
          />
        </BottomSheetView>
      </BottomSheetModal>
    </>
  )
})

const $listContentContainer: ThemedStyle<ContentStyle> = ({ spacing }) => ({
  paddingTop: spacing.lg,
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing.lg,
})

const $heading: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  marginBottom: spacing.md,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
})
const $bottomSheetBackground: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background,
})

const $handleIndicator: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.neutral800,
})

const $bottomSheetContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
})
const $bottomSheetFooter: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing.xs,
})
