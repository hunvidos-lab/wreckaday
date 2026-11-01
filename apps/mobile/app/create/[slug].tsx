import { useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { useForm, Controller } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  storyInput,
  type StoryInput,
  type Story,
  type Job,
} from "@wreckday/contracts";
import { useApi, ApiError } from "../../src/api";
import { useSession } from "../../src/session";
import { Button, ErrorText, Field, Page, styles } from "../../src/ui";
export default function Create() {
  const api = useApi();
  const { token, draft, setDraft } = useSession();
  const [confirmed, setConfirmed] = useState(false);
  const form = useForm<StoryInput>({
    defaultValues: draft,
  });
  const wallet = useQuery({
    queryKey: ["wallet"],
    queryFn: () => api<{ available: number; reserved: number }>("/v1/wallet"),
    enabled: !!token,
  });
  const [pending, setPending] = useState<{
    storyId: string;
    key: string;
  } | null>(null);
  const generate = useMutation({
    mutationFn: async (raw: StoryInput) => {
      const parsed = storyInput.safeParse(raw);
      if (!parsed.success)
        throw new Error(
          "Add a fictional name and setting within the field limits.",
        );
      const input = parsed.data;
      const created = pending ?? {
        storyId: (
          await api<Story>("/v1/stories", {
            method: "POST",
            body: JSON.stringify(input),
          })
        ).id,
        key: `mobile-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      };
      setPending(created);
      const job = await api<Job>(`/v1/stories/${created.storyId}/generate`, {
        method: "POST",
        headers: { "Idempotency-Key": created.key },
      });
      router.push(`/jobs/${job.id}`);
    },
  });
  return (
    <Page back>
      <Text style={styles.eyebrow}>THE BUILDER / FICTIONAL CAST</Text>
      <Text style={styles.title}>Set the scene.</Text>
      <Text style={styles.body}>
        A fictional couple. A questionable floor plan. Make it your kind of
        chaos.
      </Text>
      <View style={styles.panel}>
        {(["name", "setting", "custom_details"] as const).map((name) => (
          <Controller
            key={name}
            name={name}
            control={form.control}
            render={({ field }) => (
              <Field
                label={
                  {
                    name: "FICTIONAL PROTAGONIST",
                    setting: "THE SETTING",
                    custom_details: "EXTRA DETAILS (OPTIONAL)",
                  }[name]
                }
                value={field.value}
                onChange={(value) => {
                  field.onChange(value);
                  setDraft({ ...form.getValues(), [name]: value });
                }}
                maxLength={
                  { name: 32, setting: 100, custom_details: 240 }[name]
                }
              />
            )}
          />
        ))}
        <Text style={styles.small}>
          All characters are fictional adults. Self-photo uploads arrive in a
          later milestone.
        </Text>
      </View>
      <Controller
        control={form.control}
        name="satire_intensity"
        render={({ field }) => (
          <View style={styles.panel}>
            <Text style={styles.heading}>How bad could it get?</Text>
            <View style={styles.row}>
              {[40, 80, 100].map((value) => (
                <Button
                  key={value}
                  secondary={field.value !== value}
                  label={
                    value === 40
                      ? "Awkward"
                      : value === 80
                        ? "Unhinged"
                        : "Catastrophically silly"
                  }
                  onPress={() => {
                    field.onChange(value);
                    setDraft({ ...form.getValues(), satire_intensity: value });
                  }}
                />
              ))}
            </View>
            <Text style={styles.small}>
              Mock output is deterministic; this setting is saved for the future
              live provider.
            </Text>
          </View>
        )}
      />
      <ErrorText error={generate.error ?? wallet.error} />
      {!token ? (
        <Button
          label="Sign in to generate →"
          onPress={() => router.push("/auth")}
        />
      ) : (
        <>
          <Text style={styles.body}>
            {wallet.data?.available ?? "…"} demo credits available. This story
            reserves 3; a failed generation returns them. Caption edits and
            exports are free.
          </Text>
          {!confirmed ? (
            <Button
              label="Review generation →"
              onPress={() => setConfirmed(true)}
            />
          ) : (
            <View style={styles.panel}>
              <Text style={styles.heading}>Ready for the consequences?</Text>
              <Text style={styles.body}>
                3 demo credits. Original mock illustrations. No provider calls
                or real charges. Every frame and export is labeled AI FICTION.
              </Text>
              <Button
                disabled={
                  generate.isPending || (wallet.data?.available ?? 0) < 3
                }
                label={
                  generate.isPending
                    ? "Creating your story…"
                    : "Confirm · generate for 3 demo credits"
                }
                onPress={() =>
                  void form.handleSubmit((data) => generate.mutate(data))()
                }
              />
              <Button
                secondary
                label="Keep editing"
                onPress={() => setConfirmed(false)}
              />
            </View>
          )}
          {generate.error instanceof ApiError &&
            generate.error.status === 401 && (
              <Button
                label="Sign in again"
                onPress={() => router.push("/auth")}
              />
            )}
        </>
      )}
    </Page>
  );
}
