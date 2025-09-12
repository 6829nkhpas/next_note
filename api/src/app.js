import express from "express";
import cors from "cors";
import morgan from "morgan";
import authRoutes from "../src/routes/auth.js";
import notesRoutes from "../src/routes/notes.js";
import tenantRoutes from "../src/routes/tenants.js";

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use(morgan("dev"));

  const corsOrigins = (process.env.CORS_ORIGIN || "").split(",").filter(Boolean);
  app.use(
    cors({
      origin: corsOrigins.length ? corsOrigins : true,
      credentials: true,
    })
  );

  app.get("/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/auth", authRoutes);
  app.use("/notes", notesRoutes);
  app.use("/tenants", tenantRoutes);

  return app;
}

export default createApp;


