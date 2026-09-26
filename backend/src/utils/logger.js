import winston from "winston";

const sensitiveKeys = new Set([
  "password",
  "passwordhash",
  "token",
  "authorization",
  "cookie",
  "jwt_secret",
  "jwt",
  "secret",
  "apikey",
  "gemini_api_key",
  "mongodb_uri",
]);

function redactSensitiveData(obj) {
  if (!obj || typeof obj !== "object") return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => redactSensitiveData(item));
  }

  const redacted = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.has(lowerKey)) {
      redacted[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      redacted[key] = redactSensitiveData(value);
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
}

const redactFormat = winston.format((info) => {
  if (info.meta && typeof info.meta === "object") {
    info.meta = redactSensitiveData(info.meta);
  }
  return info;
});

const isProduction = process.env.NODE_ENV === "production";

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || (isProduction ? "info" : "debug"),
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    redactFormat(),
    isProduction
      ? winston.format.json()
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ level, message, timestamp, ...meta }) => {
            const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
            return `[${timestamp}] ${level}: ${message}${metaStr}`;
          }),
        ),
  ),
  transports: [new winston.transports.Console()],
});

// Stream adapter for Morgan HTTP logger
export const morganStream = {
  write: (message) => {
    logger.info(message.trim());
  },
};
