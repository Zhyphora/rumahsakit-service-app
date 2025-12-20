import { Router } from "express";
import { QueueController } from "../controllers/QueueController";
import { authMiddleware, roleMiddleware } from "../middlewares/auth";

const router = Router();
const queueController = new QueueController();

// Public routes
router.get("/display", queueController.getDisplayData);
router.get("/polyclinics", queueController.getPolyclinics);

// Take number (can be used by anyone)
router.post("/take", queueController.takeNumber);

// Protected routes
router.get(
  "/polyclinic/:id",
  authMiddleware,
  queueController.getPolyclinicQueue
);
router.post(
  "/call/:id",
  authMiddleware,
  roleMiddleware("admin", "doctor", "staff"),
  queueController.callNumber
);
router.post(
  "/serve/:id",
  authMiddleware,
  roleMiddleware("admin", "doctor"),
  queueController.serveNumber
);
router.post(
  "/complete/:id",
  authMiddleware,
  roleMiddleware("admin", "doctor"),
  queueController.completeNumber
);
router.post(
  "/skip/:id",
  authMiddleware,
  roleMiddleware("admin", "doctor", "staff"),
  queueController.skipNumber
);

// Get my queues (for patient dashboard)
router.get("/my", authMiddleware, queueController.getMyQueue);

export default router;
