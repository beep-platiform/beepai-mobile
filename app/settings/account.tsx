import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { AppScreen, Card, PageHeader, palette } from "@/components/beepai-ui";
import { getPlan, useBeepAI } from "@/lib/beepai-context";

export default function AccountScreen() {
  const { automations, currentPlanId } = useBeepAI();
  const plan = getPlan(currentPlanId);
  const delivered = automations.filter((item) => item.source === "delivered").length;

  return (
    <AppScreen edges={["top", "bottom", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PageHeader title="Account" subtitle="How your identity works in BeepAI" back />

        <Card style={styles.card}>
          <View style={styles.iconWrap}><MaterialIcons name="verified-user" size={20} color={palette.primary} /></View>
          <Text style={styles.cardTitle}>No account required</Text>
          <Text style={styles.cardText}>
            BeepAI doesn't use logins or passwords for customers. When you request an automation, your admin identifies
            you by the name and phone number you provide. When your automation is ready, they send you a one-time
            package code — entering that code in this app is what links the automation to your device.
          </Text>
        </Card>

        <Text style={styles.sectionLabel}>This device</Text>
        <Card style={styles.statsCard}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Current plan</Text>
            <Text style={styles.statValue}>{plan.name}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Delivered packages redeemed</Text>
            <Text style={styles.statValue}>{delivered}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total automations on this device</Text>
            <Text style={styles.statValue}>{automations.length}</Text>
          </View>
        </Card>

        <Text style={styles.footnote}>
          Because there's no account, your workspace lives only on this device. Reinstalling the app or using
          "Log Out" in Settings clears it — redeemed packages can always be pulled back down again with their code.
        </Text>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40 },
  card: { padding: 16, marginTop: 6, marginBottom: 22 },
  iconWrap: { width: 38, height: 38, borderRadius: 12, backgroundColor: palette.primaryLight, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  cardTitle: { color: palette.ink, fontSize: 15, fontWeight: "900", marginBottom: 6 },
  cardText: { color: palette.muted, fontSize: 13, lineHeight: 19 },
  sectionLabel: { color: palette.ink, fontSize: 13, fontWeight: "900", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.4 },
  statsCard: { padding: 4 },
  statRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 12, paddingVertical: 13 },
  statLabel: { color: palette.muted, fontSize: 13, fontWeight: "600" },
  statValue: { color: palette.ink, fontSize: 13, fontWeight: "900" },
  divider: { height: 1, backgroundColor: palette.line, marginHorizontal: 12 },
  footnote: { color: palette.muted, fontSize: 11, lineHeight: 16, marginTop: 16, textAlign: "center" },
});
