import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BeepAIProvider } from "@/lib/beepai-context";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
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
          <Stack.Screen name="run/[id]" />
        </Stack>
      </BeepAIProvider>
    </SafeAreaProvider>
  );
}
