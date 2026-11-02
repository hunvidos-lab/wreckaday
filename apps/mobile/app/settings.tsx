import { useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { useComposer } from "../src/composer";
import { Button, ErrorText, Page, styles } from "../src/ui";
export default function Privacy() {
  const { clear, clearing } = useComposer();
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<unknown>(null);
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
      <Text style={styles.eyebrow}>YOUR PHOTO. YOUR CALL.</Text>
      <Text style={styles.title}>Before you light the spark.</Text>
      <View style={styles.panel}>
        <Text style={styles.heading}>Choosing a photo</Text>
        <Text style={styles.body}>
          Your selection and premise stay in this session until you explicitly
          start a connected generation. Native image imports use a temporary app
          cache, cleared on reset and next startup. Browser imports use local
          blob URLs. Refreshing or closing loses the draft and returned results.
        </Text>
      </View>
      <View style={styles.panel}>
        <Text style={styles.heading}>When we generate</Text>
        <Text style={styles.body}>
          After your confirmation, the development server receives your photo
          and premise. It sends the premise to the configured text model and the
          photo with scene instructions to the image model. The generation
          screen identifies their hosts before you agree. Their retention
          policies apply. The server processes content in memory without a
          database, content logs or saved media files.
        </Text>
      </View>
      <View style={styles.panel}>
        <Text style={styles.heading}>The reveal stays in</Text>
        <Text style={styles.body}>
          Every exported image includes an AI-fiction label and reveal. You
          review and share manually using your messaging account. There is no
          anonymous delivery, automated contact or recipient tracking. Clearing
          cannot recall sent copies or cancel provider work already accepted.
        </Text>
      </View>
      <View style={styles.panel}>
        <Text style={styles.heading}>Development preview</Text>
        <Text style={styles.body}>
          Package prices are proposed USD prices. Checkout is not connected.
          Live provider usage may cost the operator money within configured
          development limits. Native-device QA, independent image moderation,
          real purchase validation and privacy/legal review remain required
          before launch. No GDPR compliance or untraceability is claimed.
        </Text>
      </View>
      {confirm ? (
        <View style={styles.panel}>
          <Text style={styles.heading}>Discard this session?</Text>
          <Button
            label="Clear draft & local cache"
            disabled={clearing}
            onPress={() => void reset()}
          />
          <Button
            secondary
            label="Keep session"
            onPress={() => setConfirm(false)}
          />
        </View>
      ) : (
        <Button label="Clear this session" onPress={() => setConfirm(true)} />
      )}
      <ErrorText error={error} />
    </Page>
  );
}
