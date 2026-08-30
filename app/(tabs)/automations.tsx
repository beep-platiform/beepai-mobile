import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { FlatList, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import { AppScreen, BrandMark, Card, palette, StatusPill } from "@/components/beepai-ui";
import { useBeepAI } from "@/lib/beepai-context";
import type { Automation, AutomationStatus } from "@/lib/beepai-data";

type Filter = "all" | AutomationStatus;

export default function AutomationsScreen() {
  const router = useRouter();
  const { automations, toggleAutomation } = useBeepAI();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const items = useMemo(
    () => automations.filter((item) => (filter === "all" || item.status === filter) && item.name.toLowerCase().includes(query.toLowerCase())),
    [automations, filter, query],
  );
  const hasAnyAutomations = automations.length > 0;

  return (
    <AppScreen>
      <View style={styles.stickyHeader}>
        <BrandMark />
        <TouchableOpacity onPress={() => router.push("/create" as never)} style={styles.addButton}>
          <MaterialIcons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <AutomationRow item={item} onOpen={() => router.push(`/automation/${item.id}`)} onToggle={() => toggleAutomation(item.id)} />}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <Text style={styles.title}>Automations</Text>
            {hasAnyAutomations && (
              <>
                <View style={styles.search}>
                  <MaterialIcons name="search" size={20} color="#98A2B3" />
                  <TextInput value={query} onChangeText={setQuery} placeholder="Search automations" placeholderTextColor="#98A2B3" style={styles.searchInput} returnKeyType="done" />
                </View>
                <View style={styles.filters}>
                  <FilterChip label="All" active={filter === "all"} onPress={() => setFilter("all")} />
                  <FilterChip label="Active" active={filter === "active"} onPress={() => setFilter("active")} />
                  <FilterChip label="Paused" active={filter === "paused"} onPress={() => setFilter("paused")} />
                  <FilterChip label="Stopped" active={filter === "stopped"} onPress={() => setFilter("stopped")} />
                </View>
              </>
            )}
          </>
        }
        ListEmptyComponent={
          hasAnyAutomations ? (
            <Card style={styles.empty}>
              <MaterialIcons name="search-off" size={28} color={palette.primary} />
              <Text style={styles.emptyTitle}>No automation found</Text>
              <Text style={styles.emptyText}>Try a different search or filter.</Text>
            </Card>
          ) : (
            <Card style={styles.empty}>
              <MaterialIcons name="auto-awesome" size={28} color={palette.primary} />
              <Text style={styles.emptyTitle}>No automations yet</Text>
              <Text style={styles.emptyText}>Request one and your BeepAI admin will build it for you.</Text>
              <TouchableOpacity onPress={() => router.push("/create" as never)} style={styles.emptyButton}>
                <Text style={styles.emptyButtonText}>Request an automation</Text>
              </TouchableOpacity>
            </Card>
          )
        }
      />
    </AppScreen>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={[styles.filterChip, active && styles.filterChipActive]}>
      <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function AutomationRow({ item, onOpen, onToggle }: { item: Automation; onOpen: () => void; onToggle: () => void }) {
  const icon = item.category === "Files" ? "folder" : item.category === "Messages" ? "chat" : item.category === "Excel" ? "table-chart" : "description";
  const statusLabel = item.status === "active" ? "Active" : item.status === "paused" ? "Paused" : "Stopped";
  return (
    <Card style={styles.automationCard}>
      <TouchableOpacity activeOpacity={0.75} onPress={onOpen} style={styles.automationTop}>
        <View style={[styles.categoryIcon, { backgroundColor: palette.primaryLight }]}>
          <MaterialIcons name={icon} size={21} color={palette.primary} />
        </View>
        <View style={styles.automationCopy}>
          <Text numberOfLines={1} style={styles.automationName}>{item.name}</Text>
          {item.source === "delivered" ? (
            <View style={styles.deliveredRow}><StatusPill label="Delivered package" tone="blue" /></View>
          ) : (
            <Text style={styles.automationDescription} numberOfLines={1}>{statusLabel}</Text>
          )}
        </View>
        <Switch
          value={item.status === "active"}
          onValueChange={onToggle}
          disabled={item.status === "stopped"}
          trackColor={{ true: palette.primary, false: "#E4E7EE" }}
          thumbColor="#FFFFFF"
        />
      </TouchableOpacity>
    </Card>
  );
}

const styles = StyleSheet.create({
  stickyHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14, backgroundColor: palette.canvas, zIndex: 10 },
  content: { paddingHorizontal: 20, paddingBottom: 28 },
  addButton: { height: 39, width: 39, alignItems: "center", justifyContent: "center", borderRadius: 13, backgroundColor: palette.primary },
  title: { color: palette.ink, fontSize: 28, lineHeight: 34, fontWeight: "900", letterSpacing: -1, marginBottom: 16, marginTop: 8 },
  search: { height: 48, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: palette.line, paddingHorizontal: 13, borderRadius: 15, flexDirection: "row", alignItems: "center", gap: 8 },
  searchInput: { flex: 1, color: palette.ink, fontSize: 14, height: 48 },
  filters: { flexDirection: "row", gap: 8, marginTop: 13, marginBottom: 20 },
  filterChip: { borderRadius: 12, paddingHorizontal: 14, height: 34, justifyContent: "center", backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: palette.line },
  filterChipActive: { backgroundColor: palette.primary, borderColor: palette.primary },
  filterText: { fontSize: 12, fontWeight: "800", color: palette.muted },
  filterTextActive: { color: "#FFFFFF" },
  automationCard: { padding: 14, marginBottom: 11 },
  automationTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  categoryIcon: { height: 42, width: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  automationCopy: { flex: 1 },
  automationName: { color: palette.ink, fontSize: 15, fontWeight: "900", letterSpacing: -0.2 },
  automationDescription: { color: palette.muted, fontSize: 12, marginTop: 3 },
  deliveredRow: { marginTop: 4 },
  empty: { alignItems: "center", gap: 8, padding: 25, marginTop: 8 },
  emptyTitle: { color: palette.ink, fontSize: 16, fontWeight: "900", marginTop: 4 },
  emptyText: { color: palette.muted, fontSize: 13, textAlign: "center", lineHeight: 19, marginBottom: 4 },
  emptyButton: { backgroundColor: palette.primary, paddingHorizontal: 16, paddingVertical: 11, borderRadius: 12, marginTop: 8 },
  emptyButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
});
