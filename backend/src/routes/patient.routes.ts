import { Router } from "express";
import { PatientController } from "../controllers/PatientController";
import { authMiddleware, roleMiddleware } from "../middlewares/auth";

const router = Router();
const patientController = new PatientController();

// All routes require authentication
router.use(authMiddleware);
router.use(roleMiddleware("admin", "doctor", "staff"));

router.get("/", patientController.getPatients);
router.get("/mrn/:mrn", patientController.searchByMRN);
router.get("/:id", patientController.getPatientById);
router.post("/", patientController.createPatient);
router.put("/:id", patientController.updatePatient);
router.delete("/:id", roleMiddleware("admin"), patientController.deletePatient);

export default router;
