import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  console.warn("[db] MONGODB_URI is not set. DB calls will fail until configured.");
}

let conn: typeof mongoose | null = null;

export async function connectDB() {
  if (conn) return conn;
  if (!MONGODB_URI) throw new Error("Missing MONGODB_URI");
  conn = await mongoose.connect(MONGODB_URI);
  return conn;
}

