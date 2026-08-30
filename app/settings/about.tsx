import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AppScreen, Card, PageHeader, palette } from "@/components/beepai-ui";

export default function AboutScreen() {
  return (
    <AppScreen edges={["top", "bottom", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <PageHeader title="About BeepAI" back />

        <View style={styles.mark}><Text style={styles.markLetter}>B</Text></View>
        <Text style={styles.name}>BeepAI</Text>
        <Text style={styles.tagline}>Your work. Automated. Privately.</Text>

        <Card style={styles.card}>
          <Text style={styles.text}>
            BeepAI turns repetitive tasks — Excel calculations, report generation, message templates — into reusable
            automations built by your BeepAI admin and run privately on your own device. Built for Rwanda, starting
            with businesses and professionals who need dependable, private automation without a full IT team.
          </Text>
        </Card>

        <TouchableOpacity onPress={() => Linking.openURL("https://beepai.rw")} style={styles.linkRow}>
          <Text style={styles.linkText}>beepai.rw</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, paddingBottom: 40, alignItems: "center" },
  mark: { width: 56, height: 56, borderRadius: 18, backgroundColor: palette.primary, alignItems: "center", justifyContent: "center", marginTop: 12, marginBottom: 12 },
  markLetter: { color: "#FFFFFF", fontSize: 26, fontWeight: "900" },
  name: { color: palette.ink, fontSize: 20, fontWeight: "900" },
  tagline: { color: palette.muted, fontSize: 13, marginTop: 3, marginBottom: 20 },
  card: { padding: 16, width: "100%" },
  text: { color: palette.muted, fontSize: 13, lineHeight: 19, textAlign: "center" },
  linkRow: { marginTop: 16 },
  linkText: { color: palette.primary, fontSize: 14, fontWeight: "800" },
  version: { color: "#98A2B3", fontSize: 11, marginTop: 24 },
});
