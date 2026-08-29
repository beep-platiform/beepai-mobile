import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppScreen, BrandMark, Card, Chevron, palette } from "@/components/beepai-ui";
import { getPlan, useBeepAI } from "@/lib/beepai-context";

type SettingsItem = { icon: keyof typeof MaterialIcons.glyphMap; label: string; onPress?: () => void };

export default function SettingsScreen() {
  const router = useRouter();
  const { currentPlanId, resetWorkspace } = useBeepAI();
  const plan = getPlan(currentPlanId);

  const accountGroup: SettingsItem[] = [
    { icon: "person-outline", label: "Account" },
    { icon: "workspace-premium", label: "Subscription", onPress: () => router.push("/plans" as never) },
    { icon: "extension", label: "Integrations" },
    { icon: "notifications-none", label: "Notifications" },
    { icon: "receipt-long", label: "Billing" },
    { icon: "shield", label: "Security & privacy" },
  ];
  const supportGroup: SettingsItem[] = [
    { icon: "help-outline", label: "Help & Support" },
    { icon: "info-outline", label: "About BeepAI" },
  ];

  const handleLogOut = () => {
    Alert.alert("Reset local workspace", "This clears demo data stored on this device. Delivered packages you've redeemed will need to be re-entered with their code.", [
      { text: "Cancel", style: "cancel" },
      { text: "Reset", style: "destructive", onPress: resetWorkspace },
    ]);
  };

  return (
    <AppScreen>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}><BrandMark /></View>
        <Text style={styles.title}>Settings</Text>

        <TouchableOpacity activeOpacity={0.76} style={styles.profileRow}>
          <View style={styles.avatar}><Text style={styles.avatarText}>B</Text></View>
          <View style={styles.profileCopy}>
            <Text style={styles.profileName}>Emerson</Text>
            <Text style={styles.profileEmail}>{plan.name} workspace · on this device</Text>
          </View>
          <Chevron />
        </TouchableOpacity>

        <SettingsGroup items={accountGroup} />
        <SettingsGroup items={supportGroup} style={{ marginTop: 14 }} />

        <TouchableOpacity onPress={handleLogOut} activeOpacity={0.85} style={styles.logOutButton}>
          <Text style={styles.logOutText}>Log Out</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <View style={styles.footerMark}><Text style={styles.footerLetter}>B</Text></View>
          <Text style={styles.footerTitle}>BeepAI</Text>
          <Text style={styles.footerText}>Your work. Automated. Privately.</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>
      </ScrollView>
    </AppScreen>
  );
}

function SettingsGroup({ items, style }: { items: SettingsItem[]; style?: object }) {
  return (
    <Card style={[styles.group, style]}>
      {items.map((item, index) => (
        <TouchableOpacity key={item.label} activeOpacity={0.7} onPress={item.onPress} style={[styles.row, index === items.length - 1 && styles.rowLast]}>
          <View style={styles.rowIcon}><MaterialIcons name={item.icon} color={palette.primary} size={19} /></View>
          <Text style={styles.rowLabel}>{item.label}</Text>
          <Chevron />
        </TouchableOpacity>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingTop: 12, paddingBottom: 40 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  title: { color: palette.ink, fontSize: 28, lineHeight: 34, fontWeight: "900", letterSpacing: -1, marginBottom: 18 },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#FFFFFF", borderRadius: 18, borderWidth: 1, borderColor: palette.line, padding: 14, marginBottom: 20 },
  avatar: { height: 46, width: 46, borderRadius: 23, backgroundColor: palette.ink, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#FFFFFF", fontWeight: "900", fontSize: 18 },
  profileCopy: { flex: 1 },
  profileName: { color: palette.ink, fontWeight: "900", fontSize: 16 },
  profileEmail: { color: palette.muted, fontSize: 12, marginTop: 3 },
  group: { paddingHorizontal: 4, paddingVertical: 2 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 12, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: palette.line },
  rowLast: { borderBottomWidth: 0 },
  rowIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: palette.primaryLight, alignItems: "center", justifyContent: "center" },
  rowLabel: { flex: 1, color: palette.ink, fontSize: 14, fontWeight: "700" },
  logOutButton: { marginTop: 22, height: 50, borderRadius: 15, borderWidth: 1.5, borderColor: palette.danger, alignItems: "center", justifyContent: "center" },
  logOutText: { color: palette.danger, fontSize: 15, fontWeight: "800" },
  footer: { alignItems: "center", paddingTop: 30, paddingBottom: 6 },
  footerMark: { height: 30, width: 30, borderRadius: 10, backgroundColor: palette.primary, alignItems: "center", justifyContent: "center" },
  footerLetter: { color: "#fff", fontWeight: "900", fontSize: 18 },
  footerTitle: { color: palette.ink, fontSize: 15, fontWeight: "900", marginTop: 8 },
  footerText: { color: palette.muted, fontSize: 12, marginTop: 3 },
  version: { color: "#98A2B3", fontSize: 11, marginTop: 10 },
});
