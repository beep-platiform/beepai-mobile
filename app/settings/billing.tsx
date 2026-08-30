import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppScreen, Card, PageHeader, palette } from "@/components/beepai-ui";
import { getPlan, useBeepAI } from "@/lib/beepai-context";

export default function BillingScreen() {
  const router = useRouter();
  const { currentPlanId } = useBeepAI();
  const plan = getPlan(currentPlanId);

  return (
    <AppScreen edges={["top", "bottom", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PageHeader title="Billing" subtitle="Your plan and how payment works" back />

        <Card style={styles.planCard}>
          <View style={styles.planTopRow}>
            <View>
              <Text style={styles.planLabel}>Current plan</Text>
              <Text style={styles.planName}>{plan.name}</Text>
            </View>
            <Text style={styles.planPrice}>{plan.price}<Text style={styles.planPriceUnit}>/mo</Text></Text>
          </View>
          <Text style={styles.planSummary}>{plan.summary}</Text>
          <TouchableOpacity onPress={() => router.push("/plans" as never)} style={styles.changeButton}>
            <Text style={styles.changeButtonText}>Compare plans</Text>
          </TouchableOpacity>
        </Card>

        <Text style={styles.sectionLabel}>How billing works</Text>
        <Card style={styles.infoCard}>
          <InfoRow icon="phone-android" text="Subscriptions and one-time automation build fees are arranged directly with your BeepAI admin, typically by mobile money." />
          <InfoRow icon="receipt-long" text="There's no in-app payment yet — this keeps costs low for the first customers in Rwanda while BeepAI grows." />
          <InfoRow icon="visibility-off" text="No card or payment details are ever stored in this app." isLast />
        </Card>
      </ScrollView>
    </AppScreen>
  );
}

function InfoRow({ icon, text, isLast }: { icon: keyof typeof MaterialIcons.glyphMap; text: string; isLast?: boolean }) {
  return (
    <View style={[styles.infoRow, isLast && styles.infoRowLast]}>
      <MaterialIcons name={icon} size={17} color={palette.primary} style={styles.infoIcon} />
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40 },
  planCard: { padding: 16, marginTop: 6, marginBottom: 22 },
  planTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  planLabel: { color: palette.muted, fontSize: 11, fontWeight: "700", marginBottom: 3 },
  planName: { color: palette.ink, fontSize: 20, fontWeight: "900" },
  planPrice: { color: palette.primary, fontSize: 18, fontWeight: "900" },
  planPriceUnit: { color: palette.muted, fontSize: 11, fontWeight: "700" },
  planSummary: { color: palette.muted, fontSize: 12, lineHeight: 17, marginTop: 10 },
  changeButton: { marginTop: 14, backgroundColor: palette.primaryLight, borderRadius: 12, paddingVertical: 11, alignItems: "center" },
  changeButtonText: { color: palette.primary, fontSize: 13, fontWeight: "800" },
  sectionLabel: { color: palette.ink, fontSize: 13, fontWeight: "900", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.4 },
  infoCard: { padding: 4 },
  infoRow: { flexDirection: "row", gap: 10, padding: 13, borderBottomWidth: 1, borderBottomColor: palette.line },
  infoRowLast: { borderBottomWidth: 0 },
  infoIcon: { marginTop: 1 },
  infoText: { flex: 1, color: palette.muted, fontSize: 12, lineHeight: 17 },
});
