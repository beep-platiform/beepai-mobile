import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppScreen, BrandMark, Card, palette, StatusPill } from "@/components/beepai-ui";
import { useBeepAI } from "@/lib/beepai-context";
import type { RunRecord, RunStatus } from "@/lib/beepai-data";

type TaskFilter = "all" | "today" | "upcoming" | "done";

const STATUS_META: Record<RunStatus, { label: string; tone: "green" | "blue" | "orange" | "violet" | "red"; icon: keyof typeof MaterialIcons.glyphMap }> = {
  success: { label: "Done", tone: "green", icon: "check-circle" },
  running: { label: "In Progress", tone: "blue", icon: "schedule" },
  pending: { label: "Pending", tone: "orange", icon: "schedule" },
  scheduled: { label: "Scheduled", tone: "violet", icon: "event" },
  failed: { label: "Needs review", tone: "red", icon: "error-outline" },
};

export default function TasksScreen() {
  const router = useRouter();
  const { runs } = useBeepAI();
  const [filter, setFilter] = useState<TaskFilter>("all");

  const filteredRuns = useMemo(() => {
    switch (filter) {
      case "today":
        return runs.filter((item) => item.timestamp.toLowerCase().startsWith("today"));
      case "upcoming":
        return runs.filter((item) => item.status === "pending" || item.status === "scheduled");
      case "done":
        return runs.filter((item) => item.status === "success");
      default:
        return runs;
    }
  }, [runs, filter]);

  return (
    <AppScreen>
      <FlatList
        data={filteredRuns}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TaskRow item={item} onPress={() => router.push(`/run/${item.id}`)} />}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={styles.topRow}>
              <BrandMark />
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Filter tasks" style={styles.filterButton}>
                <MaterialIcons name="tune" size={19} color={palette.ink} />
              </TouchableOpacity>
            </View>
            <Text style={styles.title}>Tasks</Text>
            <View style={styles.filters}>
              <TaskFilterChip label="All" active={filter === "all"} onPress={() => setFilter("all")} />
              <TaskFilterChip label="Today" active={filter === "today"} onPress={() => setFilter("today")} />
              <TaskFilterChip label="Upcoming" active={filter === "upcoming"} onPress={() => setFilter("upcoming")} />
              <TaskFilterChip label="Done" active={filter === "done"} onPress={() => setFilter("done")} />
            </View>
          </>
        }
        ListEmptyComponent={
          <Card style={styles.empty}>
            <MaterialIcons name="event-available" size={26} color={palette.primary} />
            <Text style={styles.emptyText}>No tasks in this view yet.</Text>
          </Card>
        }
        ListFooterComponent={<View style={{ height: 76 }} />}
      />
      <TouchableOpacity onPress={() => router.push("/create" as never)} style={styles.newTaskButton} activeOpacity={0.9}>
        <MaterialIcons name="add" size={19} color="#FFFFFF" />
        <Text style={styles.newTaskText}>New Task</Text>
      </TouchableOpacity>
    </AppScreen>
  );
}

function TaskFilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={[styles.filterChip, active && styles.filterChipActive]}>
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function TaskRow({ item, onPress }: { item: RunRecord; onPress: () => void }) {
  const meta = STATUS_META[item.status];
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.76}>
      <Card style={styles.row}>
        <View style={[styles.rowIcon, { backgroundColor: iconBackground(meta.tone) }]}>
          <MaterialIcons name={meta.icon} color={iconColor(meta.tone)} size={19} />
        </View>
        <View style={styles.rowCopy}>
          <Text numberOfLines={1} style={styles.rowTitle}>{item.automationName}</Text>
          <Text numberOfLines={1} style={styles.rowMeta}>{item.timestamp}</Text>
        </View>
        <StatusPill label={meta.label} tone={meta.tone} />
      </Card>
    </TouchableOpacity>
  );
}

function iconBackground(tone: "green" | "blue" | "orange" | "violet" | "red") {
  return { green: "#EAF9EE", blue: "#EAF1FF", orange: "#FFF4E6", violet: palette.primaryLight, red: "#FEECEC" }[tone];
}
function iconColor(tone: "green" | "blue" | "orange" | "violet" | "red") {
  return { green: palette.mint, blue: palette.blue, orange: palette.amber, violet: palette.primary, red: palette.danger }[tone];
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingTop: 12, paddingBottom: 28 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  filterButton: { width: 39, height: 39, borderRadius: 13, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: palette.line, alignItems: "center", justifyContent: "center" },
  title: { color: palette.ink, fontSize: 28, lineHeight: 34, fontWeight: "900", letterSpacing: -1, marginBottom: 16 },
  filters: { flexDirection: "row", gap: 8, marginBottom: 20 },
  filterChip: { height: 34, paddingHorizontal: 14, justifyContent: "center", borderRadius: 12, borderWidth: 1, borderColor: palette.line, backgroundColor: "#FFFFFF" },
  filterChipActive: { backgroundColor: palette.primary, borderColor: palette.primary },
  filterChipText: { color: palette.muted, fontWeight: "800", fontSize: 12 },
  filterChipTextActive: { color: "#FFFFFF" },
  row: { padding: 13, marginBottom: 10, flexDirection: "row", alignItems: "center", gap: 11 },
  rowIcon: { width: 38, height: 38, borderRadius: 13, justifyContent: "center", alignItems: "center" },
  rowCopy: { flex: 1 },
  rowTitle: { color: palette.ink, fontSize: 14, fontWeight: "900" },
  rowMeta: { color: palette.muted, fontSize: 11, marginTop: 3 },
  empty: { padding: 22, gap: 9, alignItems: "center" },
  emptyText: { color: palette.muted, fontSize: 13 },
  newTaskButton: { position: "absolute", left: 20, right: 20, bottom: 18, height: 52, borderRadius: 16, backgroundColor: palette.primary, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, shadowColor: palette.primary, shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  newTaskText: { color: "#FFFFFF", fontSize: 15, fontWeight: "800" },
});
