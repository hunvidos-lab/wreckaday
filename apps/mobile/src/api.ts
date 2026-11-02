import { useSession } from "./session";
export const API = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function request<T>(
  path: string,
  token: string | null,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  const body = await response.json();
  if (!response.ok)
    throw new ApiError(
      body.error?.message ?? "Something went wrong. Please retry.",
      response.status,
    );
  return body.data as T;
}
export function useApi() {
  const { token } = useSession();
  return <T>(path: string, init?: RequestInit) => request<T>(path, token, init);
}
