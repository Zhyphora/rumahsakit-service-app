import { Router } from "express";
import { PrescriptionController } from "../controllers/PrescriptionController";
import { authMiddleware } from "../middlewares/auth";

const router = Router();
const prescriptionController = new PrescriptionController();

// All routes require authentication
router.use(authMiddleware);

// Create prescription
router.post("/", prescriptionController.createPrescription);

// Get pending prescriptions (pharmacy queue)
router.get("/pending", prescriptionController.getPendingPrescriptions);

// Get all prescriptions
router.get("/", prescriptionController.getAllPrescriptions);

// Get patient medical history
router.get("/patient/:patientId", prescriptionController.getPatientHistory);

// Get my prescriptions (for logged in patient)
router.get("/my", prescriptionController.getMyPrescriptions);

// Get prescription by ID
router.get("/:id", prescriptionController.getPrescriptionById);

// Dispense prescription
router.post("/:id/dispense", prescriptionController.dispensePrescription);

// Cancel prescription
router.post("/:id/cancel", prescriptionController.cancelPrescription);

export default router;
