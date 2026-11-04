import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { AppError } from "../../http/errors.js";
import { prisma } from "../../prisma/client.js";
import type { AuthRole } from "../../middleware/auth.js";
import type { z } from "zod";
import type { loginSchema, registerSchema } from "./auth.schemas.js";
import { demoEmailAliases } from "../../data/demo-email-aliases.js";
import { sendPasswordResetEmail } from "../../services/email.service.js";

type RegisterInput = z.infer<typeof registerSchema>;
type LoginInput = z.infer<typeof loginSchema>;

type TokenUser = {
  id: string;
  role: AuthRole;
};



function splitName(name: string) {
  const [firstName = name, ...rest] = name.trim().split(/\s+/);
  return { firstName, lastName: rest.join(" ") };
}

async function serializeUser(user: { id: string; email: string; name: string; role: AuthRole; status: string }, emailOverride?: string) {
  const { firstName, lastName } = splitName(user.name);
  
  let schoolId: string | undefined;
  if (user.role === "TEACHER") {
    const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } });
    schoolId = teacher?.schoolId || undefined;
  } else if (user.role === "STUDENT") {
    const student = await prisma.student.findUnique({ where: { userId: user.id } });
    schoolId = student?.schoolId || undefined;
  } else if (user.role === "ADMIN" || user.role === "HEAD_TEACHER") {
    // For admins, we might need a different way to find their school, 
    // but often they are linked via a teacher profile or a school relation
    const teacher = await prisma.teacher.findUnique({ where: { userId: user.id } });
    schoolId = teacher?.schoolId || undefined;
  }

  return {
    id: user.id,
    name: user.name,
    email: emailOverride ?? user.email,
    role: user.role,
    roles: [user.role],
    status: user.status,
    schoolId,
    firstName,
    lastName
  };
}

function issueTokens(user: TokenUser) {
  const payload = {
    sub: user.id,
    roles: [user.role],
    role: user.role
  };

  return {
    accessToken: jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: "30m" }),
    refreshToken: jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: "30d" })
  };
}

export async function register(input: RegisterInput) {
  const existingUser = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
  if (existingUser) {
    throw new AppError(409, "A user with this email already exists", "EMAIL_TAKEN");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({
    data: {
      email: input.email.toLowerCase(),
      passwordHash,
      name: input.name,
      role: input.role
    }
  });

  return {
    user: await serializeUser(user),
    ...issueTokens(user)
  };
}

export async function login(input: LoginInput) {
  const email = input.email.toLowerCase();
  const aliasEmail = demoEmailAliases[email];
  let user = await prisma.user.findUnique({ where: { email } });
  let emailOverride: string | undefined;

  if (!user && aliasEmail) {
    user = await prisma.user.findUnique({ where: { email: aliasEmail } });
    emailOverride = email;
  }

  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
    throw new AppError(401, "Invalid credentials", "INVALID_CREDENTIALS");
  }

  if (user.status !== "ACTIVE") {
    throw new AppError(403, "This account is not active", "ACCOUNT_INACTIVE");
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });

  return {
    user: await serializeUser(user, emailOverride),
    ...issueTokens(user)
  };
}

export async function refreshToken(refreshToken: string) {
  try {
    const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { sub: string };
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new AppError(401, "User not found", "USER_NOT_FOUND");
    }

    if (user.status !== "ACTIVE") {
      throw new AppError(403, "This account is not active", "ACCOUNT_INACTIVE");
    }

    return {
      user: await serializeUser(user),
      ...issueTokens(user)
    };
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError(401, "Invalid refresh token", "INVALID_TOKEN");
    }
    throw error;
  }
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, "User not found", "USER_NOT_FOUND");
  }
  return serializeUser(user);
}

const RESET_TOKEN_LIFETIME_MS = 60 * 60 * 1000;

function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/** Always finishes quietly, so this cannot be used to discover who has an account. */
export async function requestPasswordReset(emailInput: string) {
  const user = await prisma.user.findUnique({ where: { email: emailInput.toLowerCase() } });
  if (!user || user.status !== "ACTIVE") return;

  const token = randomBytes(32).toString("hex");
  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
    prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashResetToken(token),
        expiresAt: new Date(Date.now() + RESET_TOKEN_LIFETIME_MS)
      }
    })
  ]);

  try {
    await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetLink: `${env.FRONTEND_URL}/reset-password?token=${token}`
    });
  } catch (error) {
    console.error("[Auth] Could not send password reset email:", error);
  }
}

export async function resetPassword(token: string, password: string) {
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashResetToken(token) },
    include: { user: { select: { status: true } } }
  });
  if (!record || record.usedAt || record.expiresAt < new Date() || record.user.status !== "ACTIVE") {
    throw new AppError(400, "This reset link is invalid or has expired", "RESET_TOKEN_INVALID");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.updateMany({
      where: { userId: record.userId, usedAt: null },
      data: { usedAt: new Date() }
    })
  ]);
}
