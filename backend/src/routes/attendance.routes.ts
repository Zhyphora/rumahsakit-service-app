import { Router } from "express";
import { AttendanceController } from "../controllers/AttendanceController";
import { authMiddleware, roleMiddleware } from "../middlewares/auth";

const router = Router();
const attendanceController = new AttendanceController();

// All routes require authentication
router.use(authMiddleware);

// Personal attendance
router.post("/check-in", attendanceController.checkIn);
router.post("/check-out", attendanceController.checkOut);
router.get("/today", attendanceController.getTodayStatus);
router.get("/history", attendanceController.getHistory);
router.get("/monthly", attendanceController.getMonthlySummary);

// Leave requests
router.get("/leave", attendanceController.getLeaveRequests);
router.post("/leave", attendanceController.createLeaveRequest);
router.post(
  "/leave/:id/process",
  roleMiddleware("admin"),
  attendanceController.processLeaveRequest
);

// Admin only
router.get("/report", roleMiddleware("admin"), attendanceController.getReport);

export default router;
