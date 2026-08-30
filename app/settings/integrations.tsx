import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { AppScreen, Card, PageHeader, palette } from "@/components/beepai-ui";

type Integration = { name: string; description: string; icon: keyof typeof MaterialIcons.glyphMap; status: "available" | "comingSoon"; requiresInternet: boolean };

const integrations: Integration[] = [
  { name: "Excel", description: "Read, calculate, and write spreadsheets entirely on your device.", icon: "table-chart", status: "available", requiresInternet: false },
  { name: "Files & folders", description: "Rename, sort, and move local files as part of an automation.", icon: "folder", status: "available", requiresInternet: false },
  { name: "Word documents", description: "Generate and fill Word documents from a template.", icon: "description", status: "available", requiresInternet: false },
  { name: "PDF", description: "Extract data from PDFs or generate new ones locally.", icon: "picture-as-pdf", status: "available", requiresInternet: false },
  { name: "Email", description: "Prepare an approved email draft for you to review and send.", icon: "mail", status: "available", requiresInternet: true },
  { name: "WhatsApp Business", description: "Send approved template messages through the official WhatsApp Business API.", icon: "chat", status: "comingSoon", requiresInternet: true },
  { name: "Browser automation", description: "Automate a website your automation is explicitly built for.", icon: "language", status: "comingSoon", requiresInternet: true },
];

export default function IntegrationsScreen() {
  return (
    <AppScreen edges={["top", "bottom", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PageHeader title="Integrations" subtitle="What BeepAI can connect to today" back />
        <Text style={styles.intro}>
          Every automation only uses the specific integrations it needs — nothing is turned on unless your automation
          actually requires it.
        </Text>
        {integrations.map((item) => (
          <Card key={item.name} style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: item.status === "available" ? palette.primaryLight : "#F2F4F7" }]}>
              <MaterialIcons name={item.icon} size={20} color={item.status === "available" ? palette.primary : palette.muted} />
            </View>
            <View style={styles.copy}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{item.name}</Text>
                {item.requiresInternet && <MaterialIcons name="wifi" size={13} color={palette.muted} />}
              </View>
              <Text style={styles.description}>{item.description}</Text>
            </View>
            <View style={[styles.badge, item.status === "available" ? styles.badgeAvailable : styles.badgeSoon]}>
              <Text style={[styles.badgeText, item.status === "available" ? styles.badgeTextAvailable : styles.badgeTextSoon]}>
                {item.status === "available" ? "Available" : "Coming soon"}
              </Text>
            </View>
          </Card>
        ))}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40 },
  intro: { color: palette.muted, fontSize: 13, lineHeight: 19, marginBottom: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 13, marginBottom: 10 },
  iconWrap: { width: 40, height: 40, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  copy: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  name: { color: palette.ink, fontSize: 14, fontWeight: "900" },
  description: { color: palette.muted, fontSize: 11, lineHeight: 15, marginTop: 3 },
  badge: { borderRadius: 8, paddingHorizontal: 9, paddingVertical: 5 },
  badgeAvailable: { backgroundColor: "#EAF9EE" },
  badgeSoon: { backgroundColor: "#F2F4F7" },
  badgeText: { fontSize: 10, fontWeight: "800" },
  badgeTextAvailable: { color: palette.mint },
  badgeTextSoon: { color: palette.muted },
});
