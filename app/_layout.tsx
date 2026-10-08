import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BeepAIProvider } from "@/lib/beepai-context";
import { JavaScriptRuntimeProvider } from "@/lib/javascript-runtime";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <JavaScriptRuntimeProvider>
      <BeepAIProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="create" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
          <Stack.Screen name="automation/[id]" />
          <Stack.Screen name="workflow/[id]" />
          <Stack.Screen name="permissions/[id]" />
          <Stack.Screen name="plans" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
          <Stack.Screen name="redeem" options={{ presentation: "modal", animation: "slide_from_bottom" }} />
          <Stack.Screen name="settings/account" />
          <Stack.Screen name="settings/integrations" />
          <Stack.Screen name="settings/notifications" />
          <Stack.Screen name="settings/billing" />
          <Stack.Screen name="settings/security" />
          <Stack.Screen name="settings/help" />
          <Stack.Screen name="settings/about" />
          <Stack.Screen name="run/[id]" />
        </Stack>
      </BeepAIProvider>
      </JavaScriptRuntimeProvider>
    </SafeAreaProvider>
  );
}
