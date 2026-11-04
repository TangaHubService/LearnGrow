import { Router } from "express";
import rateLimit from "express-rate-limit";
import { asyncHandler } from "../../http/async-handler.js";
import { requireAuth } from "../../middleware/auth.js";
import { forgotPasswordController, loginController, logoutController, meController, refreshTokenController, registerController, resetPasswordController } from "./auth.controller.js";

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { code: "RATE_LIMITED", message: "Too many requests. Please try again later." } }
});

export const authRouter = Router();

authRouter.post("/register", authRateLimit, asyncHandler(registerController));

authRouter.post("/login", authRateLimit, asyncHandler(loginController));

authRouter.post("/forgot-password", authRateLimit, asyncHandler(forgotPasswordController));

authRouter.post("/reset-password", authRateLimit, asyncHandler(resetPasswordController));

authRouter.post("/refresh", asyncHandler(refreshTokenController));

authRouter.post("/logout", requireAuth, asyncHandler(logoutController));

authRouter.get("/me", requireAuth, asyncHandler(meController));
