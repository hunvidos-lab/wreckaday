import { Redirect } from "expo-router";
import { localConsole } from "../src/dev-console";
export default function DevKeys() {
  if (!__DEV__ || !localConsole()) return <Redirect href="/" />;
  // Keep the management form outside production builds.
  /* eslint-disable @typescript-eslint/no-require-imports */
  const { DevKeysForm } =
    require("../src/dev-keys-form") as typeof import("../src/dev-keys-form");
  return <DevKeysForm />;
}
