import dotenv from "dotenv";
import { connectToDatabase } from "./utils/db.js";
import { createApp } from "./app.js";

dotenv.config();

const app = createApp();

const port = process.env.PORT || 8000;

connectToDatabase(process.env.MONGODB_URI)
  .then(() => {
    app.listen(port, () => {
      console.log(`API listening on :${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
  });


