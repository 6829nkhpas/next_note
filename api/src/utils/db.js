import mongoose from "mongoose";

let isConnected = false;

export async function connectToDatabase(uri) {
  if (isConnected) return;
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
  });
  isConnected = true;
}


