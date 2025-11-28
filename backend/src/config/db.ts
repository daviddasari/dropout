import mongoose from "mongoose";

export async function connectDB(uri: string) {
  if (!uri) {
    throw new Error("MONGODB_URI is not set");
  }

  mongoose.set("strictQuery", true);

  await mongoose.connect(uri, {
    // socketTimeoutMS and serverSelectionTimeoutMS help surface connection issues quickly
    // and avoid hanging forever in dev environments.
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
  } as any);

  const conn = mongoose.connection;

  conn.on("connected", () => {
    console.log("MongoDB connected");
  });

  conn.on("error", (err: unknown) => {
    console.error("MongoDB connection error:", err);
  });

  conn.on("disconnected", () => {
    console.warn("MongoDB disconnected");
  });

  return conn;
}
