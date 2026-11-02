import * as ImagePicker from "expo-image-picker";
import { Directory, File, Paths } from "expo-file-system";
const directory = () => new Directory(Paths.cache, "wreckaday-session");
export async function clearAssets() {
  const folder = directory();
  if (folder.exists) folder.delete();
}
export async function pickImage(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: false,
    quality: 1,
    exif: false,
  });
  if (result.canceled) return null;
  const asset = result.assets[0];
  const source = new File(asset.uri);
  const owned = asset.uri.startsWith(Paths.cache.uri);
  try {
    if (
      asset.width * asset.height > 24_000_000 ||
      source.size > 10 * 1024 * 1024
    )
      throw new Error("Choose an image under 10 MB and 24 megapixels.");
    directory().create({ intermediates: true, idempotent: true });
    const destination = new File(
      directory(),
      `${Date.now()}-${Math.random().toString(36).slice(2)}.${
        asset.uri
          .split(".")
          .pop()
          ?.replace(/[^a-z0-9]/gi, "") || "jpg"
      }`,
    );
    source.copy(destination);
    return destination.uri;
  } finally {
    if (owned && source.exists) source.delete();
  }
}
