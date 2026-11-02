import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "expo-router";
import { Text, View } from "react-native";
import {
  Button,
  Check,
  Chip,
  ErrorText,
  Field,
  Notice,
  Page,
  Step,
  styles,
} from "./ui";
import { consoleRequest, useDevConsole, type KeySnapshot } from "./dev-console";

const TEXT = [
  ["Text endpoint URL", "WRECKDAY_TEXT_ENDPOINT"],
  ["Text model ID", "WRECKDAY_TEXT_MODEL"],
];
const IMAGE = [["Image endpoint URL", "WRECKDAY_IMAGE_ENDPOINT"]];
const LIMITS = [
  ["Daily budget USD", "WRECKDAY_DAILY_BUDGET_USD"],
  ["Text cost ceiling USD", "WRECKDAY_TEXT_COST_CEILING_USD"],
  ["Image cost ceiling USD", "WRECKDAY_IMAGE_COST_CEILING_USD"],
];
export function DevKeysForm() {
  const console = useDevConsole();
  const [password, setPassword] = useState("");
  const [snapshot, setSnapshot] = useState<KeySnapshot | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [secretInputs, setSecretInputs] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [message, setMessage] = useState("");
  useFocusEffect(
    useCallback(
      () => () => {
        // Router stacks can retain hidden screens. Clear pasted values when leaving,
        // rather than relying on unmount to destroy the form's state.
        setPassword("");
        setSecretInputs({});
      },
      [],
    ),
  );
  function receive(data: KeySnapshot) {
    setSnapshot(data);
    setValues(
      Object.fromEntries(
        Object.entries(data.values)
          .filter(([, value]) => typeof value !== "object")
          .map(([key, value]) => [key, String(value)]),
      ),
    );
    setSecretInputs({});
  }
  useEffect(() => {
    let active = true;
    if (console.token)
      consoleRequest<KeySnapshot>(console.token)
        .then((data) => {
          if (active) receive(data);
        })
        .catch((error) => {
          if (active) setError(error);
        });
    return () => {
      active = false;
    };
  }, [console.token]);
  async function unlock() {
    setBusy(true);
    setError(null);
    try {
      receive(await console.unlock(password));
      setPassword("");
    } catch (error) {
      setError(error);
      setPassword("");
    } finally {
      setBusy(false);
    }
  }
  async function save() {
    setBusy(true);
    setError(null);
    setMessage("");
    const updates = {
      ...values,
      ...Object.fromEntries(
        Object.entries(secretInputs).filter(([, value]) => value),
      ),
    };
    setSecretInputs({}); // Clear pasted keys as soon as submission begins, including failed saves.
    try {
      const result = await consoleRequest<KeySnapshot>(console.token, {
        method: "PUT",
        body: JSON.stringify({ values: updates }),
      });
      receive(result);
      setMessage(
        result.restart_required
          ? "Saved. Restart pnpm dev to use these settings."
          : "Saved to this computer. Settings are active now.",
      );
    } catch (error) {
      setError(error);
    } finally {
      setBusy(false);
    }
  }
  async function test(target: "text" | "image") {
    setBusy(true);
    setError(null);
    setMessage("");
    try {
      const result = await consoleRequest<{ ok: boolean; message: string }>(
        console.token,
        { method: "POST", body: JSON.stringify({ target }) },
      );
      setMessage(result.message);
    } catch (error) {
      setError(error);
    } finally {
      setBusy(false);
    }
  }
  const field = ([label, key]: string[]) => (
    <Field
      key={key}
      label={label}
      value={values[key] ?? ""}
      onChange={(value) => setValues((old) => ({ ...old, [key]: value }))}
      maxLength={512}
      multiline={false}
      editable={!busy}
    />
  );
  const secret = (label: string, key: string) => {
    const saved = snapshot?.values[key];
    return (
      <View style={{ gap: 8 }}>
        <Field
          label={label}
          value={secretInputs[key] ?? ""}
          onChange={(value) =>
            setSecretInputs((old) => ({ ...old, [key]: value }))
          }
          secureTextEntry
          maxLength={512}
          editable={!busy}
        />
        <Text style={styles.small}>
          {typeof saved === "object" && saved.set
            ? `Saved ••••${saved.last4}`
            : "No key saved"}
          . Leave empty to keep the saved key.
        </Text>
      </View>
    );
  };
  return (
    <Page back>
      <Text style={styles.eyebrow}>LOCAL DEVELOPMENT</Text>
      <Text style={styles.title}>Connect your models.</Text>
      <Notice tone="accent">
        Development only. Keys are written to the .env file on this computer and
        never stored in the app.
      </Notice>
      {!console.token ? (
        <Step
          index="1"
          label="UNLOCK"
          title="Use this launch’s password."
          active
        >
          <Text style={styles.body}>
            Paste the Key console token from the Terminal window opened by pnpm
            dev.
          </Text>
          <Field
            label="Console token"
            value={password}
            onChange={setPassword}
            secureTextEntry
            maxLength={128}
            editable={!busy}
          />
          <Button
            label="Unlock console"
            disabled={busy || !password}
            onPress={() => void unlock()}
          />
        </Step>
      ) : (
        snapshot && (
          <>
            <Step index="1" label="TEXT" title="Plan the payback.">
              {TEXT.map(field)}
              {secret("Text API key", "WRECKDAY_TEXT_API_KEY")}
            </Step>
            <Step index="2" label="IMAGES" title="Make the scene.">
              <View style={styles.row}>
                {["fal", "bfl", "image_edits"].map((provider) => (
                  <Chip
                    key={provider}
                    label={provider}
                    selected={values.WRECKDAY_IMAGE_PROVIDER === provider}
                    disabled={busy}
                    onPress={() =>
                      setValues((old) => ({
                        ...old,
                        WRECKDAY_IMAGE_PROVIDER: provider,
                      }))
                    }
                  />
                ))}
              </View>
              {IMAGE.map(field)}
              {secret("Image API key", "WRECKDAY_IMAGE_API_KEY")}
            </Step>
            <Step index="3" label="SPENDING" title="Keep the limit clear.">
              {LIMITS.map(field)}
              <Text style={styles.body}>
                Text ceiling covers both text calls; image ceiling covers one
                image. Save before testing. Key tests do not generate stories.
                Live story generation can incur provider charges.
              </Text>
              <Check
                label="Enable live generation"
                value={values.WRECKDAY_LIVE_GENERATION_ENABLED === "true"}
                disabled={busy}
                onChange={(value) =>
                  setValues((old) => ({
                    ...old,
                    WRECKDAY_LIVE_GENERATION_ENABLED: String(value),
                  }))
                }
              />
              <Button
                label="Save"
                disabled={busy}
                onPress={() => void save()}
              />
              <Button
                secondary
                label="Test text key"
                disabled={busy}
                onPress={() => void test("text")}
              />
              <Button
                secondary
                label="Test image key"
                disabled={busy}
                onPress={() => void test("image")}
              />
              <Notice>
                {snapshot.generation_available
                  ? "Generation is connected."
                  : "Generation is not connected. Save keys, endpoints, ceilings and enable live generation."}
              </Notice>
            </Step>
            <Button
              secondary
              label="Lock console"
              disabled={busy}
              onPress={() => {
                console.lock();
                setSnapshot(null);
                setValues({});
                setSecretInputs({});
                setMessage("");
              }}
            />
          </>
        )
      )}
      {message ? <Notice>{message}</Notice> : null}
      <ErrorText error={error} />
    </Page>
  );
}
