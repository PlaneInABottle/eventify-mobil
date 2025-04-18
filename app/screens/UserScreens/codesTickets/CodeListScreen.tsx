import { Observer, observer } from "mobx-react-lite"
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
import { ContentStyle } from "@shopify/flash-list"
import QRCode from "react-native-qrcode-svg"
import { CodesTicketsTabScreenProps } from "@/navigators/userNavigationTypes"
import { IUserCampaignCode } from "@/models/userStores/UserCampaignCodeStore"

export const CodeListScreen: FC<CodesTicketsTabScreenProps<"CodeListScreen">> = observer(
  function CodesListScreen(_props) {
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
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <View style={themed($heading)}>
              <Text preset="heading" tx="codeListScreen:campaignCodes" />
            </View>
          }
          renderItem={({ item }) => (
            <Observer>
              {() => <CampaignCodeListItem item={item} bottomSeparator rightIcon="caretRight" />}
            </Observer>
          )}
        />
      </Screen>
    )
  },
)

interface ICampaignCodeListItem extends ListItemProps {
  item: IUserCampaignCode
}

const CampaignCodeListItem = observer(function CampaignCodeListItem(props: ICampaignCodeListItem) {
  const { item, ...ListItemProps } = props

  console.log("ITEM: ", item)
  const {
    themed,
    theme: { spacing },
  } = useAppTheme()

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
            await item.useCode()
          },
        },
      ],
    )
  }
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
        {"\n"}
        <Text
          weight="light"
          size="xxs"
          tx="codeListScreen:lightIsUsed"
          txOptions={{
            isUsed: item.is_used,
          }}
        />
      </ListItem>
      <BottomSheetModal
        ref={sheet}
        backgroundStyle={themed($bottomSheetBackground)}
        stackBehavior="replace"
        handleIndicatorStyle={themed($handleIndicator)}
        enableDismissOnClose
        detached={true}
        snapPoints={["80%"]}
        bottomInset={bottom + spacing.xxxl}
        backdropComponent={(props) => (
          <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
        )}
        footerComponent={(props) =>
          !item.is_used && (
            <BottomSheetFooter {...props} style={themed($bottomSheetFooter)} bottomInset={bottom}>
              <Button tx={"codeListScreen:useCode"} preset="reversed" onPress={handleUseCode} />
            </BottomSheetFooter>
          )
        }
      >
        <BottomSheetView style={themed($bottomSheetContent)}>
          <View style={themed($qrContainer)}>
            <QRCode value={item.code} size={150} />
          </View>
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
const $screenContentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingBottom: spacing.xxl,
  paddingHorizontal: spacing.lg,
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
const $qrContainer: ThemedStyle<ViewStyle> = ({ colors }) => ({
  justifyContent: "center",
  alignItems: "center",
})
const $bottomSheetBackground: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.background,
})

const $handleIndicator: ThemedStyle<ViewStyle> = ({ colors }) => ({
  backgroundColor: colors.palette.neutral800,
})

const $bottomSheetContent: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  gap: spacing.lg,
  paddingHorizontal: spacing.lg,
})
const $bottomSheetFooter: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingHorizontal: spacing.lg,
  paddingBottom: spacing.xs,
})
