import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { AppScreen, Card, PageHeader, palette } from "@/components/beepai-ui";

const points: { icon: keyof typeof MaterialIcons.glyphMap; title: string; text: string }[] = [
  { icon: "smartphone", title: "Your files stay on your device", text: "When you run an automation, its supported working file is processed locally. BeepAI's servers never receive the working file or report. Available file types depend on the automation and app version." },
  { icon: "vpn-key", title: "Package codes, not passwords", text: "A delivered automation is retrieved with a one-time code generated specifically for you — it can't be guessed or reused for anyone else's package." },
  { icon: "lock", title: "Row-level access control", text: "The BeepAI backend enforces per-record permissions in the database itself, not just in the app — so even a direct API request can't read another customer's data." },
  { icon: "visibility-off", title: "Minimum data collection", text: "Only your name, contact details, and automation description are stored — no documents, no browsing history, no device tracking." },
  { icon: "delete-outline", title: "You control local data", text: "Settings → Log Out clears everything BeepAI has stored on this device. Redeemed packages can always be restored with their code." },
];

export default function SecurityScreen() {
  return (
    <AppScreen edges={["top", "bottom", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PageHeader title="Security & privacy" subtitle="How BeepAI actually protects your data" back />
        {points.map((point) => (
          <Card key={point.title} style={styles.card}>
            <View style={styles.iconWrap}><MaterialIcons name={point.icon} size={19} color={palette.primary} /></View>
            <View style={styles.copy}>
              <Text style={styles.title}>{point.title}</Text>
              <Text style={styles.text}>{point.text}</Text>
            </View>
          </Card>
        ))}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40 },
  card: { flexDirection: "row", gap: 12, padding: 14, marginBottom: 10 },
  iconWrap: { width: 38, height: 38, borderRadius: 12, backgroundColor: palette.primaryLight, alignItems: "center", justifyContent: "center" },
  copy: { flex: 1 },
  title: { color: palette.ink, fontSize: 14, fontWeight: "900", marginBottom: 4 },
  text: { color: palette.muted, fontSize: 12, lineHeight: 17 },
});
