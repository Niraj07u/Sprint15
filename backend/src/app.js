import cors from "cors";
import express from "express";

import { authRouter } from "./routes/authRoutes.js";
import { workspaceItemRouter } from "./routes/workspaceItemRoutes.js";

const configuredOrigins = (process.env.CLIENT_URL || "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const app = express();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || configuredOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Origin is not allowed by CORS."));
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json({ limit: "10kb" }));

app.get("/health", (_request, response) => response.status(200).json({ success: true }));
app.use("/api/auth", authRouter);
app.use("/api/workspace-items", workspaceItemRouter);

app.use((error, _request, response, next) => {
  void next;
  if (error instanceof SyntaxError && "body" in error) {
    return response.status(400).json({ success: false, message: "Request body must be valid JSON." });
  }
  if (error.message === "Origin is not allowed by CORS.") {
    return response.status(403).json({ success: false, message: "Origin is not allowed." });
  }
  return response.status(500).json({ success: false, message: "An unexpected server error occurred." });
});
