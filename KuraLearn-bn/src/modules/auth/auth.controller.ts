import type { Request, Response } from "express";
import { getAuthenticatedUser } from "../../middleware/auth.js";
import { forgotPasswordSchema, loginSchema, refreshTokenSchema, registerSchema, resetPasswordSchema } from "./auth.schemas.js";
import { getCurrentUser, login, refreshToken, register, requestPasswordReset, resetPassword } from "./auth.service.js";

export async function registerController(req: Request, res: Response) {
  const payload = registerSchema.parse(req.body);
  const result = await register(payload);
  res.status(201).json(result);
}

export async function loginController(req: Request, res: Response) {
  const payload = loginSchema.parse(req.body);
  const result = await login(payload);
  res.json(result);
}

export async function refreshTokenController(req: Request, res: Response) {
  const payload = refreshTokenSchema.parse(req.body);
  const result = await refreshToken(payload.refreshToken);
  res.json(result);
}

export async function meController(req: Request, res: Response) {
  const user = getAuthenticatedUser(req);
  const result = await getCurrentUser(user.sub);
  res.json({ user: result });
}

export async function logoutController(_req: Request, res: Response) {
  res.status(204).send();
}

export async function forgotPasswordController(req: Request, res: Response) {
  const { email } = forgotPasswordSchema.parse(req.body);
  await requestPasswordReset(email);
  res.json({ success: true });
}

export async function resetPasswordController(req: Request, res: Response) {
  const { token, password } = resetPasswordSchema.parse(req.body);
  await resetPassword(token, password);
  res.json({ success: true });
}
