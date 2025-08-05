// config/production.ts
export default {
  SERVER_PORT: 80,
  FEATURE_FLAGS: {
    enableNewAgent: true,
    useCache: true,
  },
  DB_CONNECTION_STRING: process.env.DB_CONNECTION_STRING || "",
};
