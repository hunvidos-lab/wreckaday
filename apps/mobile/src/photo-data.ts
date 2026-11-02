import { File } from "expo-file-system";
export async function photoData(uri: string): Promise<string> {
  if (!uri.startsWith("file://") && !uri.startsWith("content://"))
    throw new Error("Choose a photo from this device.");
  const file = new File(uri);
  const extension = uri.split(".").pop()?.toLowerCase();
  const mime =
    extension === "png"
      ? "image/png"
      : extension === "webp"
        ? "image/webp"
        : "image/jpeg";
  return `data:${mime};base64,${await file.base64()}`;
}
