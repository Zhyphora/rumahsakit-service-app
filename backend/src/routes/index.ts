import { Router } from "express";
import authRoutes from "./auth.routes";
import queueRoutes from "./queue.routes";
import stockRoutes from "./stock.routes";
import documentRoutes from "./document.routes";
import attendanceRoutes from "./attendance.routes";
import patientRoutes from "./patient.routes";
import doctorRoutes from "./doctor.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/queue", queueRoutes);
router.use("/stock", stockRoutes);
router.use("/documents", documentRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/patients", patientRoutes);
router.use("/doctors", doctorRoutes);

export default router;
