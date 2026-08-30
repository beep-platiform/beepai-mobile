import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from "react-native";
import { AppScreen, Card, PageHeader, palette, PrimaryButton } from "@/components/beepai-ui";
import { useBeepAI } from "@/lib/beepai-context";
import { redeemPackage } from "@/lib/beepai-supabase";
import { clearPendingRequest } from "@/lib/use-pending-package";

export default function RedeemScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string }>();
  const { addDeliveredAutomation } = useBeepAI();
  const [code, setCode] = useState(params.code ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const redeem = async () => {
    setError(null);
    setLoading(true);
    const result = await redeemPackage(code);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    const pkg = result.package;
    const outcome = addDeliveredAutomation({
      id: pkg.id,
      name: pkg.name,
      description: pkg.description,
      schedule: pkg.schedule,
      redemptionCode: pkg.redemption_code,
      configuration: pkg.configuration,
    });
    await clearPendingRequest();
    router.replace(`/automation/delivered-${pkg.id}`);
    if (outcome === "duplicate") {
      // Already in the workspace — navigation above still takes the user to it.
    }
  };

  return (
    <AppScreen edges={["top", "bottom", "left", "right"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.flex}>
        <PageHeader title="Redeem a package" subtitle="Enter the code your BeepAI admin sent you." back />
        <View style={styles.content}>
          <Card style={styles.iconCard}>
            <View style={styles.iconWrap}><MaterialIcons name="qr-code-2" size={28} color={palette.primary} /></View>
            <Text style={styles.title}>Package code</Text>
            <Text style={styles.subtitle}>This links your device to the automation your admin built for you — no account needed.</Text>
            <TextInput
              value={code}
              onChangeText={(value) => setCode(value.toUpperCase())}
              placeholder="e.g. 4F82A1B0"
              placeholderTextColor="#98A2B3"
              autoCapitalize="characters"
              style={styles.input}
            />
            {error && <Text style={styles.error}>{error}</Text>}
          </Card>
          <PrimaryButton label={loading ? "Checking..." : "Redeem package"} icon="check" onPress={redeem} style={styles.button} />
        </View>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 20 },
  iconCard: { padding: 20, alignItems: "center", marginBottom: 18 },
  iconWrap: { width: 54, height: 54, borderRadius: 18, backgroundColor: palette.primaryLight, alignItems: "center", justifyContent: "center", marginBottom: 14 },
  title: { color: palette.ink, fontSize: 18, fontWeight: "900", marginBottom: 6 },
  subtitle: { color: palette.muted, fontSize: 13, textAlign: "center", lineHeight: 18, marginBottom: 18 },
  input: { width: "100%", height: 52, borderRadius: 14, borderWidth: 1, borderColor: palette.line, backgroundColor: "#FBFBFD", textAlign: "center", fontSize: 18, fontWeight: "800", letterSpacing: 2, color: palette.ink },
  error: { color: palette.danger, fontSize: 12, fontWeight: "700", marginTop: 10, textAlign: "center" },
  button: { marginTop: 4 },
});
