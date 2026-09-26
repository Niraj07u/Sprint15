import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { authRouter } from "./routes/authRoutes.js";
import { workspaceItemRouter } from "./routes/workspaceItemRoutes.js";
import { aiRouter } from "./routes/aiRoutes.js";
import { logger, morganStream } from "./utils/logger.js";

const configuredOrigins = (process.env.CLIENT_URL || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const app = express();

// 1. Production HTTP Security Headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // Managed by Next.js client
    crossOriginEmbedderPolicy: false,
  }),
);

// 2. Production HTTP Request Logging via Morgan & Winston
app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms", {
    stream: morganStream,
    skip: (req) => req.path === "/health",
  }),
);

// 3. Strict Production-Safe CORS
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || configuredOrigins.includes(origin)) return callback(null, true);
      logger.warn(`Blocked CORS request from disallowed origin: ${origin}`);
      return callback(new Error("Origin is not allowed by CORS."));
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// 4. Payload Size Limit
app.use(express.json({ limit: "15kb" }));

// 5. Health Check Endpoint (Exempt from Rate Limiting & Auth)
app.get("/health", (_request, response) =>
  response.status(200).json({
    success: true,
    status: "healthy",
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  }),
);

// 6. Application Routes
app.use("/api/auth", authRouter);
app.use("/api/workspace-items", workspaceItemRouter);
app.use("/api/ai", aiRouter);

// 7. Centralized Error Handling Middleware
app.use((error, _request, response, next) => {
  void next;
  if (error instanceof SyntaxError && "body" in error) {
    logger.warn(`Malformed JSON body rejected: ${error.message}`);
    return response.status(400).json({ success: false, message: "Request body must be valid JSON." });
  }
  if (error.message === "Origin is not allowed by CORS.") {
    return response.status(403).json({ success: false, message: "Origin is not allowed." });
  }

  logger.error(`Unhandled server error: ${error.message}`);
  return response.status(500).json({ success: false, message: "An unexpected server error occurred." });
});
