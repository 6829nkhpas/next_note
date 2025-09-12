import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import { connectToDatabase } from "./utils/db.js";

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(morgan("dev"));

const corsOrigins = (process.env.CORS_ORIGIN || "").split(",").filter(Boolean);
app.use(
  cors({
    origin: corsOrigins.length ? corsOrigins : true,
    credentials: true,
  })
);

// Health
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Routes to be added

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


