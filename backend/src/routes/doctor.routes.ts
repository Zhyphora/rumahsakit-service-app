import { Router } from "express";
import { DoctorController } from "../controllers/DoctorController";

const router = Router();
const doctorController = new DoctorController();

// Public routes (no auth required for display)
router.get("/", doctorController.getAllDoctors);
router.get("/available", doctorController.getAvailableDoctors);
router.get("/:id", doctorController.getDoctorById);

export default router;
