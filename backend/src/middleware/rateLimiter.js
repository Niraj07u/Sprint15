import rateLimit from "express-rate-limit";

function createRateLimiter({ windowMs, max, message }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === "/health",
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message: message || "Too many requests. Please try again later.",
      });
    },
    message: {
      success: false,
      message: message || "Too many requests. Please try again later.",
    },
  });
}

// 1. Sensitive Authentication Rate Limiter (Brute-force protection)
export const authLimiter = createRateLimiter({
  windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000), // 15 mins
  max: Number(process.env.AUTH_RATE_LIMIT_MAX || 20),
  message: "Too many authentication attempts. Please wait 15 minutes before trying again.",
});

// 2. AI Generation Rate Limiter (Token / Quota / DoS protection)
export const aiLimiter = createRateLimiter({
  windowMs: Number(process.env.AI_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000), // 15 mins
  max: Number(process.env.AI_RATE_LIMIT_MAX || 30),
  message: "Too many AI analysis requests. Please wait a few minutes before trying again.",
});

// 3. General API Rate Limiter
export const generalApiLimiter = createRateLimiter({
  windowMs: Number(process.env.API_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000), // 15 mins
  max: Number(process.env.API_RATE_LIMIT_MAX || 300),
  message: "API rate limit exceeded. Please slow down your requests.",
});
