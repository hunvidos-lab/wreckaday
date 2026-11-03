import { useEffect, useRef, useState, type ComponentRef } from "react";
import { Image, Platform, Text, View } from "react-native";
import { router } from "expo-router";
import { useComposer } from "../src/composer";
import {
  BRIEF_LIMIT,
  CAPTION_LIMIT,
  FICTION_LABEL,
  REVEAL,
  PACKAGES,
  packageFor,
} from "../src/composer-model";
import { capabilities, type Capabilities } from "../src/generation-client";
import { pickImage } from "../src/local-images";
import { exportCard } from "../src/export-card";
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
  color,
  radius,
} from "../src/ui";
export default function Compose() {
  const {
    draft,
    dispatch,
    clear,
    clearing,
    generating,
    generationError,
    generate,
  } = useComposer();
  const item = packageFor(draft.packageId),
    scene = draft.scenes[draft.selected];
  const card = useRef<ComponentRef<typeof View>>(null);
  const [status, setStatus] = useState<Capabilities | null>(null);
  const [serviceError, setServiceError] = useState<unknown>(null);
  const [error, setError] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [width, setWidth] = useState(360);
  const [adult, setAdult] = useState(false),
    [rights, setRights] = useState(false),
    [consent, setConsent] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [done, setDone] = useState(false);
  const scale = width / 360;
  async function checkService() {
    setServiceError(null);
    try {
      setStatus(await capabilities());
    } catch (error) {
      setServiceError(error);
    }
  }
  useEffect(() => {
    let active = true;
    capabilities()
      .then((value) => {
        if (active) setStatus(value);
      })
      .catch((error) => {
        if (active) setServiceError(error);
      });
    return () => {
      active = false;
    };
  }, []);
  async function upload() {
    setBusy(true);
    setError(null);
    try {
      const uri = await pickImage();
      if (uri) {
        setLoaded(false);
        setRights(false);
        setConsent(false);
        dispatch({ type: "photo", uri });
      }
    } catch (error) {
      setError(error);
    } finally {
      setBusy(false);
    }
  }
  async function download() {
    setBusy(true);
    setError(null);
    try {
      await exportCard(card, scene);
      setDone(true);
    } catch (error) {
      setError(error);
    } finally {
      setBusy(false);
    }
  }
  async function reset() {
    try {
      await clear();
      router.replace("/");
    } catch (error) {
      setError(error);
    }
  }
  return (
    <Page back>
      <Text style={styles.eyebrow}>THE PAYBACK BRIEF</Text>
      <Text style={styles.title}>
        Your photo.{"\n"}Your premise.{"\n"}Our production.
      </Text>
      <Text style={styles.body}>
        You decide what the twist should be. We plan the story and generate the
        photorealistic scenes. Nothing is sent to a recipient automatically.
      </Text>
      <Step
        index="1"
        label="CHOOSE THE REFERENCE PHOTO"
        title="Upload a photo."
        active={!draft.photoUri}
      >
        <Text style={styles.body}>
          Choose a clear photo of an adult that you are authorized to use. We
          use the person in the photo as the reference for every scene.
        </Text>
        {draft.photoUri && (
          <Image
            source={{ uri: draft.photoUri }}
            style={{ width: 150, height: 190, borderRadius: radius.md }}
            resizeMode="cover"
            accessibilityLabel="Your selected reference photo"
          />
        )}
        <Button
          label={draft.photoUri ? "Replace my photo" : "Choose my photo"}
          disabled={busy || generating}
          onPress={() => void upload()}
        />
        <Text style={styles.small}>
          JPEG, PNG or WebP · Up to 10 MB · Selecting a photo does not upload
          it.
        </Text>
      </Step>
      <Step
        index="2"
        label="TELL US HOW THE STORY GOES"
        title="Design the premise."
        active={!!draft.photoUri && draft.brief.trim().length < 12}
      >
        <Field
          label="YOUR PAYBACK PREMISE"
          value={draft.brief}
          maxLength={BRIEF_LIMIT}
          editable={!generating}
          onChange={(value) => dispatch({ type: "brief", value })}
        />
        <Text style={styles.body}>
          Where are you? What’s the unexpected twist? What should make them look
          twice? Describe the scene; we handle the images and captions.
        </Text>
        <Button
          secondary
          label="See example premises"
          disabled={generating}
          onPress={() => router.push("/examples")}
        />
      </Step>
      <Step index="3" label="SET THE SCALE" title="How far does it go?">
        <View style={styles.row}>
          {PACKAGES.map((tier) => (
            <Chip
              key={tier.id}
              selected={tier.id === draft.packageId}
              label={`${tier.name} · ${tier.scenes} ${tier.scenes === 1 ? "scene" : "scenes"}`}
              disabled={generating}
              onPress={() => {
                setLoaded(false);
                dispatch({ type: "package", id: tier.id });
              }}
            />
          ))}
        </View>
        <Text style={styles.body}>
          {item.name} · ${(item.cents / 100).toFixed(2)} USD proposed package
          price. Checkout is not connected; no purchase is taken here.
        </Text>
      </Step>
      {!draft.generated && (
        <Step
          index="4"
          label="CONFIRM & GENERATE"
          title="We take it from here."
          active
        >
          <Check
            label="I’m 18 or older."
            value={adult}
            onChange={setAdult}
            disabled={generating}
          />
          <Check
            label="I am authorized to use this photo."
            value={rights}
            onChange={setRights}
            disabled={generating}
          />
          <Text style={styles.body}>
            {status?.photo_processing ??
              "When generation is connected, your photo and premise are sent to this server and its configured model providers. Their retention policies apply. This server does not save the content to disk."}
          </Text>
          <Check
            label="I agree to that processing for this generation."
            value={consent}
            onChange={setConsent}
            disabled={generating}
          />
          {!status?.generation_available && (
            <>
              <Notice tone="accent">
                Live generation is not connected. Your photo will stay here.
              </Notice>
              <Button
                secondary
                label="Check generation connection"
                onPress={() => void checkService()}
              />
            </>
          )}
          <ErrorText error={serviceError} />
          <Button
            label={generating ? "Directing your prank…" : "Generate my prank"}
            disabled={
              busy ||
              generating ||
              !status?.generation_available ||
              !draft.photoUri ||
              draft.brief.trim().length < 12 ||
              !adult ||
              !rights ||
              !consent
            }
            onPress={() => void generate()}
          />
          {generating && (
            <Text accessibilityLiveRegion="polite" style={styles.body}>
              Reviewing the premise, planning the story and generating{" "}
              {item.scenes} {item.scenes === 1 ? "scene" : "scenes"}. Stay here
              or return to this session. Generation time depends on the
              provider.
            </Text>
          )}
        </Step>
      )}
      <ErrorText error={error ?? generationError} />
      {draft.generated && (
        <>
          <Text style={styles.eyebrow}>
            THE RESULT / REVIEW BEFORE YOU SHARE
          </Text>
          <View style={styles.row}>
            {draft.scenes.map((frame, index) => (
              <Chip
                key={frame.id}
                label={`Scene ${index + 1}`}
                selected={draft.selected === index}
                disabled={busy}
                onPress={() => {
                  if (draft.selected !== index) setLoaded(false);
                  setDone(false);
                  dispatch({ type: "select", index });
                }}
              />
            ))}
          </View>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 24 }}>
            <View
              ref={card}
              collapsable={false}
              onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
              style={{
                width: "100%",
                maxWidth: 360,
                aspectRatio: 9 / 16,
                backgroundColor: color.bg,
                overflow: "hidden",
              }}
            >
              <Image
                key={`${scene.id}-${scene.imageUri?.slice(-30)}`}
                source={{ uri: scene.imageUri ?? undefined }}
                style={{ position: "absolute", width: "100%", height: "100%" }}
                resizeMode="cover"
                accessibilityLabel="Generated photorealistic prank scene"
                onLoad={() => setLoaded(true)}
                onError={() => {
                  setLoaded(false);
                  setError(
                    new Error("This generated image could not be loaded."),
                  );
                }}
              />
              <View
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  backgroundColor: "#0c0c0ee6",
                  padding: 24 * scale,
                  gap: 14 * scale,
                }}
              >
                <Text
                  numberOfLines={7}
                  style={{
                    color: color.text,
                    fontSize: (scene.caption.length > 100 ? 14 : 17) * scale,
                    lineHeight: (scene.caption.length > 100 ? 18 : 23) * scale,
                    fontWeight: "800",
                  }}
                >
                  {scene.caption.replace(/\s+/g, " ").trim()}
                </Text>
                <Text
                  style={{
                    color: color.text,
                    fontSize: 10 * scale,
                    lineHeight: 15 * scale,
                  }}
                >
                  {REVEAL}
                </Text>
              </View>
              <View
                style={{
                  position: "absolute",
                  top: 20 * scale,
                  left: 20 * scale,
                  backgroundColor: "#0c0c0ed9",
                  padding: 8 * scale,
                }}
              >
                <Text
                  style={{
                    color: color.text,
                    fontSize: 10 * scale,
                    fontWeight: "800",
                  }}
                >
                  {FICTION_LABEL}
                </Text>
              </View>
            </View>
            <View style={{ flex: 1, minWidth: 250, gap: 18 }}>
              <Field
                label={`CAPTION ${draft.selected + 1}`}
                value={scene.caption}
                maxLength={CAPTION_LIMIT}
                onChange={(value) => dispatch({ type: "caption", value })}
              />
              {draft.scenes.length > 1 && (
                <View style={styles.row}>
                  <Button
                    secondary
                    label="Move earlier"
                    disabled={busy || draft.selected === 0}
                    onPress={() => dispatch({ type: "move", direction: -1 })}
                  />
                  <Button
                    secondary
                    label="Move later"
                    disabled={
                      busy || draft.selected === draft.scenes.length - 1
                    }
                    onPress={() => dispatch({ type: "move", direction: 1 })}
                  />
                </View>
              )}
              <Button
                label={
                  Platform.OS === "web"
                    ? "Download this scene as PNG"
                    : "Export & share this scene"
                }
                disabled={busy || !loaded || !scene.caption.trim()}
                onPress={() => void download()}
              />
              {done && (
                <Text style={styles.body}>
                  {Platform.OS === "web"
                    ? "PNG prepared. Check your downloads."
                    : "Share sheet closed. Delivery depends on your chosen app."}
                </Text>
              )}
              <Text style={styles.body}>
                AI-fiction labels and the reveal stay on every export. Sharing
                uses your chosen messaging account. We do not send anonymously
                or contact anyone for you.
              </Text>
            </View>
          </View>
        </>
      )}
      <Text style={styles.small}>
        Drafts and returned results last only for this session. Clearing cannot
        recall exported files or stop work already accepted by a model provider.
      </Text>
      {!confirmClear ? (
        <Button
          secondary
          label="Clear this session"
          disabled={busy}
          onPress={() => setConfirmClear(true)}
        />
      ) : (
        <View style={styles.panel}>
          <Text style={styles.heading}>
            Discard the photo, premise and results?
          </Text>
          <Button
            label="Clear draft & local cache"
            disabled={clearing || busy}
            onPress={() => void reset()}
          />
          <Button
            secondary
            label="Keep session"
            onPress={() => setConfirmClear(false)}
          />
        </View>
      )}
    </Page>
  );
}
