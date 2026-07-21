// server/src/lib/db.ts

import mongoose from 'mongoose'
import { ENV } from './env.js'

export async function connectDB(): Promise<void> {
  try {
    const conn = await mongoose.connect(ENV.MONGO_URI)
    console.log(`MongoDB connected: ${conn.connection.host}`)
  } catch (error) {
    console.error('MongoDB connection error:', error)
    process.exit(1)
  }
}
