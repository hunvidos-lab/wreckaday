const assets = new Set<string>();
export async function clearAssets() {
  for (const uri of assets) URL.revokeObjectURL(uri);
  assets.clear();
}
export async function pickImage(): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/png,image/jpeg,image/webp";
    input.oncancel = () => resolve(null);
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      if (
        !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
        file.size > 10 * 1024 * 1024
      ) {
        reject(new Error("Choose a PNG, JPEG or WebP under 10 MB."));
        return;
      }
      const uri = URL.createObjectURL(file);
      try {
        const image = new Image();
        image.src = uri;
        await image.decode();
        if (image.naturalWidth * image.naturalHeight > 24_000_000)
          throw new Error("Choose an image under 24 megapixels.");
        assets.add(uri);
        resolve(uri);
      } catch {
        URL.revokeObjectURL(uri);
        reject(
          new Error(
            "This image could not be opened. Choose a PNG, JPEG or WebP under 24 megapixels.",
          ),
        );
      }
    };
    input.click();
  });
}
