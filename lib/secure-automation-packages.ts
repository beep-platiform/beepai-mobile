import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import nacl from "tweetnacl";

// expo-secure-store key names may contain only alphanumerics, ".", "-", and "_".
const KEY_NAME = "beepai.automation-package-key-v3";
const PACKAGE_PREFIX = "@beepai/automation-package-v2:";
let webSessionKey: Uint8Array | null = null;

function hex(bytes: Uint8Array): string {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("");
}

function unhex(value: string): Uint8Array {
  const bytes = new Uint8Array(value.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = Number.parseInt(value.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) binary += String.fromCharCode(...bytes.subarray(i, Math.min(i + chunk, bytes.length)));
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function getOrCreateKey(): Promise<Uint8Array> {
  if (Platform.OS === "web") {
    // The preview has no device keystore, so its key is memory-only. Native
    // builds store the key in the OS secure store on this device only.
    if (!webSessionKey) webSessionKey = await Crypto.getRandomBytesAsync(nacl.secretbox.keyLength);
    return webSessionKey;
  }
  let stored = await SecureStore.getItemAsync(KEY_NAME);
  if (!stored) {
    stored = hex(await Crypto.getRandomBytesAsync(nacl.secretbox.keyLength));
    await SecureStore.setItemAsync(KEY_NAME, stored, { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY });
  }
  const key = unhex(stored);
  if (key.length !== nacl.secretbox.keyLength) throw new Error("The local package encryption key is invalid. Redeem the package again to reinstall it.");
  return key;
}

/** Encrypts downloaded JavaScript before persistence; plaintext is held only during the current run. */
export async function saveAutomationPackage(packageId: string, javascriptSource: string): Promise<void> {
  if (javascriptSource.length > 1024 * 1024) throw new Error("This JavaScript package is larger than the 1 MB device limit.");
  const key = await getOrCreateKey();
  const nonce = await Crypto.getRandomBytesAsync(nacl.secretbox.nonceLength);
  const message = new TextEncoder().encode(javascriptSource);
  const ciphertext = nacl.secretbox(message, nonce, key);
  await AsyncStorage.setItem(`${PACKAGE_PREFIX}${packageId}`, JSON.stringify({ version: 1, nonce: toBase64(nonce), ciphertext: toBase64(ciphertext) }));
}

export async function loadAutomationPackage(packageId: string): Promise<string> {
  const raw = await AsyncStorage.getItem(`${PACKAGE_PREFIX}${packageId}`);
  if (!raw) throw new Error("This encrypted automation package is not installed on this device. Redeem its code again while it is valid.");
  const record = JSON.parse(raw) as { version?: number; nonce?: string; ciphertext?: string };
  if (record.version !== 1 || !record.nonce || !record.ciphertext) throw new Error("The installed JavaScript package is damaged.");
  const key = await getOrCreateKey();
  const plaintext = nacl.secretbox.open(fromBase64(record.ciphertext), fromBase64(record.nonce), key);
  if (!plaintext) throw new Error("The JavaScript package could not be decrypted on this device.");
  return new TextDecoder().decode(plaintext);
}

export async function removeAutomationPackage(packageId: string): Promise<void> {
  await AsyncStorage.removeItem(`${PACKAGE_PREFIX}${packageId}`);
}
