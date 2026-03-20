import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { httpLogger, logger } from "./lib/logger.js";
import authRouter from "./routes/auth.js";
import workerRouter from "./routes/worker.js";
import adminRouter from "./routes/admin.js";
import mcpRouter from "./routes/mcp.js";
import { requireAuth, requireRole } from "./middleware/auth.js";
import policiesRouter from "./routes/policies.js";
import triggersRouter from "./routes/triggers.js";
import payoutsRouter from "./routes/payouts.js";
import ingestRouter from "./routes/ingest.js";
import mockRouter from "./routes/mock.js";
import { metricsMiddleware, metricsEndpoint } from "./metrics/index.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use(cors({ origin: process.env.CORS_ORIGIN || "*" }));
  app.use(helmet());
  app.use(httpLogger);
  app.use(express.json());
  app.use(metricsMiddleware);

  const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 120,
  });

  app.use(limiter);

  app.get("/health", (req, res) => {
    res.json({ status: "ok", service: "backend-services" });
  });

  app.get("/metrics", metricsEndpoint);
  app.use("/auth", authRouter);
  if (process.env.ENABLE_MOCK_FEED === "true") {
    app.use("/mock", mockRouter);
  }
  app.use("/ingest", ingestRouter);
  app.use("/mcp", requireAuth, mcpRouter);
  app.use("/worker", requireAuth, requireRole("worker"), workerRouter);
  app.use("/admin", requireAuth, requireRole("admin"), adminRouter);

  app.use("/policies", policiesRouter);
  app.use("/triggers", triggersRouter);
  app.use("/payouts", payoutsRouter);

  app.use((err, req, res, next) => {
    logger.error({ err }, "Unhandled error");
    if (err.name === "ZodError") {
      res.status(400).json({ error: "Validation error", details: err.errors });
      return;
    }
    res.status(500).json({ error: "Unexpected error" });
  });

  return app;
}
