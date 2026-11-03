import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { Platform } from "react-native";

const API = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";
export type KeySnapshot = {
  values: Record<string, string | boolean | { set: boolean; last4: string }>;
  generation_available: boolean;
  restart_required: boolean;
};
type ConsoleSession = {
  status: "hidden" | "locked" | "ready";
  token: string;
  unlock: (token: string) => Promise<KeySnapshot>;
  lock: () => void;
};
const Context = createContext<ConsoleSession | null>(null);
export function localConsole() {
  if (!__DEV__ || Platform.OS !== "web" || typeof window === "undefined")
    return false;
  const hosts = ["localhost", "127.0.0.1", "[::1]"];
  try {
    return (
      hosts.includes(window.location.hostname) &&
      hosts.includes(new URL(API).hostname)
    );
  } catch {
    return false;
  }
}
export async function consoleRequest<T>(
  token: string,
  init?: RequestInit,
): Promise<T> {
  if (!localConsole())
    throw new Error("The key console is only available in local development.");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(
      `${API}/v2/dev/keys${init?.method === "POST" ? "/test" : ""}`,
      {
        ...init,
        signal: controller.signal,
        cache: "no-store",
        credentials: "omit",
        referrerPolicy: "no-referrer",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );
    if (!response.ok)
      throw new Error(
        response.status === 401
          ? "Paste the console token from the current Terminal window."
          : response.status === 409
            ? "Wait for generation to finish before saving."
            : "The local console could not complete that request. Check the fields and connection.",
      );
    const body = await response.json();
    return body.data as T;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError")
      throw new Error(
        "The console request timed out. Check saved settings before trying again.",
      );
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
export function DevConsoleProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ConsoleSession["status"]>("hidden");
  const [token, setToken] = useState(""); // Admin password only. Provider keys never enter this context.
  useEffect(() => {
    if (!localConsole()) return;
    let active = true;
    fetch(`${API}/v2/dev/keys`, { cache: "no-store", credentials: "omit" })
      .then((response) => {
        if (active && response.status === 401) setStatus("locked");
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  async function unlock(password: string) {
    const snapshot = await consoleRequest<KeySnapshot>(password);
    setToken(password);
    setStatus("ready"); // Only a successful authenticated GET makes the Keys link visible.
    return snapshot;
  }
  return (
    <Context.Provider
      value={{
        status,
        token,
        unlock,
        lock: () => {
          setToken("");
          setStatus("locked");
        },
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useDevConsole() {
  const value = useContext(Context);
  if (!value) throw new Error("Console context is unavailable.");
  return value;
}
