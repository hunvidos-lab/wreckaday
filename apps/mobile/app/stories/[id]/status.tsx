import { Text } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { Job, Story } from "@wreckday/contracts";
import { useApi } from "../../../src/api";
import { Button, ErrorText, Page, styles } from "../../../src/ui";
export default function Status() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const api = useApi();
  const query = useQuery({
    queryKey: ["story", id],
    queryFn: () => api<Story>(`/v1/stories/${id}`),
    refetchInterval: 2000,
  });
  const retry = useMutation({
    mutationFn: () =>
      api<Job>(`/v1/stories/${id}/generate`, {
        method: "POST",
        headers: {
          "Idempotency-Key": `retry-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        },
      }),
    onSuccess: (job) => router.push(`/jobs/${job.id}`),
  });
  return (
    <Page back>
      <Text style={styles.eyebrow}>PERSISTENT JOB STATUS</Text>
      <Text style={styles.title}>{query.data?.state ?? "Loading…"}</Text>
      <Text style={styles.body}>
        {["failed", "canceled"].includes(query.data?.state ?? "")
          ? "The attempt stopped. Reserved credits were returned. You can retry for 3 demo credits."
          : "Your story remains on the server when you leave the app."}
      </Text>
      <ErrorText error={query.error ?? retry.error} />
      {query.data?.state === "completed" && (
        <Button
          label="Open editor"
          onPress={() => router.replace(`/stories/${id}/edit`)}
        />
      )}
      {["failed", "canceled", "created"].includes(query.data?.state ?? "") && (
        <Button
          disabled={retry.isPending}
          label="Retry · reserve 3 demo credits"
          onPress={() => retry.mutate()}
        />
      )}
      {query.data?.latest_job_id && (
        <Button
          secondary
          label="Open last job"
          onPress={() => router.push(`/jobs/${query.data?.latest_job_id}`)}
        />
      )}
      <Button
        secondary
        label="Make another story"
        onPress={() => router.push("/templates")}
      />
    </Page>
  );
}
