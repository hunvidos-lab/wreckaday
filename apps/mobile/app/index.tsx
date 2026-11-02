import { useState } from "react";
import { Image, Switch, Text, View, useWindowDimensions } from "react-native";
import { router } from "expo-router";
import { Button, Page, fixtures, styles, color } from "../src/ui";

export default function Welcome() {
  const [adult, setAdult] = useState(false);
  const { width } = useWindowDimensions();
  const wide = width >= 760;
  return (
    <Page>
      <View
        style={{
          flexDirection: wide ? "row" : "column",
          gap: wide ? 54 : 28,
          alignItems: wide ? "center" : "stretch",
          paddingVertical: wide ? 36 : 12,
        }}
      >
        <View style={{ flex: 1, gap: 24 }}>
          <Text style={styles.eyebrow}>AI FICTION / ADULT COMEDY</Text>
          <Text
            style={[
              styles.title,
              { fontSize: wide ? 72 : 51, lineHeight: wide ? 78 : 57 },
            ]}
          >
            A little chaos.{"\n"}Beautifully told.
          </Text>
          <Text style={[styles.body, { maxWidth: 430 }]}>
            Bad decisions make good stories. Turn a wildly ill-advised idea into
            a short piece of cinematic fiction.
          </Text>
          <View
            style={{
              borderTopWidth: 1,
              borderColor: color.line,
              paddingTop: 18,
              gap: 18,
            }}
          >
            <View style={styles.row}>
              <Switch
                accessibilityLabel="I am at least 18 years old"
                value={adult}
                onValueChange={setAdult}
                trackColor={{ true: "#a75143" }}
              />
              <Text style={[styles.body, { flex: 1 }]}>I’m 18 or older.</Text>
            </View>
            <View style={{ gap: 10, maxWidth: 360 }}>
              <Button
                label="Explore stories  →"
                disabled={!adult}
                onPress={() => router.push("/templates")}
              />
              <Button
                secondary
                label="View a sample"
                onPress={() => router.push("/examples")}
              />
            </View>
            <Text style={styles.small}>
              Fictional stories. No account needed to preview.
            </Text>
          </View>
        </View>
        <View
          style={{
            width: wide ? "42%" : "100%",
            maxWidth: wide ? 380 : 480,
            alignSelf: "center",
            gap: 10,
          }}
        >
          <View
            style={{
              width: "100%",
              aspectRatio: 9 / 16,
              overflow: "hidden",
              backgroundColor: color.panel,
            }}
          >
            <Image
              source={fixtures[2]}
              style={{ width: "100%", height: "100%", position: "absolute" }}
              resizeMode="cover"
              accessibilityLabel="A fictional story sample"
            />
          </View>
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <Text style={styles.small}>THE WRECKDAY EDIT / NO. 01</Text>
            <Text style={styles.small}>AI FICTION</Text>
          </View>
        </View>
      </View>
      <View
        style={{
          borderTopWidth: 1,
          borderColor: color.line,
          paddingTop: 22,
          flexDirection: "row",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <Text style={styles.small}>A STORY IN THREE ACTS</Text>
        <Text style={styles.small}>
          BAD ROMANCE · OFFICE POLITICS · BEAUTIFUL DISASTERS
        </Text>
      </View>
    </Page>
  );
}
