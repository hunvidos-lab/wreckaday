import { Text, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import type { Story } from "@wreckday/contracts";
import { useApi } from "../../../src/api";
import { Button, ErrorText, FrameCard, Page, styles } from "../../../src/ui";
export default function Preview() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const api = useApi();
  const query = useQuery({
    queryKey: ["story", id],
    queryFn: () => api<Story>(`/v1/stories/${id}`),
  });
  return (
    <Page back>
      <Text style={styles.eyebrow}>THE FINAL CUT / AI FICTION</Text>
      <Text style={styles.title}>{query.data?.title ?? "Your story."}</Text>
      <ErrorText error={query.error} />
      <View
        style={{ maxWidth: 480, width: "100%", alignSelf: "center", gap: 18 }}
      >
        {query.data?.frames.map((frame, i) => (
          <FrameCard
            key={frame.id}
            source={{ uri: frame.url }}
            caption={frame.caption}
            label={`0${i + 1} / AI FICTION`}
          />
        ))}
        <View style={styles.panel}>
          <Text style={styles.heading}>{query.data?.reveal}</Text>
          <Text style={styles.small}>AI FICTION · WRECKDAY</Text>
        </View>
      </View>
      <Button
        label="Back to editor & export"
        onPress={() => router.replace(`/stories/${id}/edit`)}
      />
    </Page>
  );
}
