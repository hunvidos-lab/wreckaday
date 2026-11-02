import { Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation } from "@tanstack/react-query";
import { request } from "../src/api";
import { useSession } from "../src/session";
import { Button, ErrorText, Page, styles } from "../src/ui";
export default function Auth() {
  const { save } = useSession();
  const { next } = useLocalSearchParams<{ next?: string }>();
  const login = useMutation({
    mutationFn: async (account: string) => {
      const response = await request<{ access_token: string }>(
        "/v1/dev/session",
        null,
        { method: "POST", body: JSON.stringify({ account }) },
      );
      await save(response.access_token);
      router.replace(
        next === "/library" ? "/library" : "/create/seven-foot-fiancee",
      );
    },
  });
  return (
    <Page back>
      <Text style={styles.eyebrow}>DEVELOPMENT SIGN-IN</Text>
      <Text style={styles.title}>Your private{"\n"}little disaster.</Text>
      <Text style={styles.body}>
        Use an isolated demo account. Each starts with 30 pretend credits. These
        accounts are shared fixtures, so don’t enter personal information.
      </Text>
      <View style={styles.panel}>
        <Button
          disabled={login.isPending}
          label="Continue as Alex"
          onPress={() => login.mutate("alex")}
        />
        <Button
          secondary
          disabled={login.isPending}
          label="Continue as Sam"
          onPress={() => login.mutate("sam")}
        />
      </View>
      <ErrorText error={login.error} />
      <Text style={styles.small}>
        No email, password, real money, or external account connection. Supabase
        email sign-in is a later milestone.
      </Text>
    </Page>
  );
}
