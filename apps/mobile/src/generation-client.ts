import type { Draft } from "./composer-model";
import { photoData } from "./photo-data";
const API = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";
export type Capabilities = {
  generation_available: boolean;
  photo_processing: string;
};
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API}${path}`, init);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new Error(
      init?.method === "POST"
        ? "The connection was interrupted. Provider work may still complete; no automatic retry was made."
        : "The generation service is unavailable. Your selected photo has not been sent for generation.",
    );
  }
  const body = await response.json();
  if (!response.ok)
    throw new Error(
      body.error?.message ?? "Generation could not be completed.",
    );
  return body.data as T;
}
export const capabilities = () => request<Capabilities>("/v2/capabilities");
export async function generateStory(draft: Draft, signal: AbortSignal) {
  if (!draft.photoUri) throw new Error("Upload an authorized photo first.");
  const photo_data_url = await photoData(draft.photoUri);
  if (signal.aborted) throw new Error("Generation canceled.");
  return request<{
    scenes: { caption: string; image_data_url: string }[];
    cost_ceiling_usd: string;
  }>("/v2/generate", {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": `prank-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    },
    body: JSON.stringify({
      package_id: draft.packageId,
      premise: draft.brief,
      photo_data_url,
      adult_confirmed: true,
      own_photo_confirmed: true,
      provider_processing_confirmed: true,
    }),
  });
}
