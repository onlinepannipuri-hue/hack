import mongoose from 'mongoose';
import { ENV } from './env.js';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4, // Force IPv4
    });
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      console.error(`[Database] Connection Error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn(`[Database] MongoDB disconnected. Attempting to reconnect...`);
    });

    return conn;
  } catch (error) {
    console.error(`[Database] Initial Connection Error: ${error.message}`);
    console.warn(`[Database] Ensure MongoDB Atlas IP Access List includes 0.0.0.0/0 (Allow Access from Anywhere).`);
  }
};
