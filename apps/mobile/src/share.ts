import { Linking, Platform } from "react-native";
import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
export async function shareMedia(
  url: string,
  filename: string,
  mimeType: string,
) {
  if (Platform.OS === "web") {
    await Linking.openURL(url);
    return;
  }
  const directory = new Directory(Paths.cache, "wreckday");
  directory.create({ idempotent: true, intermediates: true });
  const destination = new File(directory, filename);
  if (destination.exists) destination.delete();
  const downloaded = await File.downloadFileAsync(url, destination);
  if (!(await Sharing.isAvailableAsync()))
    throw new Error(
      "Sharing is unavailable on this device. Your media is still saved in your library.",
    );
  await Sharing.shareAsync(downloaded.uri, {
    mimeType,
    UTI: mimeType === "video/mp4" ? "public.mpeg-4" : "public.png",
    dialogTitle: "Share your AI fiction story",
  });
}
