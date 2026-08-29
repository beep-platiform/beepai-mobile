import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppScreen, BrandMark, Card, palette, StatusPill } from "@/components/beepai-ui";
import { useBeepAI } from "@/lib/beepai-context";
import { type Automation } from "@/lib/beepai-data";

function formatDuration(totalMinutes: number) {
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}

export default function DashboardScreen() {
  const router = useRouter();
  const { automations, runs, runAutomation, runningIds } = useBeepAI();

  const activeCount = automations.filter((item) => item.status === "active").length;
  const successfulRuns = runs.filter((item) => item.status === "success").length;
  const failedRuns = runs.filter((item) => item.status === "failed").length;
  const finishedRuns = runs.filter((item) => item.status === "success" || item.status === "failed").length;
  const successRate = finishedRuns ? Math.round((successfulRuns / finishedRuns) * 100) : 100;
  const tasksToday = runs.filter((item) => item.timestamp.toLowerCase().startsWith("today")).length || runs.length;
  const timeSaved = formatDuration(successfulRuns * 12);

  const renderAutomation = ({ item }: { item: Automation }) => (
    <TouchableOpacity onPress={() => router.push(`/automation/${item.id}`)} activeOpacity={0.75} style={styles.recentRow}>
      <View style={[styles.recentIcon, { backgroundColor: palette.primaryLight }]}>
        <MaterialIcons name={item.category === "Messages" ? "chat" : item.category === "Files" ? "folder" : "table-chart"} size={18} color={palette.primary} />
      </View>
      <View style={styles.recentCopy}>
        <Text numberOfLines={1} style={styles.recentName}>{item.name}</Text>
        <Text numberOfLines={1} style={styles.recentMeta}>{item.schedule}</Text>
      </View>
      <StatusPill label={item.status === "active" ? "Active" : item.status === "paused" ? "Paused" : "Stopped"} tone={item.status === "active" ? "green" : item.status === "paused" ? "orange" : "gray"} />
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`Run ${item.name}`}
        onPress={() => runAutomation(item.id)}
        style={styles.recentPlay}
      >
        <MaterialIcons name={runningIds.includes(item.id) ? "sync" : "play-arrow"} size={17} color={palette.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <AppScreen>
      <FlatList
        data={automations.slice(0, 4)}
        keyExtractor={(item) => item.id}
        renderItem={renderAutomation}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <View style={styles.topRow}>
              <BrandMark />
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Notifications" style={styles.bellButton}>
                <MaterialIcons name="notifications-none" size={22} color={palette.ink} />
                {failedRuns > 0 && <View style={styles.bellDot} />}
              </TouchableOpacity>
            </View>

            <Text style={styles.greeting}>Good morning! 👋</Text>
            <Text style={styles.subheading}>Let BeepAI handle your tasks.</Text>

            <View style={styles.heroCard}>
              <View style={styles.heroTextBlock}>
                <Text style={styles.heroLabel}>Active Automations</Text>
                <Text style={styles.heroValue}>{activeCount}</Text>
                <View style={styles.heroStatusRow}>
                  <MaterialIcons name="check-circle" size={14} color="#FFFFFF" />
                  <Text style={styles.heroStatus}>Running smoothly</Text>
                </View>
              </View>
              <View style={styles.heroIconWrap}>
                <MaterialIcons name="bolt" size={34} color="#FFFFFF" />
              </View>
            </View>

            <View style={styles.metricsGrid}>
              <Metric icon="check-circle-outline" label="Tasks Today" value={`${tasksToday}`} color={palette.mint} />
              <Metric icon="schedule" label="Time Saved" value={timeSaved} color={palette.blue} />
              <Metric icon="trending-up" label="Success Rate" value={`${successRate}%`} color={palette.primary} />
              <Metric icon="notifications-active" label="Alerts" value={`${failedRuns}`} color={palette.amber} />
            </View>

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Recent Automations</Text>
              <TouchableOpacity onPress={() => router.push("/(tabs)/automations")}>
                <Text style={styles.sectionAction}>View all</Text>
              </TouchableOpacity>
            </View>
          </>
        }
        ListFooterComponent={
          <TouchableOpacity onPress={() => router.push("/redeem" as never)} style={styles.redeemNote}>
            <MaterialIcons name="qr-code-2" size={16} color={palette.primary} />
            <Text style={styles.redeemNoteText}>Have a package code from BeepAI? Redeem it</Text>
            <MaterialIcons name="arrow-forward" size={15} color={palette.primary} />
          </TouchableOpacity>
        }
      />
    </AppScreen>
  );
}

function Metric({ icon, label, value, color }: { icon: keyof typeof MaterialIcons.glyphMap; label: string; value: string; color: string }) {
  return (
    <Card style={styles.metricCard}>
      <View style={[styles.metricIcon, { backgroundColor: `${color}17` }]}><MaterialIcons name={icon} size={17} color={color} /></View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  listContent: { padding: 20, paddingTop: 12, paddingBottom: 28 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 22 },
  bellButton: { width: 40, height: 40, borderRadius: 13, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: palette.line, alignItems: "center", justifyContent: "center" },
  bellDot: { position: "absolute", top: 8, right: 9, width: 8, height: 8, borderRadius: 4, backgroundColor: palette.danger, borderWidth: 1.5, borderColor: "#FFFFFF" },
  greeting: { color: palette.ink, fontSize: 26, lineHeight: 32, fontWeight: "900", letterSpacing: -0.8 },
  subheading: { color: palette.muted, fontSize: 14, lineHeight: 20, marginTop: 4, marginBottom: 20 },
  heroCard: { backgroundColor: palette.primary, borderRadius: 22, padding: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  heroTextBlock: { flex: 1 },
  heroLabel: { color: "#FFE9DD", fontSize: 13, fontWeight: "800", marginBottom: 6 },
  heroValue: { color: "#FFFFFF", fontSize: 40, fontWeight: "900", letterSpacing: -1.2, lineHeight: 44 },
  heroStatusRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8 },
  heroStatus: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  heroIconWrap: { width: 56, height: 56, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  metricCard: { width: "47.5%", padding: 13 },
  metricIcon: { width: 30, height: 30, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  metricValue: { fontSize: 20, color: palette.ink, fontWeight: "900", letterSpacing: -0.4 },
  metricLabel: { fontSize: 11, color: palette.muted, marginTop: 2, fontWeight: "700" },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "900", color: palette.ink, letterSpacing: -0.3 },
  sectionAction: { color: palette.primary, fontSize: 13, fontWeight: "800" },
  recentRow: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: palette.line, borderRadius: 16, padding: 12, marginBottom: 9, flexDirection: "row", alignItems: "center", gap: 9 },
  recentIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  recentCopy: { flex: 1 },
  recentName: { color: palette.ink, fontSize: 13, fontWeight: "800" },
  recentMeta: { color: palette.muted, fontSize: 11, marginTop: 2 },
  recentPlay: { width: 30, height: 30, borderRadius: 10, backgroundColor: palette.primaryLight, alignItems: "center", justifyContent: "center" },
  redeemNote: { flexDirection: "row", gap: 7, alignItems: "center", marginTop: 8, paddingVertical: 12, justifyContent: "center", backgroundColor: palette.primaryLight, borderRadius: 14 },
  redeemNoteText: { color: palette.primary, fontSize: 12, fontWeight: "800" },
});
