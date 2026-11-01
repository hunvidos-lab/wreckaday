import { Text, View } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "../src/session";
import { API, useApi } from "../src/api";
import { Button, ErrorText, Page, styles } from "../src/ui";
export default function Settings() {
  const { token, save } = useSession();
  const api = useApi();
  const query = useQuery({
    queryKey: ["wallet"],
    queryFn: () => api<{ available: number; reserved: number }>("/v1/wallet"),
    enabled: !!token,
  });
  return (
    <Page back>
      <Text style={styles.eyebrow}>THE SMALL PRINT / DEVELOPMENT</Text>
      <Text style={styles.title}>No nasty{"\n"}surprises.</Text>
      <View style={styles.panel}>
        <Text style={styles.heading}>Demo wallet</Text>
        <Text style={styles.body}>
          {token
            ? `${query.data?.available ?? "…"} available · ${query.data?.reserved ?? "…"} reserved`
            : "Sign in to see demo credits."}
        </Text>
        <Text style={styles.small}>
          No purchases, subscriptions, real charges, or inference API calls.
          Demo accounts are shared fixtures.
        </Text>
      </View>
      <ErrorText error={query.error} />
      <View style={styles.panel}>
        <Text style={styles.heading}>Privacy in this preview</Text>
        <Text style={styles.body}>
          Don’t enter personal information. Stories and exports are stored
          locally on the development server. There are no photo uploads,
          contacts, messaging integrations, or analytics SDKs. Delete a story in
          its editor to remove its media.
        </Text>
        <Text style={styles.body}>
          Media links expire after five minutes. Native logout clears the
          session and downloaded export cache. Web tokens stay in memory.
        </Text>
        <Text style={styles.small}>API: {API}</Text>
      </View>
      <View style={styles.panel}>
        <Text style={styles.heading}>Before a public beta</Text>
        <Text style={styles.body}>
          Real email sign-in, account deletion, reporting, reviewed legal
          policies, private cloud storage, and physical-device testing are still
          required. This build is development-only.
        </Text>
      </View>
      {token ? (
        <Button
          label="Sign out & clear local cache"
          onPress={() => void save(null).then(() => router.replace("/"))}
        />
      ) : (
        <Button
          label="Development sign-in"
          onPress={() => router.push("/auth")}
        />
      )}
    </Page>
  );
}
