import { Image, Text, View } from "react-native";
import { router } from "expo-router";
import { EXAMPLES } from "./composer-model";
import { useComposer } from "./composer";
import { Button, color, fixtures, styles } from "./ui";
export function ScenarioExamples() {
  const { dispatch } = useComposer();
  return (
    <View style={{ gap: 22 }}>
      <View style={{ gap: 6 }}>
        <Text style={styles.eyebrow}>SEE WHAT PAYBACK LOOKS LIKE</Text>
        <Text style={[styles.title, { fontSize: 34, lineHeight: 38 }]}>
          A picture they didn’t see coming.
        </Text>
      </View>
      <Text style={styles.body}>
        Lies, affairs, theft. Ordinary people caught in an ugly fictional
        moment.
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 18 }}>
        {EXAMPLES.map((example) => (
          <View
            key={example.tag}
            style={[styles.card, { flexBasis: 275, flexGrow: 1 }]}
          >
            <View
              style={{
                aspectRatio: 2 / 3,
                width: "100%",
                backgroundColor: color.raised,
              }}
            >
              <Image
                source={fixtures[example.image]}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
                accessibilityLabel={`Photorealistic example: ${example.title}`}
              />
              <View
                style={[
                  styles.tag,
                  { position: "absolute", left: 12, top: 12 },
                ]}
              >
                <Text style={styles.tagText}>
                  AI FICTION / ILLUSTRATIVE EXAMPLE
                </Text>
              </View>
            </View>
            <View style={{ padding: 18, gap: 12 }}>
              <Text
                style={{
                  color: color.text,
                  fontSize: 18,
                  lineHeight: 23,
                  fontWeight: "800",
                }}
              >
                {example.caption}
              </Text>
              <Text style={styles.eyebrow}>{example.tag}</Text>
              <Text style={styles.heading}>{example.title}</Text>
              <Button
                secondary
                label={`Use ${example.tag.toLowerCase()} premise`}
                onPress={() => {
                  dispatch({ type: "brief", value: example.premise });
                  router.push("/compose");
                }}
              />
            </View>
          </View>
        ))}
      </View>
      <Text style={styles.small}>
        Illustrative AI-created art direction with fictional adults. These
        images show the visual target; they are not results from your uploaded
        photo or a benchmark of the configured models.
      </Text>
    </View>
  );
}
