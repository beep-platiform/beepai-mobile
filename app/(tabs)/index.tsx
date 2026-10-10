import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppScreen, BrandMark, Card, palette } from "@/components/beepai-ui";

export default function DashboardScreen() {
  const router = useRouter();

  return (
    <AppScreen edges={["top", "left", "right", "bottom"]}>
      <View style={styles.screen}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <BrandMark compact />
            <View>
              <Text style={styles.headerTitle}>Beep assistant</Text>
              <View style={styles.privateLine}><View style={styles.onlineDot} /><Text style={styles.privateText}>Your task files run on this device</Text></View>
            </View>
          </View>
          <View style={styles.headerBadge}><MaterialIcons name="lock" size={14} color={palette.mint} /><Text style={styles.headerBadgeText}>PRIVATE</Text></View>
        </View>

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.welcome}>
            <View style={styles.welcomeIcon}><MaterialIcons name="auto-awesome" size={23} color={palette.primary} /></View>
            <Text style={styles.title}>What would you like to do?</Text>
            <Text style={styles.subtitle}>Choose an action. Beep will show what happens next—no need to guess or send your working files to the cloud.</Text>
          </View>

          <Text style={styles.sectionLabel}>ACTIONS</Text>
          <ActionCard
            step="01"
            icon="post-add"
            title="Request an automation"
            subtitle="Describe the task and attach an optional sample file for the admin to review."
            onPress={() => router.push("/create")}
          />
          <ActionCard
            step="02"
            icon="qr-code-2"
            title="Redeem a package"
            subtitle="Enter the code from your Beep admin and download the JavaScript automation."
            onPress={() => router.push("/redeem")}
          />
          <ActionCard
            step="03"
            icon="play-circle-outline"
            title="Run an installed automation"
            subtitle="Choose a local file, run the automation, and review the result here."
            onPress={() => router.push("/(tabs)/automations")}
          />

          <Card style={styles.flowCard}>
            <View style={styles.flowHeader}><MaterialIcons name="route" size={18} color={palette.primary} /><Text style={styles.flowTitle}>Your request, step by step</Text></View>
            <FlowStep number="1" text="You submit the task and an optional sample." />
            <FlowStep number="2" text="An admin reviews the request and attaches a JavaScript automation." />
            <FlowStep number="3" text="You redeem the code; the package is stored encrypted on this device." />
            <FlowStep number="4" text="You choose your working file and run the task locally." last />
            <View style={styles.privacyNote}><MaterialIcons name="shield" size={15} color={palette.mint} /><Text style={styles.privacyText}>Only the sample you explicitly attach is sent for admin review. The actual task file stays on your device.</Text></View>
          </Card>
        </ScrollView>
      </View>
    </AppScreen>
  );
}

function ActionCard({ step, icon, title, subtitle, onPress }: { step: string; icon: keyof typeof MaterialIcons.glyphMap; title: string; subtitle: string; onPress: () => void }) {
  return (
    <TouchableOpacity accessibilityRole="button" activeOpacity={0.82} onPress={onPress} style={styles.actionCard}>
      <View style={styles.actionIcon}><MaterialIcons name={icon} size={22} color={palette.primary} /></View>
      <View style={styles.actionCopy}><View style={styles.actionTitleRow}><Text style={styles.step}>{step}</Text><Text style={styles.actionTitle}>{title}</Text></View><Text style={styles.actionSubtitle}>{subtitle}</Text></View>
      <MaterialIcons name="chevron-right" size={24} color="#8C95A4" />
    </TouchableOpacity>
  );
}

function FlowStep({ number, text, last = false }: { number: string; text: string; last?: boolean }) {
  return (
    <View style={styles.flowStep}>
      <View style={[styles.flowDot, last && styles.flowDotLast]}><Text style={[styles.flowNumber, last && styles.flowNumberLast]}>{number}</Text></View>
      <Text style={styles.flowStepText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.canvas },
  header: { minHeight: 64, paddingHorizontal: 18, paddingVertical: 9, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: palette.line, backgroundColor: "#FFFAF5" },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerTitle: { fontSize: 15, fontWeight: "800", color: palette.ink },
  privateLine: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: palette.mint },
  privateText: { fontSize: 10, color: palette.muted, fontWeight: "600" },
  headerBadge: { flexDirection: "row", alignItems: "center", gap: 4, borderWidth: 1, borderColor: "#D9F1E1", backgroundColor: "#F2FBF5", borderRadius: 99, paddingHorizontal: 9, paddingVertical: 6 },
  headerBadgeText: { fontSize: 9, fontWeight: "900", letterSpacing: 0.5, color: palette.mint },
  scrollArea: { flex: 1 },
  content: { flexGrow: 1, width: "100%", maxWidth: 620, alignSelf: "center", paddingHorizontal: 18, paddingTop: 22, paddingBottom: 25 },
  welcome: { marginBottom: 20 },
  welcomeIcon: { width: 45, height: 45, borderRadius: 15, backgroundColor: "#FFF0E4", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  title: { fontSize: 24, lineHeight: 30, color: palette.ink, fontWeight: "900", letterSpacing: -0.7 },
  subtitle: { marginTop: 7, fontSize: 13, lineHeight: 19, color: palette.muted },
  sectionLabel: { fontSize: 10, fontWeight: "900", letterSpacing: 1, color: palette.muted, marginBottom: 8 },
  actionCard: { flexDirection: "row", alignItems: "center", gap: 11, minHeight: 78, borderRadius: 16, borderWidth: 1, borderColor: palette.line, backgroundColor: "#FFFFFF", paddingHorizontal: 12, paddingVertical: 11, marginBottom: 9 },
  actionIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: palette.primaryLight, alignItems: "center", justifyContent: "center" },
  actionCopy: { flex: 1 },
  actionTitleRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  step: { fontSize: 9, color: palette.primary, fontWeight: "900", letterSpacing: 0.6 },
  actionTitle: { fontSize: 13, fontWeight: "900", color: palette.ink },
  actionSubtitle: { fontSize: 11, lineHeight: 15, color: palette.muted, marginTop: 3 },
  flowCard: { padding: 14, marginTop: 9, backgroundColor: "#FCFCFD" },
  flowHeader: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 12 },
  flowTitle: { fontSize: 12, fontWeight: "900", color: palette.ink },
  flowStep: { flexDirection: "row", alignItems: "center", gap: 9, minHeight: 29 },
  flowDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: "#D8DEE8", backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  flowDotLast: { backgroundColor: "#EBF8EF", borderColor: "#BFE8CD" },
  flowNumber: { color: palette.muted, fontSize: 9, fontWeight: "900" },
  flowNumberLast: { color: palette.mint },
  flowStepText: { flex: 1, color: palette.muted, fontSize: 10, lineHeight: 14 },
  privacyNote: { flexDirection: "row", gap: 6, alignItems: "flex-start", borderTopWidth: 1, borderTopColor: palette.line, paddingTop: 9, marginTop: 7 },
  privacyText: { flex: 1, fontSize: 10, lineHeight: 14, color: palette.muted },
});
