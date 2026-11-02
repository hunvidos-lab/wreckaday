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
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
export const color = {
  bg: "#09090b",
  panel: "#131316",
  raised: "#1c1c21",
  line: "#26262c",
  lineStrong: "#3a3a42",
  text: "#f5f2ee",
  muted: "#9b9aa1",
  faint: "#6c6b73",
  acid: "#ff5b36",
  acidSoft: "#ff5b361f",
  acidLine: "#ff5b3666",
  red: "#ff9b85",
  scrim: "#09090bd9",
};
export const radius = { sm: 10, md: 16, lg: 24, pill: 999 };
export const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: color.bg },
  content: {
    width: "100%",
    maxWidth: 1040,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 64,
    gap: 24,
  },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    width: "100%",
    maxWidth: 1040,
    alignSelf: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  brand: {
    color: color.text,
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: -0.8,
  },
  title: {
    color: color.text,
    fontSize: 44,
    fontWeight: "900",
    letterSpacing: -1.8,
    lineHeight: 46,
  },
  heading: {
    color: color.text,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 27,
  },
  body: { color: color.muted, fontSize: 16, lineHeight: 24 },
  small: {
    color: color.faint,
    fontSize: 12,
    lineHeight: 18,
  },
  eyebrow: {
    color: color.acid,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.8,
  },
  panel: {
    backgroundColor: color.panel,
    borderRadius: radius.lg,
    padding: 22,
    gap: 16,
    borderWidth: 1,
    borderColor: color.line,
  },
  row: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    flexWrap: "wrap",
  },
  button: {
    minHeight: 52,
    paddingHorizontal: 24,
    paddingVertical: 15,
    borderRadius: radius.pill,
    backgroundColor: color.acid,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: color.bg,
    fontWeight: "800",
    fontSize: 15,
    letterSpacing: -0.1,
  },
  secondary: {
    backgroundColor: color.raised,
    borderWidth: 1,
    borderColor: color.line,
  },
  input: {
    color: color.text,
    backgroundColor: color.bg,
    borderColor: color.lineStrong,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 16,
    minHeight: 120,
    fontSize: 16,
    lineHeight: 23,
    textAlignVertical: "top",
  },
  card: {
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: color.panel,
    borderColor: color.line,
    borderWidth: 1,
  },
  tag: {
    alignSelf: "flex-start",
    backgroundColor: color.scrim,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagText: {
    color: color.text,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
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
    <SafeAreaView style={styles.page} edges={["top", "left", "right"]}>
      <View
        style={{
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderColor: color.line,
          backgroundColor: color.bg,
        }}
      >
        <View style={styles.nav}>
          <View style={[styles.row, { flexWrap: "nowrap", flexShrink: 1 }]}>
            {back && (
              <IconButton
                label="Back"
                glyph="←"
                onPress={() =>
                  router.canGoBack()
                    ? router.back()
                    : router.replace("/templates")
                }
              />
            )}
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Wreckaday home"
              onPress={() => router.push("/")}
              style={[styles.row, { gap: 8, flexWrap: "nowrap" }]}
            >
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: color.acid,
                }}
              />
              <Text style={styles.brand}>wreckaday</Text>
            </Pressable>
          </View>
          <View style={[styles.row, { gap: 6, flexWrap: "nowrap" }]}>
            <Nav label="Session" href="/library" />
            <Nav label="Privacy" href="/settings" />
          </View>
        </View>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {children}
        <Text style={[styles.small, { textAlign: "center", paddingTop: 12 }]}>
          Your photo. Your premise. We handle the rest.
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
      style={({ pressed }) => ({
        minHeight: 44,
        justifyContent: "center",
        paddingHorizontal: 14,
        borderRadius: radius.pill,
        backgroundColor: pressed ? color.raised : "transparent",
      })}
    >
      <Text style={{ color: color.text, fontWeight: "600", fontSize: 14 }}>
        {label}
      </Text>
    </Pressable>
  );
}
function IconButton({
  label,
  glyph,
  onPress,
}: {
  label: string;
  glyph: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: pressed ? color.lineStrong : color.raised,
      })}
    >
      <Text style={{ color: color.text, fontSize: 18, fontWeight: "700" }}>
        {glyph}
      </Text>
    </Pressable>
  );
}
export function Button({
  label,
  onPress,
  secondary,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.secondary,
        pressed && { opacity: 0.82, transform: [{ scale: 0.985 }] },
        disabled && { opacity: 0.4 },
        style,
      ]}
    >
      <Text style={[styles.buttonText, secondary && { color: color.text }]}>
        {label}
      </Text>
    </Pressable>
  );
}
export function Chip({
  label,
  selected,
  onPress,
  disabled,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={{
        minHeight: 44,
        justifyContent: "center",
        paddingHorizontal: 16,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: selected ? color.acid : color.line,
        backgroundColor: selected ? color.acidSoft : color.raised,
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <Text
        style={{
          color: selected ? color.text : color.muted,
          fontWeight: "700",
          fontSize: 14,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
export function Step({
  index,
  label,
  title,
  children,
  active,
  style,
}: {
  index: string;
  label: string;
  title: string;
  children: ReactNode;
  active?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      style={[styles.panel, active && { borderColor: color.acidLine }, style]}
    >
      <View style={[styles.row, { flexWrap: "nowrap", gap: 14 }]}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: active ? color.acid : color.raised,
          }}
        >
          <Text
            style={{
              color: active ? color.bg : color.text,
              fontWeight: "900",
              fontSize: 13,
            }}
          >
            {index}
          </Text>
        </View>
        <View style={{ flexShrink: 1, gap: 2 }}>
          <Text style={styles.eyebrow}>{label}</Text>
          <Text style={styles.heading}>{title}</Text>
        </View>
      </View>
      {children}
    </View>
  );
}
export function Check({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: value, disabled }}
      disabled={disabled}
      onPress={() => onChange(!value)}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        minHeight: 52,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: value ? color.acidLine : color.line,
        backgroundColor: value ? color.acidSoft : color.bg,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 7,
          borderWidth: 1.5,
          borderColor: value ? color.acid : color.lineStrong,
          backgroundColor: value ? color.acid : "transparent",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {value && (
          <Text style={{ color: color.bg, fontSize: 13, fontWeight: "900" }}>
            ✓
          </Text>
        )}
      </View>
      <Text style={[styles.body, { color: color.text, flexShrink: 1 }]}>
        {label}
      </Text>
    </Pressable>
  );
}
export function Notice({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "accent";
}) {
  return (
    <View
      style={{
        borderRadius: radius.md,
        padding: 14,
        backgroundColor: tone === "accent" ? color.acidSoft : color.raised,
        borderWidth: 1,
        borderColor: tone === "accent" ? color.acidLine : color.line,
      }}
    >
      <Text
        style={{
          color: tone === "accent" ? color.text : color.muted,
          fontSize: 14,
          lineHeight: 21,
        }}
      >
        {children}
      </Text>
    </View>
  );
}
export function Field({
  label,
  value,
  onChange,
  maxLength = 140,
  editable = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  editable?: boolean;
}) {
  return (
    <View style={{ gap: 8 }}>
      <View style={[styles.row, { justifyContent: "space-between" }]}>
        <Text style={[styles.eyebrow, { color: color.muted }]}>{label}</Text>
        <Text style={styles.small}>
          {value.length}/{maxLength}
        </Text>
      </View>
      <TextInput
        accessibilityLabel={label}
        editable={editable}
        style={styles.input}
        value={value}
        onChangeText={onChange}
        maxLength={maxLength}
        multiline
        placeholderTextColor={color.faint}
      />
    </View>
  );
}
export function ErrorText({ error }: { error: unknown }) {
  return error ? (
    <Text
      accessibilityRole="alert"
      style={{
        color: color.red,
        fontSize: 15,
        lineHeight: 22,
        backgroundColor: "#ff9b8514",
        borderRadius: radius.md,
        padding: 14,
      }}
    >
      {error instanceof Error ? error.message : "Please try again."}
    </Text>
  ) : null;
}
export const fixtures = [
  require("../assets/examples/upgrade.png"),
  require("../assets/examples/penthouse.png"),
  require("../assets/examples/finale.png"),
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
          accessibilityLabel={label ?? "Photorealistic fictional scenario"}
        />
      </View>
      <View style={{ padding: 18, gap: 8 }}>
        <Text style={styles.eyebrow}>{label ?? "AI FICTION"}</Text>
        <Text style={styles.heading}>{caption}</Text>
      </View>
    </View>
  );
}
