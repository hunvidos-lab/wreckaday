import { Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Button, FrameCard, Page, fixtures, styles } from "../../src/ui";
export default function Detail() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  return (
    <Page back>
      <Text style={styles.eyebrow}>BAD ROMANCE / 01</Text>
      <Text style={styles.title}>
        Love has no limits.{"\n"}Your ceiling does.
      </Text>
      <Text style={styles.body}>
        Your fictional fiancée is moving in. She’s seven feet tall. You live in
        a very ordinary apartment. Something has to give.
      </Text>
      <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
        {fixtures.map((source, i) => (
          <View key={i} style={{ flex: 1, minWidth: 190 }}>
            <FrameCard
              source={source}
              caption={["The introduction.", "The move.", "The renovation."][i]}
              label={`0${i + 1} / ${["HOOK", "ESCALATION", "TWIST"][i]}`}
            />
          </View>
        ))}
      </View>
      <Button
        label="Make mine · 3 demo credits →"
        onPress={() => router.push(`/create/${slug}`)}
      />
      <Button
        secondary
        label="Watch the sample"
        onPress={() => router.push("/examples")}
      />
      <Text style={styles.small}>
        Fictional adults only. Mock illustrations, not photorealistic AI output.
        No uploads in this preview.
      </Text>
    </Page>
  );
}
