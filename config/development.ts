// config/development.ts
export default {
  SERVER_PORT: 4000,
  FEATURE_FLAGS: {
    enableNewAgent: false,
    useCache: true,
  },
  DB_CONNECTION_STRING: "mongodb://localhost:27017/dev-db",
};
