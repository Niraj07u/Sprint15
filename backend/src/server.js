import "dotenv/config";

import { app } from "./app.js";
import { connectDatabase } from "./config/db.js";
import { logger } from "./utils/logger.js";

const port = Number(process.env.PORT || 4000);

if (!process.env.JWT_SECRET) {
  logger.error("FATAL: JWT_SECRET environment variable is missing.");
  throw new Error("JWT_SECRET is not configured.");
}

app.listen(port, () => {
  logger.info(`Prodesk Production API listening on port ${port} [NODE_ENV=${process.env.NODE_ENV || "development"}]`);
});

if (process.env.MONGODB_URI) {
  connectDatabase(process.env.MONGODB_URI)
    .then(() => {
      logger.info("Connected to MongoDB successfully");
    })
    .catch((error) => {
      logger.warn(`Database connection warning: ${error.message}`);
    });
}
