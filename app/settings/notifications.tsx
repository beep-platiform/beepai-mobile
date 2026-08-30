import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Notifications from "expo-notifications";
import { useEffect, useState } from "react";
import { Linking, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { AppScreen, Card, PageHeader, palette } from "@/components/beepai-ui";
import { requestNotificationPermission } from "@/lib/use-pending-package";

export default function NotificationsScreen() {
  const [status, setStatus] = useState<Notifications.PermissionStatus | null>(null);

  const refreshStatus = async () => {
    const current = await Notifications.getPermissionsAsync();
    setStatus(current.status);
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  const handleToggle = async (value: boolean) => {
    if (!value) {
      Linking.openSettings();
      return;
    }
    await requestNotificationPermission();
    await refreshStatus();
  };

  const granted = status === Notifications.PermissionStatus.GRANTED;

  return (
    <AppScreen edges={["top", "bottom", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PageHeader title="Notifications" subtitle="Only for things that need your attention" back />

        <Card style={styles.row}>
          <View style={styles.iconWrap}><MaterialIcons name="mark-email-unread" size={19} color={palette.primary} /></View>
          <View style={styles.copy}>
            <Text style={styles.rowTitle}>Package ready alerts</Text>
            <Text style={styles.rowText}>Get notified the moment your BeepAI admin delivers an automation you requested.</Text>
          </View>
          <Switch value={granted} onValueChange={handleToggle} trackColor={{ true: palette.primary, false: "#E4E7EE" }} thumbColor="#FFFFFF" />
        </Card>

        <View style={styles.statusRow}>
          <MaterialIcons name={granted ? "check-circle" : "info"} size={15} color={granted ? palette.mint : palette.muted} />
          <Text style={styles.statusText}>
            {status === null ? "Checking permission..." : granted ? "Notifications are enabled for BeepAI." : "Notifications are off. Turn them on to hear about ready packages and run results without opening the app."}
          </Text>
        </View>

        {!granted && status !== null && (
          <TouchableOpacity onPress={() => Linking.openSettings()} style={styles.settingsButton}>
            <Text style={styles.settingsButtonText}>Open device settings</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.footnote}>
          BeepAI never sends marketing notifications — only alerts tied to something you did (a request, a run, a delivered package).
        </Text>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, marginTop: 6 },
  iconWrap: { width: 38, height: 38, borderRadius: 12, backgroundColor: palette.primaryLight, alignItems: "center", justifyContent: "center" },
  copy: { flex: 1 },
  rowTitle: { color: palette.ink, fontSize: 14, fontWeight: "900" },
  rowText: { color: palette.muted, fontSize: 11, lineHeight: 15, marginTop: 3 },
  statusRow: { flexDirection: "row", gap: 7, alignItems: "flex-start", marginTop: 14 },
  statusText: { flex: 1, color: palette.muted, fontSize: 12, lineHeight: 17 },
  settingsButton: { marginTop: 14, backgroundColor: palette.ink, borderRadius: 12, paddingVertical: 12, alignItems: "center" },
  settingsButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  footnote: { color: palette.muted, fontSize: 11, lineHeight: 16, marginTop: 24, textAlign: "center" },
});
