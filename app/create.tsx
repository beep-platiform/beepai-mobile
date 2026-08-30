import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Alert, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { AppScreen, Card, PageHeader, palette, PrimaryButton } from "@/components/beepai-ui";
import { useBeepAI } from "@/lib/beepai-context";
import { submitAutomationRequest } from "@/lib/beepai-supabase";
import { rememberPendingRequest } from "@/lib/use-pending-package";

type ToolOption = { name: string; icon: keyof typeof MaterialIcons.glyphMap; color: string };
const tools: ToolOption[] = [
  { name: "Excel", icon: "table-chart", color: "#16A34A" },
  { name: "PDF", icon: "picture-as-pdf", color: "#DC2626" },
  { name: "Word", icon: "description", color: "#2563EB" },
  { name: "Messages", icon: "chat", color: "#16A34A" },
  { name: "Files", icon: "folder", color: "#D97706" },
];

export default function CreateAutomationScreen() {
  const router = useRouter();
  const { createAutomation } = useBeepAI();
  const [description, setDescription] = useState("");
  const [selectedTools, setSelectedTools] = useState<string[]>(["Excel"]);
  const [frequency, setFrequency] = useState("Weekly");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const toggleTool = (name: string) =>
    setSelectedTools((items) => (items.includes(name) ? items.filter((item) => item !== name) : [...items, name]));

  const create = async () => {
    if (!description.trim()) {
      Alert.alert("Add a description", "Tell BeepAI what you'd like automated before submitting.");
      return;
    }
    if (!contactName.trim() || !contactPhone.trim()) {
      Alert.alert("Add your contact details", "BeepAI's team needs a name and phone number to reach you once your automation is built.");
      return;
    }
    setSubmitting(true);
    const id = createAutomation({ description, tools: selectedTools, frequency });
    const result = await submitAutomationRequest({
      description,
      involvedTools: selectedTools,
      frequency,
      contactName: contactName.trim(),
      contactPhone: contactPhone.trim(),
    });
    setSubmitting(false);
    if (result.ok) {
      await rememberPendingRequest(contactPhone.trim());
    }
    if (!result.ok) {
      Alert.alert(
        "Saved on this device only",
        `BeepAI couldn't reach the server (${result.error}). Your request is saved locally — try again once you're back online so your admin can see it.`,
      );
    }
    router.replace(`/automation/${id}`);
  };

  return (
    <AppScreen edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <FlatList
          data={tools}
          keyExtractor={(item) => item.name}
          numColumns={3}
          renderItem={({ item }) => <ToolCard tool={item} selected={selectedTools.includes(item.name)} onPress={() => toggleTool(item.name)} />}
          contentContainerStyle={styles.content}
          columnWrapperStyle={styles.toolRow}
          ListHeaderComponent={
            <>
              <PageHeader
                title="Create automation"
                subtitle="Describe the task. BeepAI structures the workflow."
                back
                right={<View style={styles.aiChip}><MaterialIcons name="auto-awesome" color={palette.primary} size={14} /><Text style={styles.aiText}>AI assisted</Text></View>}
              />
              <Card style={styles.promptCard}>
                <View style={styles.promptIcon}><MaterialIcons name="auto-awesome" color={palette.primary} size={20} /></View>
                <Text style={styles.promptTitle}>What would you like to automate?</Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  textAlignVertical="top"
                  placeholder="For example: Every Friday, total my sales spreadsheet, create a PDF report, and prepare an email."
                  placeholderTextColor="#98A2B3"
                  style={styles.promptInput}
                />
              </Card>
              <Text style={styles.helper}>Be specific about the files, calculation, and result you need. Your request is reviewed before it runs.</Text>
              <Text style={styles.label}>What is involved?</Text>
            </>
          }
          ListFooterComponent={
            <>
              <Text style={[styles.label, styles.frequencyLabel]}>How often does it happen?</Text>
              <View style={styles.frequencyRow}>
                <Frequency label="On demand" active={frequency === "On demand"} onPress={() => setFrequency("On demand")} />
                <Frequency label="Daily" active={frequency === "Daily"} onPress={() => setFrequency("Daily")} />
                <Frequency label="Weekly" active={frequency === "Weekly"} onPress={() => setFrequency("Weekly")} />
              </View>

              <Text style={styles.label}>How can BeepAI reach you?</Text>
              <Card style={styles.contactCard}>
                <TextInput value={contactName} onChangeText={setContactName} placeholder="Your name" placeholderTextColor="#98A2B3" style={styles.contactInput} />
                <View style={styles.contactDivider} />
                <TextInput value={contactPhone} onChangeText={setContactPhone} placeholder="Phone number" placeholderTextColor="#98A2B3" keyboardType="phone-pad" style={styles.contactInput} />
              </Card>
              <Text style={styles.helper}>Your BeepAI admin will build this automation and send you a package code by phone once it's ready.</Text>

              <Card style={styles.privacyNote}>
                <MaterialIcons name="shield" color={palette.mint} size={20} />
                <View style={styles.privacyCopy}>
                  <Text style={styles.privacyTitle}>Private by design</Text>
                  <Text style={styles.privacyText}>Your work files stay on your device. BeepAI asks before any external connection is used.</Text>
                </View>
              </Card>
              <PrimaryButton label={submitting ? "Sending..." : "Send request"} icon="arrow-forward" onPress={create} style={styles.createButton} />
            </>
          }
        />
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

function ToolCard({ tool, selected, onPress }: { tool: ToolOption; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.77} style={[styles.toolCard, selected && styles.toolCardActive]}>
      <View style={[styles.toolIcon, { backgroundColor: `${tool.color}15` }]}><MaterialIcons name={tool.icon} size={21} color={tool.color} /></View>
      <Text style={[styles.toolName, selected && styles.toolNameActive]}>{tool.name}</Text>
      {selected && <View style={styles.toolCheck}><MaterialIcons name="check" size={11} color="#FFFFFF" /></View>}
    </TouchableOpacity>
  );
}

function Frequency({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={[styles.frequency, active && styles.frequencyActive]}>
      <Text style={[styles.frequencyText, active && styles.frequencyTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 20, paddingTop: 9, paddingBottom: 24 },
  aiChip: { flexDirection: "row", gap: 4, alignItems: "center", backgroundColor: palette.primaryLight, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 99 },
  aiText: { color: palette.primary, fontSize: 10, fontWeight: "900" },
  promptCard: { padding: 15, marginTop: 5 },
  promptIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: palette.primaryLight, alignItems: "center", justifyContent: "center", marginBottom: 11 },
  promptTitle: { color: palette.ink, fontSize: 15, fontWeight: "900", marginBottom: 9 },
  promptInput: { minHeight: 126, fontSize: 14, lineHeight: 20, color: palette.ink, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: palette.line, backgroundColor: "#FBFBFD" },
  helper: { color: palette.muted, fontSize: 11, lineHeight: 16, marginTop: 9, marginBottom: 20 },
  label: { color: palette.ink, fontSize: 15, fontWeight: "900", marginBottom: 11 },
  toolRow: { gap: 9, marginBottom: 9 },
  toolCard: { flex: 1, minHeight: 93, borderRadius: 16, borderWidth: 1, borderColor: palette.line, backgroundColor: "#FFFFFF", padding: 10, position: "relative" },
  toolCardActive: { borderColor: palette.primary, borderWidth: 1.5, backgroundColor: "#FFFAF7" },
  toolIcon: { height: 32, width: 32, borderRadius: 10, alignItems: "center", justifyContent: "center", marginBottom: 7 },
  toolName: { color: palette.muted, fontSize: 12, fontWeight: "800" },
  toolNameActive: { color: palette.primary },
  toolCheck: { position: "absolute", top: 8, right: 8, width: 17, height: 17, borderRadius: 9, backgroundColor: palette.primary, alignItems: "center", justifyContent: "center" },
  frequencyLabel: { marginTop: 17 },
  frequencyRow: { flexDirection: "row", gap: 8, marginBottom: 22 },
  frequency: { flex: 1, minHeight: 39, borderRadius: 12, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: palette.line },
  frequencyActive: { backgroundColor: palette.primary, borderColor: palette.primary },
  frequencyText: { color: palette.muted, fontSize: 11, fontWeight: "800" },
  frequencyTextActive: { color: "#FFFFFF" },
  contactCard: { padding: 4, marginBottom: 9 },
  contactInput: { height: 46, paddingHorizontal: 14, fontSize: 14, color: palette.ink },
  contactDivider: { height: 1, backgroundColor: palette.line, marginHorizontal: 10 },
  privacyNote: { padding: 13, flexDirection: "row", gap: 10, marginBottom: 16, backgroundColor: "#FAFFFB", borderColor: "#DFF2E3" },
  privacyCopy: { flex: 1 },
  privacyTitle: { color: palette.ink, fontSize: 13, fontWeight: "900" },
  privacyText: { color: palette.muted, fontSize: 11, lineHeight: 16, marginTop: 3 },
  createButton: { marginBottom: 4 },
});
