import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppScreen, BrandMark, Card, Chevron, palette, PrimaryButton, PrivacyChip, SectionTitle, StatusPill } from "@/components/beepai-ui";
import { useBeepAI } from "@/lib/beepai-context";
import { type RunRecord } from "@/lib/beepai-data";

export default function HomeScreen() {
  const router = useRouter();
  const { automations, runs, runAutomation, runningIds } = useBeepAI();
  const featured = automations[0];
  const recentRuns = runs.slice(0, 3);
  const activeCount = automations.filter((item) => item.status === "active").length;
  const successfulRuns = runs.filter((item) => item.status === "success").length;

  const renderRun = ({ item }: { item: RunRecord }) => (
    <TouchableOpacity onPress={() => router.push(`/run/${item.id}`)} activeOpacity={0.75} style={styles.runRow}>
      <View style={[styles.runIcon, { backgroundColor: item.status === "failed" ? "#FEECEC" : "#EAF9EE" }]}><MaterialIcons name={item.status === "failed" ? "priority-high" : "check"} color={item.status === "failed" ? palette.danger : palette.mint} size={17} /></View>
      <View style={styles.runCopy}><Text numberOfLines={1} style={styles.runName}>{item.automationName}</Text><Text style={styles.runMeta}>{item.timestamp} · {item.duration}</Text></View>
      <StatusPill label={item.status === "failed" ? "Needs review" : "Success"} tone={item.status === "failed" ? "red" : "green"} />
    </TouchableOpacity>
  );

  return (
    <AppScreen>
      <FlatList
        data={recentRuns}
        keyExtractor={(item) => item.id}
        renderItem={renderRun}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            <View style={styles.topRow}><BrandMark /><PrivacyChip /></View>
            <View style={styles.welcomeRow}><View><Text style={styles.kicker}>GOOD MORNING</Text><Text style={styles.greeting}>Work, simplified.</Text><Text style={styles.subheading}>Your automations stay private and run when you need them.</Text></View><View style={styles.avatar}><Text style={styles.avatarText}>J</Text></View></View>
            <View style={styles.metrics}>
              <Metric icon="bolt" label="Active" value={`${activeCount}`} color={palette.violet} />
              <Metric icon="check-circle" label="Successful" value={`${successfulRuns}`} color={palette.mint} />
              <Metric icon="schedule" label="Scheduled" value="2" color={palette.blue} />
            </View>
            {featured && <Card style={styles.featuredCard}>
              <View style={styles.featuredTop}><View style={styles.featuredTitleWrap}><View style={styles.featuredIcon}><MaterialIcons name="description" size={19} color={palette.violet} /></View><View><Text style={styles.featuredLabel}>READY TO RUN</Text><Text style={styles.featuredTitle}>{featured.name}</Text></View></View><StatusPill label={featured.status === "active" ? "Active" : "Paused"} tone={featured.status === "active" ? "green" : "orange"} /></View>
              <Text style={styles.featuredDescription}>{featured.description}</Text>
              <View style={styles.featuredInfo}><MaterialIcons name="schedule" size={16} color={palette.muted} /><Text style={styles.featuredInfoText}>{featured.nextRun}</Text><View style={styles.dot} /><Text style={styles.featuredInfoText}>Local execution</Text></View>
              <PrimaryButton label={runningIds.includes(featured.id) ? "Running privately" : "Run now"} icon="play-arrow" loading={runningIds.includes(featured.id)} onPress={() => runAutomation(featured.id)} style={styles.runButton} />
              <TouchableOpacity onPress={() => router.push(`/automation/${featured.id}`)} style={styles.detailLink}><Text style={styles.detailLinkText}>View automation details</Text><MaterialIcons name="arrow-forward" size={15} color={palette.violet} /></TouchableOpacity>
            </Card>}
            <SectionTitle eyebrow="AUTOMATION CONTROL" title="Your workspace" action={<TouchableOpacity onPress={() => router.push("/create")}><Text style={styles.sectionAction}>Create new</Text></TouchableOpacity>} />
            <View style={styles.quickGrid}>
              <QuickAction icon="auto-awesome" title="Describe a task" text="Build from plain language" onPress={() => router.push("/create")} />
              <QuickAction icon="admin-panel-settings" title="Permissions" text="Review data access" onPress={() => featured && router.push(`/permissions/${featured.id}`)} />
            </View>
            <SectionTitle eyebrow="RECENT ACTIVITY" title="Runs on this device" action={<TouchableOpacity onPress={() => router.push("/(tabs)/activity")}><Text style={styles.sectionAction}>View all</Text></TouchableOpacity>} />
          </>
        }
        ListFooterComponent={<View style={styles.footerNote}><MaterialIcons name="verified-user" size={16} color={palette.violet} /><Text style={styles.footerNoteText}>BeepAI does not keep copies of your work files.</Text></View>}
      />
    </AppScreen>
  );
}

function Metric({ icon, label, value, color }: { icon: keyof typeof MaterialIcons.glyphMap; label: string; value: string; color: string }) {
  return <View style={styles.metric}><View style={[styles.metricIcon, { backgroundColor: `${color}14` }]}><MaterialIcons name={icon} size={17} color={color} /></View><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

function QuickAction({ icon, title, text, onPress }: { icon: keyof typeof MaterialIcons.glyphMap; title: string; text: string; onPress: () => void }) {
  return <TouchableOpacity activeOpacity={0.76} onPress={onPress} style={styles.quickAction}><View style={styles.quickIcon}><MaterialIcons name={icon} color={palette.violet} size={20} /></View><View style={styles.quickCopy}><Text style={styles.quickTitle}>{title}</Text><Text style={styles.quickText}>{text}</Text></View><Chevron /></TouchableOpacity>;
}

const styles = StyleSheet.create({
  listContent: { padding: 20, paddingTop: 12, paddingBottom: 28 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 25 },
  welcomeRow: { flexDirection: "row", justifyContent: "space-between", gap: 16, marginBottom: 22 },
  kicker: { color: palette.violet, fontSize: 11, fontWeight: "900", letterSpacing: 1.2, marginBottom: 5 },
  greeting: { color: palette.ink, fontSize: 31, lineHeight: 37, fontWeight: "900", letterSpacing: -1.1 },
  subheading: { color: palette.muted, fontSize: 14, lineHeight: 20, maxWidth: 285, marginTop: 7 },
  avatar: { width: 42, height: 42, borderRadius: 15, backgroundColor: "#EDE9FE", alignItems: "center", justifyContent: "center", marginTop: 4 },
  avatarText: { color: palette.violet, fontSize: 16, fontWeight: "900" },
  metrics: { flexDirection: "row", gap: 10, marginBottom: 24 },
  metric: { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 17, padding: 12, borderWidth: 1, borderColor: palette.line },
  metricIcon: { width: 29, height: 29, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 9 },
  metricValue: { fontSize: 21, color: palette.ink, fontWeight: "900", letterSpacing: -0.5 },
  metricLabel: { fontSize: 11, color: palette.muted, marginTop: 1, fontWeight: "700" },
  featuredCard: { padding: 17, marginBottom: 27, backgroundColor: "#FFFFFF" },
  featuredTop: { flexDirection: "row", justifyContent: "space-between", gap: 10, alignItems: "flex-start" },
  featuredTitleWrap: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  featuredIcon: { height: 37, width: 37, borderRadius: 12, justifyContent: "center", alignItems: "center", backgroundColor: palette.violetLight },
  featuredLabel: { color: palette.violet, fontSize: 10, fontWeight: "900", letterSpacing: 0.7, marginBottom: 2 },
  featuredTitle: { color: palette.ink, fontSize: 16, fontWeight: "900", letterSpacing: -0.3 },
  featuredDescription: { color: palette.muted, fontSize: 13, lineHeight: 18, marginTop: 14 },
  featuredInfo: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12, marginBottom: 15 },
  featuredInfoText: { color: palette.muted, fontSize: 12, fontWeight: "600" },
  dot: { height: 3, width: 3, borderRadius: 2, backgroundColor: "#BFC5D2", marginHorizontal: 1 },
  runButton: { borderRadius: 14, minHeight: 48 },
  detailLink: { alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 5, paddingTop: 12, paddingBottom: 2 },
  detailLinkText: { color: palette.violet, fontSize: 13, fontWeight: "800" },
  sectionAction: { color: palette.violet, fontSize: 13, fontWeight: "800", padding: 4 },
  quickGrid: { gap: 10, marginBottom: 27 },
  quickAction: { backgroundColor: "#FFFFFF", borderRadius: 17, padding: 13, borderWidth: 1, borderColor: palette.line, flexDirection: "row", alignItems: "center" },
  quickIcon: { backgroundColor: palette.violetLight, height: 38, width: 38, borderRadius: 12, justifyContent: "center", alignItems: "center", marginRight: 10 },
  quickCopy: { flex: 1 },
  quickTitle: { color: palette.ink, fontSize: 14, fontWeight: "800" },
  quickText: { color: palette.muted, fontSize: 11, marginTop: 2 },
  runRow: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: palette.line, borderRadius: 16, padding: 12, marginBottom: 9, flexDirection: "row", alignItems: "center" },
  runIcon: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center", marginRight: 10 },
  runCopy: { flex: 1, paddingRight: 8 },
  runName: { color: palette.ink, fontSize: 13, fontWeight: "800" },
  runMeta: { color: palette.muted, fontSize: 11, marginTop: 3 },
  footerNote: { flexDirection: "row", gap: 8, alignItems: "center", marginTop: 17, paddingVertical: 8, justifyContent: "center" },
  footerNoteText: { color: palette.muted, fontSize: 11, fontWeight: "600" },
});
