import "dotenv/config";

import { app } from "./app.js";
import { connectDatabase } from "./config/db.js";

const port = Number(process.env.PORT || 4000);

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET is not configured.");
}

connectDatabase(process.env.MONGODB_URI)
  .then(() => {
    app.listen(port, () => {
      console.log(`Prodesk API listening on port ${port}`);
    });
  })
  .catch((error) => {
    console.error(`Database connection failed: ${error.message}`);
    process.exit(1);
  });
