import type { RefObject, ComponentRef } from "react";
import type { View } from "react-native";
import { FICTION_LABEL, REVEAL, type Scene } from "./composer-model";
function lines(context: CanvasRenderingContext2D, text: string, size: number) {
  context.font = `700 ${size}px sans-serif`;
  const output: string[] = [];
  let line = "";
  for (const char of Array.from(text.replace(/\s+/g, " ").trim())) {
    if (context.measureText(line + char).width > 936) {
      output.push(line);
      line = char;
    } else line += char;
  }
  output.push(line);
  return output;
}
export async function exportCard(
  view: RefObject<ComponentRef<typeof View> | null>,
  scene: Scene,
): Promise<void> {
  const element = view.current as unknown as HTMLElement | null;
  const src = element?.querySelector("img")?.src;
  if (!src) throw new Error("Wait for your image to load, then try again.");
  const image = new Image();
  image.src = src;
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Image export is unavailable in this browser.");
  const scale = Math.max(1080 / image.width, 1920 / image.height);
  context.drawImage(
    image,
    (1080 - image.width * scale) / 2,
    (1920 - image.height * scale) / 2,
    image.width * scale,
    image.height * scale,
  );
  const captionSize = scene.caption.length > 100 ? 42 : 52;
  const captionLines = lines(context, scene.caption, captionSize);
  const revealLines = lines(context, REVEAL, 30);
  const captionHeight = captionLines.length * captionSize * 1.35;
  const height = captionHeight + revealLines.length * 42 + 160;
  context.fillStyle = "rgba(12,12,14,0.9)";
  context.fillRect(0, 1920 - height, 1080, height);
  context.fillStyle = "#f2ede7";
  context.font = `700 ${captionSize}px sans-serif`;
  captionLines.forEach((line, index) =>
    context.fillText(
      line,
      72,
      1920 - height + 72 + captionSize + index * captionSize * 1.35,
    ),
  );
  context.font = "700 30px sans-serif";
  revealLines.forEach((line, index) =>
    context.fillText(
      line,
      72,
      1920 - height + 120 + captionHeight + 30 + index * 42,
    ),
  );
  context.font = "700 30px sans-serif";
  context.fillStyle = "rgba(12,12,14,0.85)";
  context.fillRect(48, 48, context.measureText(FICTION_LABEL).width + 48, 78);
  context.fillStyle = "#f2ede7";
  context.fillText(FICTION_LABEL, 72, 99);
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (value) =>
        value ? resolve(value) : reject(new Error("PNG export failed.")),
      "image/png",
    ),
  );
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `wreckaday-${scene.id}.png`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
