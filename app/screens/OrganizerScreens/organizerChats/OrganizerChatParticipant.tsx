import { observer } from "mobx-react-lite"
import { useStores } from "../../../models"
import type { ThemedStyle } from "@/theme"
import { useAppTheme } from "@/utils/useAppTheme"
import { FC, useCallback, useRef } from "react"
import { AutoImage, ListItem, ListView, Screen } from "@/components"
import { ImageStyle, View, ViewStyle } from "react-native"
import { OrganizerChatStackScreenProps } from "@/navigators/navigationTypes"
import { IOrganizerChatParticipant } from "@/models/organizer/OrganizerChatStore"
import { useHeader } from "@/utils/useHeader"
import { convertImageURLToSupabaseURL } from "@/utils/imageFunctions"
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet"
import { handleError } from "@/utils/errorHandler"
import { TxKeyPath } from "@/i18n"

export const OrganizerChatParticipantScreen: FC<
  OrganizerChatStackScreenProps<"OrganizerChatParticipantScreen">
> = observer(function OrganizerChatParticipantScreen(_props) {
  const { eventChatId } = _props.route.params
  const { organizerChatStore } = useStores()
  const { goBack } = _props.navigation
  const { themed } = useAppTheme()

  const eventChat = organizerChatStore.chatById(eventChatId)

  useHeader({
    titleTx: "organizerChatParticipantScreen:headerTitle",
    titleTxOptions: { eventName: eventChat?.events_dates_locations_id.event_id.title },
    leftIcon: "back",
    onLeftPress: () => goBack(),
  })

  const handleLoadMore = useCallback(() => {
    eventChat?.fetchParticipants()
  }, [eventChat])

  return (
    <Screen preset="auto" contentContainerStyle={themed($screenContentContainer)}>
      <ListView<IOrganizerChatParticipant>
        data={eventChat?.participantsAsList}
        estimatedItemSize={100}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        renderItem={({ item }) => (
          <OrganizerChatParticipantListItem
            id={item.id}
            avatarURL={item.avatar_url}
            displayName={item.display_name}
            onRemoveParticipant={eventChat?.removeParticipant}
          />
        )}
      />
    </Screen>
  )
})

interface IOrganizerChatParticipantListItemProps {
  id: string
  displayName: string
  avatarURL?: string | null
  onRemoveParticipant: ((participantId: string) => Promise<void>) | undefined
}

const OrganizerChatParticipantListItem: FC<IOrganizerChatParticipantListItemProps> = observer(
  function ChatListItem(props) {
    const { id, displayName, avatarURL, onRemoveParticipant } = props
    const { themed } = useAppTheme()
    const sheet = useRef<BottomSheetModal>(null)

    const presentOptions = useCallback(() => {
      sheet.current?.present()
    }, [])

    const dismissOptions = useCallback(() => {
      sheet.current?.dismiss()
    }, [])

    return (
      <>
        <ListItem
          LeftComponent={
            avatarURL ? (
              <AutoImage
                source={{ uri: convertImageURLToSupabaseURL("avatars", avatarURL) }}
                style={themed($avatarStyle)}
              />
            ) : (
              <View style={themed($avatarStyle)} />
            )
          }
          text={displayName}
          bottomSeparator
          rightIcon="caretRight"
          onPress={presentOptions}
        />
        <BottomSheetModal
          ref={sheet}
          backgroundStyle={themed($bottomSheetBackground)}
          stackBehavior="replace"
          enableDynamicSizing
          handleIndicatorStyle={themed($handleIndicator)}
          enableDismissOnClose
          backdropComponent={(props) => (
            <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} />
          )}
        >
          <BottomSheetView style={themed($bottomSheetContent)}>
            <ListItem
              tx="organizerChatParticipantScreen:removeParticipant"
              rightIcon="caretRight"
              onPress={() =>
                onRemoveParticipant
                  ? onRemoveParticipant(id)
                  : handleError("errors:unknown" as TxKeyPath)
              }
            />
          </BottomSheetView>
        </BottomSheetModal>
      </>
    )
  },
)

const $screenContentContainer: ThemedStyle<ViewStyle> = ({ spacing }) => ({
  paddingBottom: spacing.xxl,
  paddingHorizontal: spacing.lg,
})

const $avatarStyle: ThemedStyle<ImageStyle> = ({ spacing }) => ({
  height: 50,
  width: 50,
  borderRadius: spacing.xxxl,
  margin: spacing.xs,
  marginRight: spacing.lg,
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
