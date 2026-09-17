import { User } from "../models/User.js";
import { generateToken } from "../utils/token.js";
import { toSafeUser } from "../utils/user.js";

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
  try {
    const existingUser = await User.findOne({ email: normalizedEmail }).select("_id");
    if (existingUser) {
      return response.status(409).json({ success: false, message: "An account already exists for that email." });
    }

    const user = await User.create({ name: name.trim(), email: normalizedEmail, password });
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
    return next(error);
  }
}

export async function login(request, response, next) {
  const { email, password } = request.body ?? {};
  if (typeof email !== "string" || !emailPattern.test(email.trim()) || typeof password !== "string" || !password) {
    return response.status(400).json({ success: false, message: "Enter a valid email and password." });
  }

  try {
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return response.status(401).json({ success: false, message: "Email or password is incorrect." });
    }

    return response.status(200).json({
      success: true,
      message: "Login successful.",
      token: generateToken(user._id),
      user: toSafeUser(user),
    });
  } catch (error) {
    return next(error);
  }
}

export function me(request, response) {
  return response.status(200).json({ success: true, user: request.user });
}
