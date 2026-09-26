import mongoose from "mongoose";
import { logger } from "../utils/logger.js";

export async function connectDatabase(uri) {
  if (!uri) throw new Error("MONGODB_URI is not configured.");

  mongoose.connection.on("error", (err) => {
    logger.error(`MongoDB connection error event: ${err.message}`);
  });

  mongoose.connection.on("disconnected", () => {
    logger.warn("MongoDB connection disconnected");
  });

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10_000,
  });
}
