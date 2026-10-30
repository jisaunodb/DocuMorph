import mongoose from 'mongoose';
import { config } from './env';
import { dataStore } from '../services/dataStore';

export async function connectDB(): Promise<boolean> {
  if (!config.mongoUri || config.mongoUri.includes('<username>')) {
    console.log('[Database] No MongoDB Atlas URI provided. Operating in resilient embedded storage mode.');
    return false;
  }

  try {
    console.log('[Database] Connecting to MongoDB Atlas...');
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 8000,
      dbName: 'documorph',
    });
    console.log('[Database] MongoDB Atlas connected successfully to database: documorph');

    // Initialize MongoDB collections and sync existing seed/cache
    await dataStore.initMongoDB();

    return true;
  } catch (error: any) {
    console.warn(`[Database] MongoDB connection failed (${error.message}). Falling back to local data store.`);
    return false;
  }
}
