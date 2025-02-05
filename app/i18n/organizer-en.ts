const organizerEn = {
  organizerRegister: {
    login: "Organizer's Login",
    register: "Organizer Register",
    topToSingUp: "Sign Up As Organizer",
    wantToOrganizer: "Want to register as an organizer ?",
    createOrganizer: "Create Organizer Account",
    detailsRegister: "Join as an organizer and create new events!",
  },
  organizerEventListScreen: {
    heading: "Events",
  },
  organizerEventEditScreen: {
    header: "{{eventTitle}}",
    title: "Event's Title",
    titlePlaceholder: "Enter Event's Title",
    description: "Event's Description",
    descriptionPlaceholder: "Enter Event's Description",
    startTime: "Event's Start Time",
    startTimePlaceholder: "Choose Event's Start Time",
    endTime: "Event's End Time",
    endTimePlacerholder: "Choose Event's End Time",
    location: "Event's Location",
    locationPlaceholder: "Choose Event's Location",
    image: "Event's Image",
    addImage: "Add Event Image",
    changeImage: "Change Event's Image",
    addEvent: "Add Event",
    date: "Event's Date",
    multipleDatesAndLocations: "Multiple Dates and Locations",
    addDateLocation: "Add New Date-Location",
  },
  organizerLocationListScreen: {
    heading: "Locations",
  },
  organizerLocationEditScreen: {
    name: "Location's Name",
    namePlaceholder: "Enter a descriptive name",
    address: "Location's Address",
    addressPlaceholder: "Enter address of the location",
    header: "{{locationName}}",
    dragMarker: "Note: Hold and Drag the marker",
    addLocation: "Add Location",
  },
  organizerChatListScreen: {
    heading: "Chats",
    title: "{{title}}'s Chat",
    dateTime: "{{date}}, {{time}}",
    participants: "Participants",
    conversation: "Conversation",
  },
  organizerChatEditScreen: {
    name: "Location's Name",
    namePlaceholder: "Enter a descriptive name",
    address: "Location's Address",
    addressPlaceholder: "Enter address of the location",
    header: "{{eventName}}'s Chat",
    dragMarker: "Note: Hold and Drag the marker",
    addChat: "Add Chat",
  },
  organizerChatParticipantScreen: {
    headerTitle: "{{eventName}} Chat's Participants",
    removeParticipant: "Remove Participant",
  },
  organizerChatConversationScreen: {
    headerTitle: "{{eventName}}'s Chat",
  },
}

export default organizerEn
export type Translations = typeof organizerEn
