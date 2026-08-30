import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppScreen, Card, PageHeader, palette } from "@/components/beepai-ui";

const faqs = [
  { q: "How do I get a new automation built?", a: "Go to Tasks or Automations and tap the add button to describe your task. Your BeepAI admin reviews it and builds it for you." },
  { q: "How do I receive my finished automation?", a: "Once it's built, your admin calls or messages you with a package code. Enter it from the Dashboard's \"Redeem package\" banner or Automations tab." },
  { q: "What if I lose my package code?", a: "Contact your BeepAI admin directly — they can look up your delivered package and share the code again." },
  { q: "Does BeepAI see my files?", a: "No. Automations process Excel, Word, and PDF files locally on your device. See Security & Privacy for details." },
];

export default function HelpScreen() {
  const router = useRouter();
  return (
    <AppScreen edges={["top", "bottom", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PageHeader title="Help & Support" subtitle="Get in touch or find a quick answer" back />

        <Card style={styles.contactCard}>
          <TouchableOpacity style={styles.contactRow} onPress={() => Linking.openURL("mailto:hello@beepai.rw")}>
            <View style={styles.iconWrap}><MaterialIcons name="mail-outline" size={18} color={palette.primary} /></View>
            <View style={styles.copy}><Text style={styles.contactTitle}>Email support</Text><Text style={styles.contactText}>hello@beepai.rw</Text></View>
            <MaterialIcons name="open-in-new" size={16} color={palette.muted} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.contactRow} onPress={() => router.push("/create" as never)}>
            <View style={styles.iconWrap}><MaterialIcons name="auto-awesome" size={18} color={palette.primary} /></View>
            <View style={styles.copy}><Text style={styles.contactTitle}>Request an automation</Text><Text style={styles.contactText}>Describe a task you'd like BeepAI to handle</Text></View>
            <MaterialIcons name="arrow-forward" size={16} color={palette.muted} />
          </TouchableOpacity>
        </Card>

        <Text style={styles.sectionLabel}>Frequently asked</Text>
        {faqs.map((item) => (
          <Card key={item.q} style={styles.faqCard}>
            <Text style={styles.faqQuestion}>{item.q}</Text>
            <Text style={styles.faqAnswer}>{item.a}</Text>
          </Card>
        ))}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40 },
  contactCard: { padding: 4, marginTop: 6, marginBottom: 22 },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 13 },
  iconWrap: { width: 36, height: 36, borderRadius: 12, backgroundColor: palette.primaryLight, alignItems: "center", justifyContent: "center" },
  copy: { flex: 1 },
  contactTitle: { color: palette.ink, fontSize: 13, fontWeight: "900" },
  contactText: { color: palette.muted, fontSize: 11, marginTop: 2 },
  divider: { height: 1, backgroundColor: palette.line, marginHorizontal: 13 },
  sectionLabel: { color: palette.ink, fontSize: 13, fontWeight: "900", marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.4 },
  faqCard: { padding: 14, marginBottom: 10 },
  faqQuestion: { color: palette.ink, fontSize: 13, fontWeight: "900", marginBottom: 5 },
  faqAnswer: { color: palette.muted, fontSize: 12, lineHeight: 17 },
});
