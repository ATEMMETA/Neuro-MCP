 # Dynamic feature toggling #Agility
/**
 * apps/server/config/featureFlags.ts
 *
 * Dynamic feature toggling configuration and helpers.
 * #Agility
 */

type FeatureFlags = {
  [flag: string]: boolean;
};

/**
 * Sample feature flags object.
 * You may want to load these from environment variables, remote service, or config files.
 */
const featureFlags: FeatureFlags = {
  enableNewAgentWorkflow: process.env.FEATURE_ENABLE_NEW_AGENT_WORKFLOW === 'true',
  useExperimentalTmuxHandler: process.env.FEATURE_USE_EXPERIMENTAL_TMUX === 'true',
  enableDetailedLogging: process.env.FEATURE_ENABLE_DETAILED_LOGGING === 'true',
  // Add other flags here
};

/**
 * Checks if a given feature flag is enabled.
 * 
 * @param flagName - The name of the feature flag.
 * @returns boolean indicating if the feature is enabled.
 */
export function isFeatureEnabled(flagName: keyof FeatureFlags): boolean {
  return featureFlags[flagName] ?? false;
}

export default featureFlags;
