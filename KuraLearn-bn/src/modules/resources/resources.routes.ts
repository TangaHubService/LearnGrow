import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../../middleware/auth.js";
import { asyncHandler } from "../../http/async-handler.js";
import {
  getResourcesHandler,
  getResourceDetailsHandler,
  uploadResourceHandler,
  updateResourceHandler,
  deleteResourceHandler,
  getFoldersHandler,
} from "./resources.controller.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB max file size
  },
});

const router = Router();

// Secure all endpoints with authentication
router.use(requireAuth);

router.get("/", asyncHandler(getResourcesHandler));
router.get("/folders", asyncHandler(getFoldersHandler));
router.get("/:id", asyncHandler(getResourceDetailsHandler));
router.post("/upload", upload.single("file"), asyncHandler(uploadResourceHandler));
router.put("/:id", asyncHandler(updateResourceHandler));
router.delete("/:id", asyncHandler(deleteResourceHandler));

export default router;
