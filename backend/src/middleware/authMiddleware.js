import jwt from "jsonwebtoken";

import { User } from "../models/User.js";
import { toSafeUser } from "../utils/user.js";

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

    const user = await User.findById(payload.userId).select("name email");
    if (!user) throw new Error("User not found");

    request.user = toSafeUser(user);
    return next();
  } catch {
    return response.status(401).json({ success: false, message: "Authentication is invalid or expired." });
  }
}
