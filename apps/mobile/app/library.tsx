import { Text, View } from "react-native";
import { router } from "expo-router";
import { useComposer } from "../src/composer";
import { packageFor } from "../src/composer-model";
import { Button, Page, styles } from "../src/ui";
export default function Session() {
  const { draft, generating } = useComposer();
  return (
    <Page back>
      <Text style={styles.eyebrow}>YOUR CURRENT PRODUCTION</Text>
      <Text style={styles.title}>The next move is yours.</Text>
      <View style={styles.panel}>
        <Text style={styles.heading}>
          {packageFor(draft.packageId).name} · {draft.scenes.length} scenes
        </Text>
        <Text style={styles.body}>
          {generating
            ? "Your story is being generated. Return to review its progress."
            : draft.generated
              ? "Your generated scenes are ready to review and export."
              : "Your photo and premise are ready for you to finish the brief."}
        </Text>
        <Button label="Open my prank" onPress={() => router.push("/compose")} />
      </View>
      <Text style={styles.body}>
        This session holds the draft and returned images in memory. There is no
        account or server library. Export what you want to keep before
        refreshing or closing.
      </Text>
    </Page>
  );
}
