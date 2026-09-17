import mongoose from "mongoose";

export async function connectDatabase(uri) {
  if (!uri) throw new Error("MONGODB_URI is not configured.");

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10_000,
  });
}
