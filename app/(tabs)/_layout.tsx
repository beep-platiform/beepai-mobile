import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { palette } from "@/components/beepai-ui";

const tabIcons: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  index: "grid-view",
  automations: "bolt",
  activity: "query-stats",
  profile: "person-outline",
};

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 10 : Math.max(insets.bottom, 8);
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: palette.violet,
        tabBarInactiveTintColor: "#8B90A0",
        tabBarStyle: { backgroundColor: "#FFFFFF", borderTopColor: palette.line, borderTopWidth: 1, paddingTop: 8, paddingBottom: bottomPadding, height: 59 + bottomPadding },
        tabBarLabelStyle: { fontSize: 11, fontWeight: "700", marginTop: 3 },
        tabBarIcon: ({ color, focused }) => <MaterialIcons name={tabIcons[route.name]} size={focused ? 23 : 22} color={color} />,
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="automations" options={{ title: "Automations" }} />
      <Tabs.Screen name="activity" options={{ title: "Activity" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
