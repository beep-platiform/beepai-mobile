import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppScreen, BrandMark, Card, palette, StatusPill } from "@/components/beepai-ui";
import { useBeepAI } from "@/lib/beepai-context";
import { type Automation } from "@/lib/beepai-data";
import { usePendingPackageCheck } from "@/lib/use-pending-package";

function formatDuration(totalMinutes: number) {
  if (totalMinutes < 60) return `${totalMinutes}m`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}

export default function DashboardScreen() {
  const router = useRouter();
  const { automations, runs, runAutomation, runningIds } = useBeepAI();
  const { pendingPackage } = usePendingPackageCheck();

  const activeCount = automations.filter((item) => item.status === "active").length;
  const successfulRuns = runs.filter((item) => item.status === "success").length;
  const failedRuns = runs.filter((item) => item.status === "failed").length;
  const finishedRuns = runs.filter((item) => item.status === "success" || item.status === "failed").length;
  const successRate = finishedRuns ? `${Math.round((successfulRuns / finishedRuns) * 100)}%` : "—";
  const tasksToday = runs.filter((item) => item.timestamp.toLowerCase().startsWith("today")).length;
  const timeSaved = successfulRuns ? formatDuration(successfulRuns * 12) : "0m";

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
      <View style={styles.stickyHeader}>
        <BrandMark />
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Notifications" style={styles.bellButton}>
          <MaterialIcons name="notifications-none" size={22} color={palette.ink} />
          {(failedRuns > 0 || pendingPackage) && <View style={styles.bellDot} />}
        </TouchableOpacity>
      </View>

      <FlatList
        data={automations.slice(0, 4)}
        keyExtractor={(item) => item.id}
        renderItem={renderAutomation}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <Text style={styles.greeting}>Good morning! 👋</Text>
            <Text style={styles.subheading}>Let BeepAI handle your tasks.</Text>

            {pendingPackage && (
              <TouchableOpacity onPress={() => router.push({ pathname: "/redeem", params: { code: pendingPackage.redemptionCode } } as never)} activeOpacity={0.85} style={styles.packageBanner}>
                <View style={styles.packageIconWrap}><MaterialIcons name="mark-email-unread" size={20} color="#FFFFFF" /></View>
                <View style={styles.packageCopy}>
                  <Text style={styles.packageTitle}>Your BeepAI package is ready</Text>
                  <Text style={styles.packageSubtitle}>Tap to redeem it with your code</Text>
                </View>
                <MaterialIcons name="arrow-forward" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            )}

            <View style={styles.heroCard}>
              <View style={styles.heroTextBlock}>
                <Text style={styles.heroLabel}>Active Automations</Text>
                <Text style={styles.heroValue}>{activeCount}</Text>
                <View style={styles.heroStatusRow}>
                  <MaterialIcons name={activeCount ? "check-circle" : "info"} size={14} color="#FFFFFF" />
                  <Text style={styles.heroStatus}>{activeCount ? "Running smoothly" : "No automations yet"}</Text>
                </View>
              </View>
              <View style={styles.heroIconWrap}>
                <MaterialIcons name="bolt" size={34} color="#FFFFFF" />
              </View>
            </View>

            <View style={styles.metricsGrid}>
              <Metric icon="check-circle-outline" label="Tasks Today" value={`${tasksToday}`} color={palette.mint} />
              <Metric icon="schedule" label="Time Saved" value={timeSaved} color={palette.blue} />
              <Metric icon="trending-up" label="Success Rate" value={successRate} color={palette.primary} />
              <Metric icon="notifications-active" label="Alerts" value={`${failedRuns}`} color={palette.amber} />
            </View>

            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Recent Automations</Text>
              {automations.length > 0 && (
                <TouchableOpacity onPress={() => router.push("/(tabs)/automations")}>
                  <Text style={styles.sectionAction}>View all</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        }
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <View style={styles.emptyIcon}><MaterialIcons name="auto-awesome" size={22} color={palette.primary} /></View>
            <Text style={styles.emptyTitle}>No automations yet</Text>
            <Text style={styles.emptyText}>Tell BeepAI about a repetitive task and your admin will build it for you.</Text>
            <TouchableOpacity onPress={() => router.push("/create" as never)} style={styles.emptyButton}>
              <Text style={styles.emptyButtonText}>Request an automation</Text>
            </TouchableOpacity>
          </Card>
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
  stickyHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14, backgroundColor: palette.canvas, zIndex: 10 },
  listContent: { paddingHorizontal: 20, paddingBottom: 28 },
  bellButton: { width: 40, height: 40, borderRadius: 13, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: palette.line, alignItems: "center", justifyContent: "center" },
  bellDot: { position: "absolute", top: 8, right: 9, width: 8, height: 8, borderRadius: 4, backgroundColor: palette.danger, borderWidth: 1.5, borderColor: "#FFFFFF" },
  greeting: { color: palette.ink, fontSize: 26, lineHeight: 32, fontWeight: "900", letterSpacing: -0.8, marginTop: 8 },
  subheading: { color: palette.muted, fontSize: 14, lineHeight: 20, marginTop: 4, marginBottom: 16 },
  packageBanner: { flexDirection: "row", alignItems: "center", gap: 11, backgroundColor: palette.ink, borderRadius: 16, padding: 14, marginBottom: 16 },
  packageIconWrap: { width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.16)", alignItems: "center", justifyContent: "center" },
  packageCopy: { flex: 1 },
  packageTitle: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
  packageSubtitle: { color: "#D8DEEC", fontSize: 11, marginTop: 2 },
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
  emptyCard: { alignItems: "center", padding: 22, gap: 6 },
  emptyIcon: { width: 44, height: 44, borderRadius: 15, backgroundColor: palette.primaryLight, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  emptyTitle: { color: palette.ink, fontSize: 15, fontWeight: "900" },
  emptyText: { color: palette.muted, fontSize: 12, textAlign: "center", lineHeight: 17, marginBottom: 10 },
  emptyButton: { backgroundColor: palette.primary, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 12 },
  emptyButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  redeemNote: { flexDirection: "row", gap: 7, alignItems: "center", marginTop: 8, paddingVertical: 12, justifyContent: "center", backgroundColor: palette.primaryLight, borderRadius: 14 },
  redeemNoteText: { color: palette.primary, fontSize: 12, fontWeight: "800" },
});
