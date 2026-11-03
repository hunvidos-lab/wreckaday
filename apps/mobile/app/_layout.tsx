import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Text } from "react-native";
import { ComposerProvider } from "../src/composer";
import { clearAssets } from "../src/local-images";
import { DevConsoleProvider } from "../src/dev-console";
export default function Layout() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    clearAssets()
      .then(() => setReady(true))
      .catch(() => setError(true));
  }, []);
  if (!ready)
    return (
      <Text
        style={{ color: "#f5f2ee", backgroundColor: "#09090b", padding: 40 }}
      >
        {error
          ? "Could not clear the previous session cache. Restart the app to try again."
          : "Opening Wreckaday…"}
      </Text>
    );
  return (
    <ComposerProvider>
      <DevConsoleProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#09090b" },
          }}
        />
      </DevConsoleProvider>
    </ComposerProvider>
  );
}
