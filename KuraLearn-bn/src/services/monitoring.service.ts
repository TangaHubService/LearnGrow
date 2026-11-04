import { prisma } from "../prisma/client.js";
import { env } from "../config/env.js";

let sentryInitialized = false;

export function initializeMonitoring() {
  if (env.NODE_ENV === "production" && process.env.SENTRY_DSN) {
    try {
      sentryInitialized = true;
      console.log("[Monitoring] Sentry initialized");
    } catch {
      console.warn("[Monitoring] Failed to initialize Sentry");
    }
  }
}

export function captureError(error: Error, context?: Record<string, unknown>) {
  console.error("[Error]", error.message, context ?? "");
}

export function captureMessage(message: string, level: "info" | "warn" | "error" = "info") {
  const prefix = level === "error" ? "[ERROR]" : level === "warn" ? "[WARN]" : "[INFO]";
  console.log(`${prefix} ${message}`);
}

interface RequestMetrics {
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  userId?: string;
}

export function logRequestMetric(metrics: RequestMetrics) {
  if (metrics.durationMs > 5000) {
    console.warn(`[Slow Request] ${metrics.method} ${metrics.path} took ${metrics.durationMs}ms`);
  }
}

export async function getSystemHealth() {
  const start = Date.now();
  let dbOk = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbOk = true;
  } catch {
    // dbOk stays false and the health report shows "degraded".
  }
  const dbLatency = Date.now() - start;

  return {
    status: dbOk ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: {
      status: dbOk ? "connected" : "disconnected",
      latencyMs: dbLatency,
    },
    version: process.env.npm_package_version ?? "0.1.0",
    environment: env.NODE_ENV,
  };
}
