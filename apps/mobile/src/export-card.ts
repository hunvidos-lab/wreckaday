import type { RefObject, ComponentRef } from "react";
import type { View } from "react-native";
import { captureRef, releaseCapture } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import type { Scene } from "./composer-model";
export async function exportCard(
  view: RefObject<ComponentRef<typeof View> | null>,
  _scene: Scene,
): Promise<void> {
  void _scene;
  if (!(await Sharing.isAvailableAsync()))
    throw new Error("Sharing is unavailable on this device.");
  const uri = await captureRef(view, {
    format: "png",
    result: "tmpfile",
    width: 1080,
    height: 1920,
  });
  try {
    await Sharing.shareAsync(uri, {
      mimeType: "image/png",
      UTI: "public.png",
      dialogTitle: "Share your fictional prank",
    });
  } finally {
    releaseCapture(uri);
  }
}
