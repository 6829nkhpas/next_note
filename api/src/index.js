import serverless from "serverless-http";
import dotenv from "dotenv";
import { connectToDatabase } from "./utils/db.js";
import { createApp } from "./app.js";

dotenv.config();

let cachedHandler;

export const handler = async (event, context) => {
  if (!cachedHandler) {
    await connectToDatabase(process.env.MONGODB_URI);
    const app = createApp();
    cachedHandler = serverless(app);
  }
  return cachedHandler(event, context);
};

export default handler;


