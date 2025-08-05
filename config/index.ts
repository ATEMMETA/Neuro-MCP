// config/index.ts
import deepmerge from "deepmerge";
import development from "./development";
import production from "./production";

type Config = {
  SERVER_PORT: number;
  FEATURE_FLAGS: Record<string, boolean>;
  DB_CONNECTION_STRING: string;
};

// Load base config based on NODE_ENV
const baseConfig = process.env.NODE_ENV === "production" ? production : development;

// Merge runtime overrides from environment variables
const runtimeOverrides: Partial<Config> = {
  SERVER_PORT: process.env.PORT ? Number(process.env.PORT) : undefined,
  DB_CONNECTION_STRING: process.env.DB_CONNECTION_STRING,
};

// Deep merge configs
const config: Config = deepmerge(baseConfig, runtimeOverrides);

export default config;
