import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { checkPendingDelivery, type PendingPackage } from "@/lib/beepai-supabase";

const PENDING_PHONE_KEY = "@beepai-pending-phone";
const NOTIFIED_CODES_KEY = "@beepai-notified-codes";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/** Call this right after a request is submitted, so the app knows which phone to watch. */
export async function rememberPendingRequest(phone: string) {
  if (!phone.trim()) return;
  await AsyncStorage.setItem(PENDING_PHONE_KEY, phone.trim());
}

export async function requestNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const result = await Notifications.requestPermissionsAsync();
  return result.granted;
}

async function notifyPackageReady(pkg: PendingPackage) {
  const raw = await AsyncStorage.getItem(NOTIFIED_CODES_KEY);
  const notified: string[] = raw ? JSON.parse(raw) : [];
  if (notified.includes(pkg.redemptionCode)) return;

  const granted = await requestNotificationPermission();
  if (granted) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Your BeepAI package is ready",
        body: `"${pkg.name}" has been built and is waiting for you to redeem.`,
      },
      trigger: null,
    });
  }
  await AsyncStorage.setItem(NOTIFIED_CODES_KEY, JSON.stringify([...notified, pkg.redemptionCode]));
}

/**
 * Watches for a package becoming available for this device's pending
 * request. The banner/badge this powers only ever appears once a real
 * delivered package is found — never speculatively.
 */
export function usePendingPackageCheck() {
  const [pendingPackage, setPendingPackage] = useState<PendingPackage | null>(null);
  const checking = useRef(false);

  const check = async () => {
    if (checking.current) return;
    checking.current = true;
    try {
      const phone = await AsyncStorage.getItem(PENDING_PHONE_KEY);
      if (!phone) return;
      const pkg = await checkPendingDelivery(phone);
      if (pkg) {
        setPendingPackage(pkg);
        await notifyPackageReady(pkg);
      }
    } finally {
      checking.current = false;
    }
  };

  useEffect(() => {
    check();
    const onAppStateChange = (state: AppStateStatus) => {
      if (state === "active") check();
    };
    const subscription = AppState.addEventListener("change", onAppStateChange);
    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { pendingPackage, recheck: check };
}

/** Call once the package has actually been redeemed, so it stops being flagged as pending. */
export async function clearPendingRequest() {
  await AsyncStorage.removeItem(PENDING_PHONE_KEY);
}
