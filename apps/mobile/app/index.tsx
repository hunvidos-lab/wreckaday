import { Text, View } from "react-native";
import { router } from "expo-router";
import { PACKAGES } from "../src/composer-model";
import { useComposer } from "../src/composer";
import { ScenarioExamples } from "../src/scenario-examples";
import { Button, Page, styles, color, radius } from "../src/ui";
const STEPS = [
  ["01", "Upload your photo."],
  ["02", "Tell us the premise."],
  ["03", "We make it happen."],
];
export default function Welcome() {
  const { dispatch } = useComposer();
  return (
    <Page>
      <View style={{ gap: 18, paddingTop: 20 }}>
        <View
          style={{
            alignSelf: "flex-start",
            borderRadius: radius.pill,
            borderWidth: 1,
            borderColor: color.acidLine,
            backgroundColor: color.acidSoft,
            paddingHorizontal: 12,
            paddingVertical: 6,
          }}
        >
          <Text style={styles.eyebrow}>THEY CROSSED YOU.</Text>
        </View>
        <Text style={[styles.title, { fontSize: 58, lineHeight: 58 }]}>
          Make them{"\n"}
          <Text style={{ color: color.acid }}>look twice.</Text>
        </Text>
        <Text
          style={{
            color: color.text,
            fontSize: 20,
            lineHeight: 28,
            maxWidth: 620,
          }}
        >
          Hire Wreckaday. You give the spark. We give the flame.
        </Text>
        <Text style={[styles.body, { maxWidth: 620 }]}>
          They lied. They played you. They thought you’d take it quietly. Design
          your payback premise. Upload your photo. We turn it into a
          photorealistic prank, with you in the starring role.
        </Text>
        <Button
          label="Design my payback →"
          style={{ alignSelf: "flex-start", marginTop: 6 }}
          onPress={() => router.push("/compose")}
        />
      </View>
      <View style={[styles.panel, { gap: 20 }]}>
        <Text style={styles.eyebrow}>
          YOU SET THE TERMS. WE DIRECT THE SCENE.
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
          {STEPS.map(([index, label]) => (
            <View
              key={index}
              style={{
                flexBasis: 220,
                flexGrow: 1,
                gap: 10,
                padding: 16,
                borderRadius: radius.md,
                backgroundColor: color.raised,
              }}
            >
              <Text
                style={{ color: color.acid, fontWeight: "900", fontSize: 13 }}
              >
                {index}
              </Text>
              <Text style={[styles.heading, { fontSize: 19 }]}>{label}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.body}>
          No designing cards. No hunting for stock images. We plan the scenes,
          put you into them, and build the reveal. You review the result before
          choosing what to share.
        </Text>
      </View>
      <ScenarioExamples />
      <View style={{ gap: 6 }}>
        <Text style={styles.eyebrow}>CHOOSE HOW FAR THE STORY GOES</Text>
        <Text style={[styles.title, { fontSize: 34, lineHeight: 38 }]}>
          A spark. A blaze. An inferno.
        </Text>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 14 }}>
        {PACKAGES.map((item, index) => {
          const featured = index === 1;
          return (
            <View
              key={item.id}
              style={[
                styles.panel,
                { flexGrow: 1, flexBasis: 270 },
                featured && {
                  borderColor: color.acid,
                  backgroundColor: color.raised,
                },
              ]}
            >
              <View style={[styles.row, { justifyContent: "space-between" }]}>
                <Text style={[styles.eyebrow, { color: color.muted }]}>
                  {item.scenes} {item.scenes === 1 ? "SCENE" : "SCENES"}
                </Text>
                {featured && (
                  <View
                    style={{
                      backgroundColor: color.acid,
                      borderRadius: radius.pill,
                      paddingHorizontal: 10,
                      paddingVertical: 4,
                    }}
                  >
                    <Text style={[styles.tagText, { color: color.bg }]}>
                      POPULAR
                    </Text>
                  </View>
                )}
              </View>
              <Text style={styles.heading}>{item.name}</Text>
              <Text style={[styles.title, { fontSize: 40, lineHeight: 42 }]}>
                ${(item.cents / 100).toFixed(2)}
              </Text>
              <Text
                style={{ color: color.acid, fontSize: 16, fontWeight: "700" }}
              >
                {item.heat}
              </Text>
              <Text style={[styles.body, { flexGrow: 1 }]}>
                {item.description}
              </Text>
              <Button
                secondary={!featured}
                label={`Choose ${item.name}`}
                onPress={() => {
                  dispatch({ type: "package", id: item.id });
                  router.push("/compose");
                }}
              />
            </View>
          );
        })}
      </View>
      <Text style={styles.small}>
        Proposed one-time USD prices. Checkout is not connected. Live generation
        requires a configured provider and explicit approval to send your photo.
        Every export carries an AI-fiction label and reveal.
      </Text>
    </Page>
  );
}
