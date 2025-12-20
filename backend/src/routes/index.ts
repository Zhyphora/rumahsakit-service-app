import { Router } from "express";
import adminRoutes from "./admin.routes";
import authRoutes from "./auth.routes";
import queueRoutes from "./queue.routes";
import stockRoutes from "./stock.routes";
import documentRoutes from "./document.routes";
import attendanceRoutes from "./attendance.routes";
import patientRoutes from "./patient.routes";
import doctorRoutes from "./doctor.routes";
import prescriptionRoutes from "./prescription.routes";
import roleRoutes from "./role.routes";
import medicalRecordRoutes from "./medicalRecord.routes";
import userRoutes from "./user.routes";

const router = Router();

router.use("/auth", authRoutes);
router.use("/roles", roleRoutes);
router.use("/queue", queueRoutes);
router.use("/stock", stockRoutes);
router.use("/admin", adminRoutes);
router.use("/documents", documentRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/patients", patientRoutes);
router.use("/doctors", doctorRoutes);
router.use("/prescriptions", prescriptionRoutes);
router.use("/medical-records", medicalRecordRoutes);
router.use("/users", userRoutes);

export default router;
