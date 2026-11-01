import { useState } from "react";
import { Text, View, Switch } from "react-native";
import { router } from "expo-router";
import { Button, FrameCard, Page, fixtures, styles, color } from "../src/ui";
export default function Welcome() {
  const [adult, setAdult] = useState(false);
  return (
    <Page>
      <Text style={styles.eyebrow}>
        MAKE BAD DECISIONS. GENERATE WORSE CONSEQUENCES.
      </Text>
      <Text style={styles.title}>Your life.{"\n"}A worse plot.</Text>
      <Text style={styles.body}>
        Three scenes. One spectacularly bad idea. Create fictional comedy
        stories worth sending to the group chat.
      </Text>
      <View style={{ maxWidth: 420, width: "100%", alignSelf: "center" }}>
        <FrameCard
          source={fixtures[2]}
          caption="We may need a taller apartment."
          label="THE TWIST / ORIGINAL MOCK ILLUSTRATION"
        />
      </View>
      <View style={styles.row}>
        <Switch
          accessibilityLabel="I am at least 18 years old"
          value={adult}
          onValueChange={setAdult}
          trackColor={{ true: color.acid }}
        />
        <Text style={styles.body}>
          I’m 18 or older. This is fictional adult comedy.
        </Text>
      </View>
      <Button
        label="Enter the chaos →"
        disabled={!adult}
        onPress={() => router.push("/templates")}
      />
      <Button
        secondary
        label="Try a sample story"
        onPress={() => router.push("/examples")}
      />
      <Text style={styles.small}>
        Age attestation is not identity verification. No account needed to
        preview.
      </Text>
    </Page>
  );
}
