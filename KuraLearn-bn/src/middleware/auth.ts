import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../http/errors.js";

export type AuthRole = "STUDENT" | "PARENT" | "TEACHER" | "HEAD_TEACHER" | "DIRECTOR_OF_STUDIES" | "ADMIN" | "SUPER_ADMIN";

export interface AuthUser {
  sub: string;
  tenantId?: string;
  roles: AuthRole[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = req.header("authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new AppError(401, "Authentication is required", "AUTH_REQUIRED");
  }

  try {
    req.user = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthUser;
    next();
  } catch {
    throw new AppError(401, "Invalid or expired token", "AUTH_INVALID");
  }
}

export function getAuthenticatedUser(req: Request): AuthUser {
  if (!req.user) {
    throw new AppError(401, "Authentication is required", "AUTH_REQUIRED");
  }
  return req.user;
}

export function requireRole(...roles: AuthRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError(401, "Authentication is required", "AUTH_REQUIRED");
    }

    const hasRole = req.user.roles.some((role) => roles.includes(role));
    if (!hasRole) {
      throw new AppError(403, "You do not have access to this resource", "FORBIDDEN");
    }

    next();
  };
}
