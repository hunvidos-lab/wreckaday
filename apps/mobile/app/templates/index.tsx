import { Text, View } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import type { Template } from "@wreckday/contracts";
import { useApi } from "../../src/api";
import {
  Button,
  ErrorText,
  FrameCard,
  Page,
  fixtures,
  styles,
} from "../../src/ui";
export default function Templates() {
  const api = useApi();
  const query = useQuery({
    queryKey: ["templates"],
    queryFn: () => api<Template[]>("/v1/templates"),
  });
  return (
    <Page>
      <Text style={styles.eyebrow}>GOOD STORIES. TERRIBLE JUDGMENT.</Text>
      <Text style={styles.title}>Pick your{"\n"}downfall.</Text>
      <Text style={styles.body}>
        A little romance. A little renovation. Absolutely no sensible decisions.
      </Text>
      <ErrorText error={query.error} />
      {query.isError && (
        <Button
          secondary
          label="Retry connection"
          onPress={() => void query.refetch()}
        />
      )}
      <View style={{ maxWidth: 520, width: "100%" }}>
        <FrameCard
          source={fixtures[0]}
          caption={query.data?.[0]?.title ?? "She's moving in."}
          label="01 / BAD ROMANCE"
        />
      </View>
      <Text style={styles.body}>
        {query.data?.[0]?.premise ??
          "A very tall fictional fiancée. A very ordinary apartment."}
      </Text>
      <View style={styles.row}>
        <Text style={styles.small}>3 FRAMES / 11 SEC / 3 DEMO CREDITS</Text>
      </View>
      <Button
        label="Explore this disaster →"
        onPress={() => router.push("/templates/seven-foot-fiancee")}
      />
      <Text style={styles.small}>
        ONE COMPLETE HERO SCENARIO IN GATE 1. MORE AFTER QUALITY TESTING.
      </Text>
    </Page>
  );
}
