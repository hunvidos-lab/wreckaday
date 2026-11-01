import { Text, View } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import type { Story } from "@wreckday/contracts";
import { useApi } from "../src/api";
import { useSession } from "../src/session";
import { Button, ErrorText, FrameCard, Page, styles } from "../src/ui";
export default function Library() {
  const api = useApi();
  const { token } = useSession();
  const query = useQuery({
    queryKey: ["library"],
    queryFn: () => api<Story[]>("/v1/stories"),
    enabled: !!token,
    refetchInterval: 4000,
  });
  return (
    <Page>
      <Text style={styles.eyebrow}>PRIVATE LIBRARY</Text>
      <Text style={styles.title}>The evidence.{"\n"}All fictional.</Text>
      <Text style={styles.body}>
        Saved on the local development server. Only your demo account can access
        these stories.
      </Text>
      {!token && (
        <Button
          label="Sign in to your library"
          onPress={() => router.push("/auth?next=/library")}
        />
      )}
      <ErrorText error={query.error} />
      {query.isError && (
        <Button label="Retry" onPress={() => void query.refetch()} />
      )}
      {token && query.data?.length === 0 && (
        <View style={styles.panel}>
          <Text style={styles.heading}>A suspiciously clean record.</Text>
          <Text style={styles.body}>
            Your first terrible idea belongs here.
          </Text>
          <Button
            label="Create a story"
            onPress={() => router.push("/templates")}
          />
        </View>
      )}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 20 }}>
        {query.data?.map((story) => (
          <View key={story.id} style={{ width: 280, gap: 12 }}>
            {story.frames[0] ? (
              <FrameCard
                source={{ uri: story.frames[0].url }}
                caption={story.title}
                label={story.state.toUpperCase()}
              />
            ) : (
              <View style={styles.panel}>
                <Text style={styles.heading}>{story.title}</Text>
                <Text style={styles.body}>{story.state}</Text>
              </View>
            )}
            <Button
              secondary
              label={
                story.state === "completed"
                  ? "Edit & export →"
                  : "View job status →"
              }
              onPress={() =>
                router.push(
                  story.state === "completed"
                    ? `/stories/${story.id}/edit`
                    : `/stories/${story.id}/status`,
                )
              }
            />
          </View>
        ))}
      </View>
      {(query.data?.length ?? 0) >= 20 && (
        <Text style={styles.small}>Showing your 20 newest stories.</Text>
      )}
    </Page>
  );
}
