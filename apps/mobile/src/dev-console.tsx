import type { ReactNode } from "react";
export type { KeySnapshot } from "./dev-console-runtime";

// Metro substitutes an empty dependency when __DEV__ is false. No console probe/form in release builds.
/* eslint-disable @typescript-eslint/no-require-imports */
const runtime: typeof import("./dev-console-runtime") | null = __DEV__
  ? require("./dev-console-runtime")
  : null;
const hidden = {
  status: "hidden" as const,
  token: "",
  unlock: async () => {
    throw new Error("The key console is unavailable in this build.");
  },
  lock: () => {},
};
export function DevConsoleProvider({ children }: { children: ReactNode }) {
  return runtime ? (
    <runtime.DevConsoleProvider>{children}</runtime.DevConsoleProvider>
  ) : (
    children
  );
}
export const localConsole = () => runtime?.localConsole() ?? false;
export function useDevConsole() {
  return runtime ? runtime.useDevConsole() : hidden;
}
export async function consoleRequest<T>(
  token: string,
  init?: RequestInit,
): Promise<T> {
  if (!runtime)
    throw new Error("The key console is unavailable in this build.");
  return runtime.consoleRequest<T>(token, init);
}
