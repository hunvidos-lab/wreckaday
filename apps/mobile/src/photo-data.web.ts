export async function photoData(uri: string): Promise<string> {
  if (!uri.startsWith("blob:"))
    throw new Error("Choose a photo from this device.");
  const blob = await (await fetch(uri)).blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("The photo could not be read."));
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(blob);
  });
}
