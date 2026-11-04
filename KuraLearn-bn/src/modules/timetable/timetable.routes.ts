import { Router } from "express";
import { asyncHandler } from "../../http/async-handler.js";
import { requireAuth, requireRole } from "../../middleware/auth.js";
import {
  createEntryController,
  updateEntryController,
  deleteEntryController,
  getEntryController,
  listEntriesController,
  getGridController,
  generateController,
  checkConflictsController,
  createRoomController,
  updateRoomController,
  deleteRoomController,
  listRoomsController,
  createPeriodController,
  updatePeriodController,
  listPeriodsController,
  setWorkloadController,
  checkWorkloadController
} from "./timetable.controller.js";

export const timetableRouter = Router();

timetableRouter.use(requireAuth, requireRole("TEACHER", "HEAD_TEACHER", "DIRECTOR_OF_STUDIES", "ADMIN", "SUPER_ADMIN"));

// Timetable entries CRUD
timetableRouter.get("/entries", asyncHandler(listEntriesController));
timetableRouter.get("/entries/:id", asyncHandler(getEntryController));
timetableRouter.post("/entries", asyncHandler(createEntryController));
timetableRouter.put("/entries/:id", asyncHandler(updateEntryController));
timetableRouter.delete("/entries/:id", asyncHandler(deleteEntryController));

// Timetable grid view
timetableRouter.get("/grid", asyncHandler(getGridController));

// Auto-generation
timetableRouter.post("/generate", asyncHandler(generateController));

// Conflict check endpoint
timetableRouter.post("/check-conflicts", asyncHandler(checkConflictsController));

// Room management
timetableRouter.get("/rooms", asyncHandler(listRoomsController));
timetableRouter.post("/rooms", asyncHandler(createRoomController));
timetableRouter.put("/rooms/:id", asyncHandler(updateRoomController));
timetableRouter.delete("/rooms/:id", asyncHandler(deleteRoomController));

// Period definitions
timetableRouter.get("/periods", asyncHandler(listPeriodsController));
timetableRouter.post("/periods", asyncHandler(createPeriodController));
timetableRouter.put("/periods/:id", asyncHandler(updatePeriodController));

// Teacher workload
timetableRouter.post("/workload", asyncHandler(setWorkloadController));
timetableRouter.get("/workload/check", asyncHandler(checkWorkloadController));
