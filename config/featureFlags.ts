// config/featureFlags.ts
import config from ".";

export function isFeatureEnabled(flag: string): boolean {
  return config.FEATURE_FLAGS[flag] ?? false;
}
