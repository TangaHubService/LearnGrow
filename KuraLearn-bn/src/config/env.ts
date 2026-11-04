import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

function parseOriginList(value: string) {
  return value.split(",").map((origin) => origin.trim()).filter(Boolean);
}

function validOriginList(value: string) {
  const origins = parseOriginList(value);
  if (!origins.length) return false;
  return origins.every((origin) => {
    try {
      new URL(origin);
      return true;
    } catch {
      return false;
    }
  });
}

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(24).optional(),
  JWT_ACCESS_SECRET: z.string().min(24).optional(),
  JWT_REFRESH_SECRET: z.string().min(24).optional(),
  WEB_ORIGIN: z.string().default("http://localhost:5173").refine(validOriginList, "WEB_ORIGIN must be one or more comma-separated URLs"),
  MOBILE_ORIGIN: z.string().default("exp://localhost:8081"),
  API_BASE_URL: z.string().default("http://localhost:4000/api/v1"),
  FRONTEND_URL: z.string().default("http://localhost:5173"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default("gpt-4o"),
  OPENAI_FAST_MODEL: z.string().default("gpt-4o-mini"),
  STORAGE_PROVIDER: z.string().default("LOCAL"),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  GOOGLE_SERVICE_ACCOUNT_EMAIL: z.string().optional(),
  GOOGLE_PRIVATE_KEY: z.string().optional(),
  GOOGLE_DRIVE_FOLDER_ID: z.string().optional(),
  // Email / SMTP settings (all optional — emails are logged to console if SMTP_HOST is not set)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default("KuraLearn <noreply@kuralearn.com>"),
  SMTP_SECURE: z.string().transform((v) => v === "true").default("false")
});

const parsed = envSchema.parse(process.env);
const jwtSecret = parsed.JWT_SECRET ?? parsed.JWT_ACCESS_SECRET;
if (!jwtSecret || jwtSecret.length < 24) {
  throw new Error("Set JWT_SECRET to a random value with at least 24 characters.");
}

export const env = {
  ...parsed,
  WEB_ORIGINS: parseOriginList(parsed.WEB_ORIGIN),
  JWT_SECRET: jwtSecret,
  JWT_ACCESS_SECRET: parsed.JWT_ACCESS_SECRET ?? jwtSecret,
  JWT_REFRESH_SECRET: parsed.JWT_REFRESH_SECRET ?? `${jwtSecret}:refresh`
};
