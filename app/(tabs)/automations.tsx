import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { AppScreen, BrandMark, Card, palette, PrimaryButton, StatusPill } from "@/components/beepai-ui";
import { useBeepAI } from "@/lib/beepai-context";
import type { Automation } from "@/lib/beepai-data";

export default function AutomationsScreen() {
  const router = useRouter();
  const { automations, runAutomation, runningIds } = useBeepAI();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "paused">("all");
  const items = useMemo(() => automations.filter((item) => (filter === "all" || item.status === filter) && item.name.toLowerCase().includes(query.toLowerCase())), [automations, filter, query]);
  return (
    <AppScreen>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <AutomationRow item={item} running={runningIds.includes(item.id)} onOpen={() => router.push({ pathname: "/automation/[id]", params: { id: item.id } })} onRun={() => runAutomation(item.id)} />}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={<>
          <View style={styles.topRow}><BrandMark /><TouchableOpacity onPress={() => router.push("/create" as never)} style={styles.addButton}><MaterialIcons name="add" size={20} color="#fff" /></TouchableOpacity></View>
          <Text style={styles.title}>Automations</Text><Text style={styles.subtitle}>Your repeatable work, configured around you.</Text>
          <View style={styles.search}><MaterialIcons name="search" size={20} color="#98A2B3" /><TextInput value={query} onChangeText={setQuery} placeholder="Search automations" placeholderTextColor="#98A2B3" style={styles.searchInput} returnKeyType="done" /></View>
          <View style={styles.filters}><FilterChip label="All" count={automations.length} active={filter === "all"} onPress={() => setFilter("all")} /><FilterChip label="Active" count={automations.filter((item) => item.status === "active").length} active={filter === "active"} onPress={() => setFilter("active")} /><FilterChip label="Paused" count={automations.filter((item) => item.status === "paused").length} active={filter === "paused"} onPress={() => setFilter("paused")} /></View>
          <View style={styles.listLabel}><Text style={styles.listTitle}>{filter === "all" ? "All automations" : `${filter[0].toUpperCase()}${filter.slice(1)} automations`}</Text><Text style={styles.listCount}>{items.length} total</Text></View>
        </>}
        ListEmptyComponent={<Card style={styles.empty}><MaterialIcons name="search-off" size={28} color={palette.violet} /><Text style={styles.emptyTitle}>No automation found</Text><Text style={styles.emptyText}>Try a different search or create a new automation request.</Text></Card>}
      />
    </AppScreen>
  );
}

function FilterChip({ label, count, active, onPress }: { label: string; count: number; active: boolean; onPress: () => void }) {
  return <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={[styles.filterChip, active && styles.filterChipActive]}><Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text><View style={[styles.filterCount, active && styles.filterCountActive]}><Text style={[styles.filterCountText, active && styles.filterCountTextActive]}>{count}</Text></View></TouchableOpacity>;
}

function AutomationRow({ item, running, onOpen, onRun }: { item: Automation; running: boolean; onOpen: () => void; onRun: () => void }) {
  const icon = item.category === "Files" ? "folder" : item.category === "Messages" ? "chat" : item.category === "Excel" ? "table-chart" : "description";
  const iconColor = item.category === "Messages" ? palette.mint : item.category === "Files" ? palette.amber : palette.violet;
  return <Card style={styles.automationCard}>
    <TouchableOpacity activeOpacity={0.75} onPress={onOpen} style={styles.automationTop}>
      <View style={[styles.categoryIcon, { backgroundColor: `${iconColor}14` }]}><MaterialIcons name={icon} size={21} color={iconColor} /></View>
      <View style={styles.automationCopy}><Text numberOfLines={1} style={styles.automationName}>{item.name}</Text><Text numberOfLines={1} style={styles.automationDescription}>{item.description}</Text></View><MaterialIcons name="chevron-right" size={22} color="#98A2B3" />
    </TouchableOpacity>
    <View style={styles.metaRow}><StatusPill label={item.status === "active" ? "Active" : "Paused"} tone={item.status === "active" ? "green" : "orange"} /><View style={styles.metaItem}><MaterialIcons name="schedule" size={14} color={palette.muted} /><Text style={styles.metaText}>{item.schedule}</Text></View></View>
    <View style={styles.cardFooter}><View><Text style={styles.nextLabel}>NEXT RUN</Text><Text style={styles.nextText}>{item.nextRun}</Text></View><PrimaryButton label={running ? "Running" : "Run"} icon={running ? "sync" : "play-arrow"} loading={running} onPress={onRun} style={styles.smallRun} /></View>
  </Card>;
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingTop: 12, paddingBottom: 28 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 23 },
  addButton: { height: 39, width: 39, alignItems: "center", justifyContent: "center", borderRadius: 13, backgroundColor: palette.violet },
  title: { color: palette.ink, fontSize: 30, lineHeight: 37, fontWeight: "900", letterSpacing: -1 },
  subtitle: { color: palette.muted, fontSize: 14, lineHeight: 20, marginTop: 5, marginBottom: 18 },
  search: { height: 48, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: palette.line, paddingHorizontal: 13, borderRadius: 15, flexDirection: "row", alignItems: "center", gap: 8 },
  searchInput: { flex: 1, color: palette.ink, fontSize: 14, height: 48 },
  filters: { flexDirection: "row", gap: 8, marginTop: 13, marginBottom: 24 },
  filterChip: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 12, paddingHorizontal: 10, height: 34, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: palette.line },
  filterChipActive: { backgroundColor: palette.violet, borderColor: palette.violet },
  filterText: { fontSize: 12, fontWeight: "800", color: palette.muted }, filterTextActive: { color: "#FFFFFF" },
  filterCount: { borderRadius: 99, minWidth: 17, height: 17, justifyContent: "center", alignItems: "center", backgroundColor: "#F2F4F7" }, filterCountActive: { backgroundColor: "#FFFFFF33" },
  filterCountText: { fontSize: 10, fontWeight: "800", color: palette.muted }, filterCountTextActive: { color: "#FFFFFF" },
  listLabel: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }, listTitle: { fontSize: 18, fontWeight: "900", color: palette.ink, letterSpacing: -0.3 }, listCount: { fontSize: 12, color: palette.muted, fontWeight: "700" },
  automationCard: { padding: 14, marginBottom: 11 }, automationTop: { flexDirection: "row", alignItems: "center", gap: 10 }, categoryIcon: { height: 42, width: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" }, automationCopy: { flex: 1 }, automationName: { color: palette.ink, fontSize: 15, fontWeight: "900", letterSpacing: -0.2 }, automationDescription: { color: palette.muted, fontSize: 12, marginTop: 3 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 9, marginTop: 13 }, metaItem: { flexDirection: "row", alignItems: "center", gap: 4 }, metaText: { color: palette.muted, fontSize: 11, fontWeight: "700" },
  cardFooter: { borderTopWidth: 1, borderTopColor: "#EEF0F5", marginTop: 13, paddingTop: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, nextLabel: { color: "#98A2B3", fontSize: 10, letterSpacing: 0.7, fontWeight: "900" }, nextText: { color: palette.ink, fontSize: 12, fontWeight: "800", marginTop: 3 }, smallRun: { minHeight: 37, borderRadius: 11, paddingHorizontal: 14 },
  empty: { alignItems: "center", gap: 8, padding: 25, marginTop: 8 }, emptyTitle: { color: palette.ink, fontSize: 16, fontWeight: "900", marginTop: 4 }, emptyText: { color: palette.muted, fontSize: 13, textAlign: "center", lineHeight: 19 },
});
