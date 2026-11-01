import { useEffect } from "react";
import { Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Job } from "@wreckday/contracts";
import { useApi } from "../../src/api";
import { Button, ErrorText, Page, styles, color } from "../../src/ui";
export default function Progress() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();
  const api = useApi();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => api<Job>(`/v1/jobs/${jobId}`),
    refetchInterval: (q) =>
      ["completed", "failed", "canceled"].includes(q.state.data?.state ?? "")
        ? false
        : 1500,
  });
  useEffect(() => {
    if (query.data?.state === "completed") {
      void client.invalidateQueries({ queryKey: ["wallet"] });
      void client.invalidateQueries({
        queryKey: ["story", query.data.story_id],
      });
      void client.invalidateQueries({ queryKey: ["library"] });
      router.replace(`/stories/${query.data.story_id}/edit`);
    }
  }, [query.data, client]);
  const cancel = useMutation({
    mutationFn: () => api<Job>(`/v1/jobs/${jobId}/cancel`, { method: "POST" }),
    onSuccess: () => {
      void query.refetch();
      void client.invalidateQueries({ queryKey: ["wallet"] });
    },
  });
  return (
    <Page back>
      <Text style={styles.eyebrow}>THE CONSEQUENCES ARE LOADING</Text>
      <Text style={styles.title}>
        {query.data?.kind === "export"
          ? "Making it cinematic."
          : "Building a bad idea."}
      </Text>
      <Text style={styles.body}>
        You can leave this screen. Your job is stored on the server and can be
        reopened from your library.
      </Text>
      <View style={styles.panel}>
        <Text style={styles.heading}>
          {query.data?.state?.toUpperCase() ?? "CONNECTING"}
        </Text>
        <View
          accessibilityRole="progressbar"
          accessibilityValue={{
            min: 0,
            max: 100,
            now: query.data?.progress ?? 0,
          }}
          style={{ height: 8, backgroundColor: color.line, borderRadius: 5 }}
        >
          <View
            style={{
              height: 8,
              width: `${query.data?.progress ?? 0}%`,
              backgroundColor: color.acid,
              borderRadius: 5,
            }}
          />
        </View>
        <Text style={styles.body}>
          {query.data?.progress ?? 0}% · Mock provider · $0 inference
        </Text>
      </View>
      <ErrorText
        error={
          query.error ??
          (query.data?.state === "failed"
            ? new Error(
                `${query.data.error_code}. Generation holds have been returned. Your library keeps the job status.`,
              )
            : null)
        }
      />
      {query.isError && (
        <Button label="Retry connection" onPress={() => void query.refetch()} />
      )}
      <ErrorText error={cancel.error} />
      {!["completed", "failed", "canceled"].includes(
        query.data?.state ?? "",
      ) && (
        <Button
          secondary
          label="Cancel this job"
          disabled={cancel.isPending}
          onPress={() => cancel.mutate()}
        />
      )}
      {["failed", "canceled"].includes(query.data?.state ?? "") && (
        <Button
          secondary
          label="View story & retry"
          onPress={() => router.push(`/stories/${query.data?.story_id}/status`)}
        />
      )}
      <Button
        secondary
        label="Open library"
        onPress={() => router.push("/library")}
      />
    </Page>
  );
}
