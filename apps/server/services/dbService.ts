# Database access layer (e.g., MongoDB) #DataPersistence
// apps/server/services/dbService.ts
import mongoose from 'mongoose';
import { logger } from '../utils/logger';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mcp-db';

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(MONGO_URI);
    logger.info('Connected to MongoDB');
  } catch (err) {
    logger.error({ err }, 'MongoDB connection error');
    process.exit(1);
  }
}
