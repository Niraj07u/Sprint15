import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import { User } from "../models/User.js";
import { toSafeUser } from "../utils/user.js";
import { memoryStore } from "../utils/fallbackStore.js";

export async function requireAuth(request, response, next) {
  const authorization = request.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return response.status(401).json({ success: false, message: "Authentication is required." });
  }

  const token = authorization.slice("Bearer ".length).trim();
  if (!token) {
    return response.status(401).json({ success: false, message: "Authentication is required." });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    if (typeof payload === "string" || !payload.userId) throw new Error("Invalid token payload");

    // If MongoDB is connected, check Mongoose
    if (mongoose.connection.readyState === 1 && mongoose.isValidObjectId(payload.userId)) {
      const user = await User.findById(payload.userId).select("name email");
      if (user) {
        request.user = toSafeUser(user);
        return next();
      }
    }

    // Fallback store check
    const fallbackUser = memoryStore.findUserById(payload.userId);
    if (fallbackUser) {
      request.user = { id: fallbackUser.id, name: fallbackUser.name, email: fallbackUser.email };
      return next();
    }

    throw new Error("User not found");
  } catch {
    return response.status(401).json({ success: false, message: "Authentication is invalid or expired." });
  }
}
