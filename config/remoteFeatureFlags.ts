// config/remoteFeatureFlags.ts
import axios from "axios";

let remoteFlags: Record<string, boolean> = {};

export async function fetchRemoteFeatureFlags(url: string) {
  try {
    const response = await axios.get(url);
    remoteFlags = response.data; // Assuming JSON of { flagName: boolean }
  } catch (err) {
    console.error("Failed to fetch remote feature flags", err);
  }
}

export function getFlag(flag: string): boolean {
  // local config as fallback or merge logic can be added here
  return remoteFlags[flag] ?? false;
}
