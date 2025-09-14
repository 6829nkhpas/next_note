import express from "express";
import cors from "cors";
import morgan from "morgan";
import authRoutes from "./routes/auth.js";
import notesRoutes from "./routes/notes.js";
import tenantRoutes from "./routes/tenants.js";

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use(morgan("dev"));

  const corsOrigins = (process.env.CORS_ORIGIN || "")
    .split(",")
    .filter(Boolean);
  app.use(
    cors({
      origin: corsOrigins.length ? corsOrigins : ["http://localhost:3000"],
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  // Simple health check - no database required
  app.get("/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      version: "1.0.0",
    });
  });

  // Test endpoint to verify serverless function is working
  app.get("/test", (req, res) => {
    res.json({
      message: "API is working!",
      timestamp: new Date().toISOString(),
      env: {
        hasMongoUri: !!process.env.MONGODB_URI,
        hasJwtSecret: !!process.env.JWT_SECRET,
        corsOrigin: process.env.CORS_ORIGIN || "not set",
      },
    });
  });

  // Root endpoint
  app.get("/", (req, res) => {
    res.json({
      message: "Notes API Server",
      version: "1.0.0",
      endpoints: ["/health", "/test", "/auth/login", "/notes"],
      timestamp: new Date().toISOString(),
    });
  });

  app.use("/auth", authRoutes);
  app.use("/notes", notesRoutes);
  app.use("/tenants", tenantRoutes);

  return app;
}

export default createApp;
