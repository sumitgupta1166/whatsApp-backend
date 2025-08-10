import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { DB_NAME } from '../constants.js';

dotenv.config({ path: './.env' });

export async function connectDB() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) throw new Error('MONGODB_URI not provided');

  try {
    await mongoose.connect(`${mongoUri}/${DB_NAME}`, {
      dbName: process.env.DB_NAME || DB_NAME,
    });
    console.log('✅ MongoDB connected');
    return mongoose;
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
    throw err;
  }
}
