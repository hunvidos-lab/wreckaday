import { shareMedia } from "../../../src/share";
import { useEffect, useState } from "react";
import { Platform, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Job, Story } from "@wreckday/contracts";
import { useApi } from "../../../src/api";
import {
  Button,
  ErrorText,
  Field,
  FrameCard,
  Page,
  styles,
} from "../../../src/ui";
export default function Editor() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const api = useApi();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ["story", id],
    queryFn: () => api<Story>(`/v1/stories/${id}`),
  });
  const [captions, setCaptions] = useState<string[]>([]);
  const [order, setOrder] = useState([0, 1, 2]);
  const [reveal, setReveal] = useState("");
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (query.data && !dirty) {
      setCaptions(query.data.frames.map((f) => f.caption));
      setOrder([0, 1, 2]);
      setReveal(query.data.reveal);
    }
  }, [query.data, dirty]);
  const save = useMutation({
    mutationFn: () =>
      api<Story>(`/v1/stories/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          revision: query.data?.revision,
          captions,
          order,
          reveal,
        }),
      }),
    onSuccess: (story) => {
      setDirty(false);
      client.setQueryData(["story", id], story);
      void client.invalidateQueries({ queryKey: ["library"] });
    },
  });
  const exportJob = useMutation({
    mutationFn: () => api<Job>(`/v1/stories/${id}/export`, { method: "POST" }),
    onSuccess: (job) => {
      if (job.state === "completed") void query.refetch();
      else router.push(`/jobs/${job.id}`);
    },
  });
  const share = useMutation({
    mutationFn: async () => {
      const latest = await api<Story>(`/v1/stories/${id}`);
      const url = latest.export_url;
      if (!url) throw new Error("Save your edits and render the export first.");
      await shareMedia(
        url,
        `WRECKDAY-${id}-r${latest.revision}.mp4`,
        "video/mp4",
      );
    },
  });
  const shareStill = useMutation({
    mutationFn: async (position: number) => {
      const latest = await api<Story>(`/v1/stories/${id}`);
      const url = latest.frames[position]?.still_url;
      if (!url)
        throw new Error(
          "Save changes and render first to update your still images.",
        );
      await shareMedia(
        url,
        `WRECKDAY-${id}-${position + 1}-r${latest.revision}.png`,
        "image/png",
      );
    },
  });
  const remove = useMutation({
    mutationFn: () => api(`/v1/stories/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ["library"] });
      router.replace("/library");
    },
  });
  const [deleting, setDeleting] = useState(false);
  function move(position: number) {
    setOrder((previous) => {
      const next = [...previous];
      [next[position], next[position - 1]] = [
        next[position - 1],
        next[position],
      ];
      return next;
    });
    setDirty(true);
  }
  return (
    <Page back>
      <Text style={styles.eyebrow}>THE CUT / YOUR STORY EDITOR</Text>
      <Text style={styles.title}>Make it worse.{"\n"}Word by word.</Text>
      <ErrorText error={query.error} />
      {query.isError && (
        <Button label="Reload story" onPress={() => void query.refetch()} />
      )}
      {query.isPending && <Text style={styles.body}>Loading your story…</Text>}
      {query.data?.state === "completed" && (
        <>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 18 }}>
            {order.map((index, position) => {
              const frame = query.data?.frames[index];
              return (
                frame && (
                  <View
                    key={frame.id}
                    style={{ flex: 1, minWidth: 240, gap: 12 }}
                  >
                    <FrameCard
                      source={{ uri: frame.url }}
                      caption={captions[index] ?? frame.caption}
                      label={`0${position + 1} / AI FICTION`}
                    />
                    <Field
                      label={`CAPTION ${position + 1} · ${(captions[index] ?? "").length}/140`}
                      value={captions[index] ?? ""}
                      onChange={(text) => {
                        setCaptions((old) =>
                          old.map((v, i) => (i === index ? text : v)),
                        );
                        setDirty(true);
                      }}
                    />
                    <Button
                      secondary
                      label={
                        Platform.OS === "web"
                          ? "Download this still ↓"
                          : "Share this still ↗"
                      }
                      disabled={
                        dirty || !frame.still_url || shareStill.isPending
                      }
                      onPress={() => shareStill.mutate(position)}
                    />
                    {position > 0 && (
                      <Button
                        secondary
                        label="Move earlier ↑"
                        onPress={() => move(position)}
                      />
                    )}
                  </View>
                )
              );
            })}
          </View>
          <View style={styles.panel}>
            <Text style={styles.heading}>The reveal.</Text>
            <Field
              label="FINAL END CARD · AI FICTION LABEL IS ALWAYS ADDED"
              value={reveal}
              onChange={(text) => {
                setReveal(text);
                setDirty(true);
              }}
              maxLength={180}
            />
            <Text style={styles.small}>
              Every exported frame keeps its AI FICTION watermark, including
              after caption edits.
            </Text>
          </View>
          <ErrorText
            error={
              save.error ??
              exportJob.error ??
              share.error ??
              shareStill.error ??
              remove.error
            }
          />
          <View style={styles.row}>
            <Button
              label={save.isPending ? "Saving…" : "Save changes"}
              disabled={!dirty || save.isPending}
              onPress={() => save.mutate()}
            />
            <Button
              secondary
              label={
                exportJob.isPending ? "Starting render…" : "Render MP4 · free"
              }
              disabled={dirty || exportJob.isPending}
              onPress={() => exportJob.mutate()}
            />
            <Button
              label={
                share.isPending
                  ? "Preparing…"
                  : Platform.OS === "web"
                    ? "Download MP4 ↓"
                    : "Share MP4 ↗"
              }
              disabled={dirty || !query.data.export_url || share.isPending}
              onPress={() => share.mutate()}
            />
          </View>
          {dirty && (
            <Text style={styles.small}>
              Save changes before exporting. Re-render after saving to include
              your new captions.
            </Text>
          )}
          <Button
            secondary
            label="Open story preview"
            onPress={() => router.push(`/stories/${id}/preview`)}
          />
          {deleting ? (
            <View style={styles.panel}>
              <Text style={styles.body}>
                Delete this story and its exported media permanently?
              </Text>
              <Button
                label="Delete story and media"
                disabled={remove.isPending}
                onPress={() => remove.mutate()}
              />
              <Button
                secondary
                label="Keep it"
                onPress={() => setDeleting(false)}
              />
            </View>
          ) : (
            <Button
              secondary
              label="Delete story"
              onPress={() => setDeleting(true)}
            />
          )}
        </>
      )}
    </Page>
  );
}
