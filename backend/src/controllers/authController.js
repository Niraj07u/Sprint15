import mongoose from "mongoose";
import { User } from "../models/User.js";
import { generateToken } from "../utils/token.js";
import { toSafeUser } from "../utils/user.js";
import { memoryStore } from "../utils/fallbackStore.js";
import { logger } from "../utils/logger.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function registrationError(name, email, password) {
  if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 80) {
    return "Enter a name between 2 and 80 characters.";
  }
  if (typeof email !== "string" || !emailPattern.test(email.trim())) {
    return "Enter a valid email address.";
  }
  if (typeof password !== "string" || password.length < 8) {
    return "Password must be at least 8 characters.";
  }
  return null;
}

export async function register(request, response, next) {
  const { name, email, password } = request.body ?? {};
  const validationMessage = registrationError(name, email, password);
  if (validationMessage) return response.status(400).json({ success: false, message: validationMessage });

  const normalizedEmail = email.trim().toLowerCase();

  // If MongoDB is connected, use Mongoose
  if (mongoose.connection.readyState === 1) {
    try {
      const existingUser = await User.findOne({ email: normalizedEmail }).select("_id");
      if (existingUser) {
        logger.warn(`Registration rejected: Email already registered (${normalizedEmail})`);
        return response.status(409).json({ success: false, message: "An account already exists for that email." });
      }

      const user = await User.create({ name: name.trim(), email: normalizedEmail, password });
      logger.info(`User registered successfully: ${normalizedEmail}`);
      return response.status(201).json({
        success: true,
        message: "Registration successful.",
        token: generateToken(user._id),
        user: toSafeUser(user),
      });
    } catch (error) {
      if (error?.code === 11000) {
        return response.status(409).json({ success: false, message: "An account already exists for that email." });
      }
      logger.error(`Registration error: ${error.message}`);
      return next(error);
    }
  }

  // Resilient fallback storage
  try {
    const existing = memoryStore.findUserByEmail(normalizedEmail);
    if (existing) {
      logger.warn(`Registration rejected: Email already registered in fallback store (${normalizedEmail})`);
      return response.status(409).json({ success: false, message: "An account already exists for that email." });
    }

    const user = await memoryStore.createUser({ name: name.trim(), email: normalizedEmail, password });
    logger.info(`User registered in local store: ${normalizedEmail}`);
    return response.status(201).json({
      success: true,
      message: "Registration successful.",
      token: generateToken(user.id),
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    logger.error(`Fallback registration error: ${error.message}`);
    return next(error);
  }
}

export async function login(request, response, next) {
  const { email, password } = request.body ?? {};
  if (typeof email !== "string" || !emailPattern.test(email.trim()) || typeof password !== "string" || !password) {
    return response.status(400).json({ success: false, message: "Enter a valid email and password." });
  }

  const normalizedEmail = email.trim().toLowerCase();

  // If MongoDB is connected, use Mongoose
  if (mongoose.connection.readyState === 1) {
    try {
      const user = await User.findOne({ email: normalizedEmail }).select("+password");
      if (!user || !(await user.comparePassword(password))) {
        logger.warn(`Failed login attempt for: ${normalizedEmail}`);
        return response.status(401).json({ success: false, message: "Email or password is incorrect." });
      }

      logger.info(`User logged in successfully: ${normalizedEmail}`);
      return response.status(200).json({
        success: true,
        message: "Login successful.",
        token: generateToken(user._id),
        user: toSafeUser(user),
      });
    } catch (error) {
      logger.error(`Login error: ${error.message}`);
      return next(error);
    }
  }

  // Resilient fallback storage
  try {
    const user = memoryStore.findUserByEmail(normalizedEmail);
    if (!user || !(await memoryStore.verifyPassword(user, password))) {
      logger.warn(`Failed login attempt in fallback store for: ${normalizedEmail}`);
      return response.status(401).json({ success: false, message: "Email or password is incorrect." });
    }

    logger.info(`User logged in via local store: ${normalizedEmail}`);
    return response.status(200).json({
      success: true,
      message: "Login successful.",
      token: generateToken(user.id),
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error) {
    logger.error(`Fallback login error: ${error.message}`);
    return next(error);
  }
}

export function me(request, response) {
  return response.status(200).json({ success: true, user: request.user });
}
