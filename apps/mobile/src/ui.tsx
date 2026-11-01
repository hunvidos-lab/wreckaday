import type { ReactNode } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ImageSourcePropType,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
export const color = {
  bg: "#101713",
  panel: "#1b241e",
  line: "#334032",
  text: "#f4f0e6",
  muted: "#acb5a6",
  acid: "#d9ef89",
  red: "#e59c83",
};
export const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: color.bg },
  content: {
    width: "100%",
    maxWidth: 1040,
    alignSelf: "center",
    padding: 24,
    paddingBottom: 60,
    gap: 22,
  },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
    flexWrap: "wrap",
    borderBottomWidth: 1,
    borderColor: color.line,
    paddingBottom: 22,
  },
  brand: {
    color: color.text,
    fontSize: 25,
    fontWeight: "900",
    letterSpacing: -1.5,
  },
  title: {
    color: color.text,
    fontSize: 52,
    fontWeight: "900",
    letterSpacing: -2,
    lineHeight: 55,
  },
  heading: {
    color: color.text,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.7,
  },
  body: { color: color.muted, fontSize: 16, lineHeight: 25 },
  small: {
    color: color.muted,
    fontSize: 12,
    lineHeight: 19,
    letterSpacing: 0.6,
  },
  eyebrow: {
    color: color.acid,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
  },
  panel: {
    backgroundColor: color.panel,
    borderRadius: 18,
    padding: 22,
    gap: 16,
    borderWidth: 1,
    borderColor: color.line,
  },
  row: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
    flexWrap: "wrap",
  },
  button: {
    minHeight: 50,
    paddingHorizontal: 23,
    paddingVertical: 15,
    borderRadius: 10,
    backgroundColor: color.acid,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: { color: color.bg, fontWeight: "800", fontSize: 15 },
  secondary: {
    backgroundColor: color.panel,
    borderWidth: 1,
    borderColor: color.line,
  },
  input: {
    color: color.text,
    backgroundColor: color.bg,
    borderColor: color.line,
    borderWidth: 1,
    borderRadius: 10,
    padding: 15,
    minHeight: 50,
    fontSize: 16,
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: color.panel,
    borderColor: color.line,
    borderWidth: 1,
  },
});
export function Page({
  children,
  back = false,
}: {
  children: ReactNode;
  back?: boolean;
}) {
  return (
    <SafeAreaView style={styles.page}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.nav}>
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push("/templates")}
          >
            <Text style={styles.brand}>
              WRECKDAY
              <Text style={{ color: color.acid, fontSize: 12 }}> / DEV</Text>
            </Text>
          </Pressable>
          <View style={styles.row}>
            {back && (
              <Button
                secondary
                label="← Back"
                onPress={() =>
                  router.canGoBack()
                    ? router.back()
                    : router.replace("/templates")
                }
              />
            )}
            <Nav label="Library" href="/library" />
            <Nav label="Settings" href="/settings" />
          </View>
        </View>
        {children}
        <Text style={styles.small}>
          DEVELOPMENT PREVIEW · MOCK ARTWORK · NO LIVE INFERENCE
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
function Nav({
  label,
  href,
}: {
  label: string;
  href: "/library" | "/settings";
}) {
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => router.push(href)}
      style={{ padding: 12 }}
    >
      <Text style={{ color: color.text, fontWeight: "600" }}>{label}</Text>
    </Pressable>
  );
}
export function Button({
  label,
  onPress,
  secondary,
  disabled,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        secondary && styles.secondary,
        disabled && { opacity: 0.45 },
      ]}
    >
      <Text style={[styles.buttonText, secondary && { color: color.text }]}>
        {label}
      </Text>
    </Pressable>
  );
}
export function Field({
  label,
  value,
  onChange,
  maxLength = 140,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.small}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        style={styles.input}
        value={value}
        onChangeText={onChange}
        maxLength={maxLength}
        multiline
        placeholderTextColor={color.muted}
      />
    </View>
  );
}
export function ErrorText({ error }: { error: unknown }) {
  return error ? (
    <Text
      accessibilityRole="alert"
      style={{ color: color.red, fontSize: 15, lineHeight: 23 }}
    >
      {error instanceof Error ? error.message : "Please try again."}
    </Text>
  ) : null;
}
export const fixtures = [
  require("../assets/fixtures/frame-0.png"),
  require("../assets/fixtures/frame-1.png"),
  require("../assets/fixtures/frame-2.png"),
] as ImageSourcePropType[];
export function FrameCard({
  source,
  caption,
  label,
}: {
  source: ImageSourcePropType;
  caption: string;
  label?: string;
}) {
  return (
    <View style={styles.card}>
      <View style={{ width: "100%", aspectRatio: 9 / 16 }}>
        <Image
          source={source}
          style={{ position: "absolute", width: "100%", height: "100%" }}
          resizeMode="contain"
          accessibilityLabel={label ?? "Illustrated fictional apartment scene"}
        />
      </View>
      <View style={{ padding: 16, gap: 9 }}>
        <Text style={styles.small}>{label ?? "AI FICTION"}</Text>
        <Text
          style={{
            color: color.text,
            fontSize: 22,
            fontWeight: "800",
            lineHeight: 27,
          }}
        >
          {caption}
        </Text>
      </View>
    </View>
  );
}
