import { Text, View } from "react-native";
import { router } from "expo-router";
import { Button, FrameCard, Page, fixtures, styles } from "../src/ui";
export default function Examples() {
  return (
    <Page back>
      <Text style={styles.eyebrow}>THE SAMPLE / NO ACCOUNT NEEDED</Text>
      <Text style={styles.title}>She’s moving in.</Text>
      <Text style={styles.small}>
        PRE-RENDERED SAMPLE · THE SAME IMAGE IS REPEATED IN THIS PREVIEW
      </Text>
      <View
        style={{ gap: 18, maxWidth: 480, width: "100%", alignSelf: "center" }}
      >
        {fixtures.map((source, i) => (
          <FrameCard
            key={i}
            source={source}
            caption={
              [
                "Meet my fiancée.",
                "She's moving in tomorrow.",
                "The landlord has some questions.",
              ][i]
            }
            label={`0${i + 1} / AI FICTION`}
          />
        ))}
        <View style={styles.panel}>
          <Text style={styles.heading}>The ceiling had it coming.</Text>
          <Text style={styles.body}>
            AI FICTION. The relationship is fictional. The ceiling had it
            coming.
          </Text>
        </View>
      </View>
      <Button
        label="Make your own →"
        onPress={() => router.push("/create/seven-foot-fiancee")}
      />
    </Page>
  );
}
