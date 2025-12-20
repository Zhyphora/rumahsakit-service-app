import { Router } from "express";
import { MedicalRecordController } from "../controllers/MedicalRecordController";
import { authMiddleware } from "../middlewares/auth";

const router = Router();
const controller = new MedicalRecordController();

router.use(authMiddleware);

// Patient routes
router.get("/my-records", controller.getMyRecords.bind(controller));

// Admin/Doctor routes (can add permission middleware)
router.get("/", controller.getAll.bind(controller));
router.get("/:id", controller.getById.bind(controller));

export default router;
