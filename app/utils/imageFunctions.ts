import * as ImagePicker from "expo-image-picker"

export async function pickSingleImage(pathIdentifier: string) {
  const result: ImagePicker.ImagePickerResult = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsMultipleSelection: false,
    allowsEditing: true,
    quality: 1,
    exif: false,
  })

  if (result.canceled || !result.assets?.[0]?.uri) return null
  const image = result.assets[0]
  const fileExt = image.uri?.split(".").pop()?.toLowerCase() ?? "jpeg"
  const path = `${pathIdentifier}/${Date.now()}.${fileExt}`

  const arraybuffer = await fetch(image.uri).then((res) => res.arrayBuffer())
  return {
    path,
    mimeType: image.mimeType ?? "image/jpeg",
    buffer: arraybuffer,
    uri: image.uri,
  }
}

export function convertImageURLToSupabaseURL(bucketName: string, imageURL: string) {
  return `${process.env.EXPO_PUBLIC_SUPABASE_URL!}/storage/v1/object/public/${bucketName}/${imageURL}`
}
