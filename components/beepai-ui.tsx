import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { type ReactNode } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { StyleSheet, Text, TouchableOpacity, View, type StyleProp, type ViewStyle } from "react-native";

export const palette = {
  ink: "#12152A",
  violet: "#6D28D9",
  violetLight: "#F0EAFE",
  blue: "#2563EB",
  mint: "#16A34A",
  amber: "#D97706",
  coral: "#EA580C",
  canvas: "#F7F7FB",
  card: "#FFFFFF",
  line: "#E7E8F0",
  muted: "#667085",
  paleText: "#F5F3FF",
  danger: "#DC2626",
};

export function AppScreen({ children, edges = ["top", "left", "right"] }: { children: ReactNode; edges?: ("top" | "bottom" | "left" | "right")[] }) {
  return <SafeAreaView edges={edges} style={styles.screen}>{children}</SafeAreaView>;
}

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <View style={styles.brandRow}>
      <View style={styles.brandIcon}><Text style={styles.brandLetter}>B</Text></View>
      {!compact && <Text style={styles.brandName}>BeepAI</Text>}
    </View>
  );
}

export function PageHeader({ title, subtitle, back = false, right }: { title: string; subtitle?: string; back?: boolean; right?: ReactNode }) {
  const router = useRouter();
  return (
    <View style={styles.header}>
      <View style={styles.headerLeading}>
        {back && <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.backButton}><MaterialIcons name="arrow-back" size={21} color={palette.ink} /></TouchableOpacity>}
        <View style={styles.headerTitleBlock}>
          <Text style={styles.pageTitle}>{title}</Text>
          {subtitle && <Text style={styles.pageSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {right}
    </View>
  );
}

export function PrivacyChip() {
  return <View style={styles.privacyChip}><MaterialIcons name="verified-user" color={palette.mint} size={15} /><Text style={styles.privacyText}>Private on device</Text></View>;
}

export function StatusPill({ label, tone = "violet" }: { label: string; tone?: "violet" | "green" | "orange" | "red" | "blue" | "gray" }) {
  const tones = { violet: ["#F0EAFE", palette.violet], green: ["#EAF9EE", palette.mint], orange: ["#FFF4E6", palette.amber], red: ["#FEECEC", palette.danger], blue: ["#EAF1FF", palette.blue], gray: ["#F2F4F7", palette.muted] } as const;
  const [backgroundColor, color] = tones[tone];
  return <View style={[styles.statusPill, { backgroundColor }]}><Text style={[styles.statusText, { color }]}>{label}</Text></View>;
}

export function PrimaryButton({ label, onPress, icon, loading = false, tone = "violet", style }: { label: string; onPress: () => void; icon?: keyof typeof MaterialIcons.glyphMap; loading?: boolean; tone?: "violet" | "dark"; style?: ViewStyle }) {
  const color = tone === "violet" ? palette.violet : palette.ink;
  return <TouchableOpacity accessibilityRole="button" activeOpacity={0.86} onPress={onPress} style={[styles.primaryButton, { backgroundColor: color }, style]}>
    {icon && <MaterialIcons name={icon} size={19} color="#fff" />}
    <Text style={styles.primaryButtonText}>{loading ? "Running..." : label}</Text>
  </TouchableOpacity>;
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function SectionTitle({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return <View style={styles.sectionHeader}><View>{eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}<Text style={styles.sectionTitle}>{title}</Text></View>{action}</View>;
}

export function Chevron() { return <MaterialIcons name="chevron-right" size={22} color="#98A2B3" />; }

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.canvas },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: palette.violet, justifyContent: "center", alignItems: "center" },
  brandLetter: { color: "#fff", fontSize: 21, fontWeight: "900", lineHeight: 24 },
  brandName: { color: palette.ink, fontSize: 20, fontWeight: "800", letterSpacing: -0.6 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 },
  headerLeading: { flexDirection: "row", alignItems: "center", flex: 1 },
  backButton: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF", marginRight: 10, borderWidth: 1, borderColor: palette.line },
  headerTitleBlock: { flexShrink: 1 },
  pageTitle: { color: palette.ink, fontSize: 25, fontWeight: "800", lineHeight: 31, letterSpacing: -0.8 },
  pageSubtitle: { color: palette.muted, fontSize: 13, lineHeight: 18, marginTop: 1 },
  privacyChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: "#FFFFFF", borderColor: "#DFF2E3", borderWidth: 1, borderRadius: 999 },
  privacyText: { color: "#27733A", fontSize: 11, fontWeight: "700" },
  statusPill: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  statusText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.1 },
  primaryButton: { minHeight: 50, borderRadius: 15, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, paddingHorizontal: 18 },
  primaryButtonText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  pressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  card: { backgroundColor: palette.card, borderRadius: 20, borderWidth: 1, borderColor: palette.line },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 11 },
  eyebrow: { fontSize: 11, fontWeight: "800", color: palette.violet, letterSpacing: 0.7, textTransform: "uppercase", marginBottom: 4 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: palette.ink, letterSpacing: -0.3 },
});
