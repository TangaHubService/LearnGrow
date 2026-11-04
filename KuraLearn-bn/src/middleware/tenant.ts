import type { NextFunction, Request, Response } from "express";
import { prisma } from "../prisma/client.js";
import { AppError } from "../http/errors.js";

declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      tenant?: { id: string; name: string; type: string; subscriptionStatus: string };
    }
  }
}

export async function requireTenant(req: Request, _res: Response, next: NextFunction) {
  const userId = req.user?.sub;
  if (!userId) {
    return next(new AppError(401, "Authentication required", "AUTH_REQUIRED"));
  }

  let schoolId: string | undefined;

  if (req.user?.tenantId) {
    schoolId = req.user.tenantId;
  }

  if (!schoolId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        staff: { select: { schoolId: true } },
        teacher: { select: { schoolId: true } },
        student: { select: { schoolId: true } },
      },
    });

    schoolId = user?.staff?.schoolId ?? user?.teacher?.schoolId ?? user?.student?.schoolId ?? undefined;
  }

  if (!schoolId) {
    if (req.user?.roles?.includes("SUPER_ADMIN")) {
      return next();
    }
    return next(new AppError(403, "No school association found", "NO_TENANT"));
  }

  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  if (!school) {
    return next(new AppError(404, "School not found", "SCHOOL_NOT_FOUND"));
  }

  if (school.subscriptionStatus === "CANCELLED" || school.subscriptionStatus === "PAST_DUE") {
    return next(new AppError(403, "School subscription is inactive", "SUBSCRIPTION_INACTIVE"));
  }

  req.tenantId = schoolId;
  req.tenant = {
    id: school.id,
    name: school.name,
    type: school.type,
    subscriptionStatus: school.subscriptionStatus,
  };

  next();
}

export function tenantFilter(field = "schoolId") {
  return (req: Request) => {
    if (req.tenantId) {
      return { [field]: req.tenantId };
    }
    return {};
  };
}
