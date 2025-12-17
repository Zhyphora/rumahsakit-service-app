import { Router } from "express";
import { DocumentController } from "../controllers/DocumentController";
import { authMiddleware, roleMiddleware } from "../middlewares/auth";
import { upload } from "../middlewares/upload";

const router = Router();
const documentController = new DocumentController();

// All routes require authentication
router.use(authMiddleware);

// ==================== FOLDER ROUTES ====================
router.get("/folders", documentController.getFolders);
router.get("/folders/:id", documentController.getFolderById);
router.post("/folders", documentController.createFolder);
router.put("/folders/:id", documentController.updateFolder);
router.delete("/folders/:id", documentController.deleteFolder);

// ==================== DOCUMENT ROUTES ====================
router.get("/", documentController.getDocuments);
router.get("/categories", documentController.getCategories);
router.get("/:id", documentController.getDocumentById);
router.get("/:id/download", documentController.downloadDocument);
router.post("/", upload.single("file"), documentController.uploadDocument);
router.put("/:id", documentController.updateDocument);
router.delete("/:id", documentController.deleteDocument);

// ==================== ACCESS CONTROL ROUTES ====================
// Get access list for a document or folder
router.get("/access/list", documentController.getDocumentAccess);

// Get access logs for a document (admin only)
router.get(
  "/:id/logs",
  roleMiddleware("admin"),
  documentController.getAccessLogs
);

// Grant access (supports document or folder, and role/polyclinic/doctor/user criteria)
router.post("/access", documentController.grantAccess);
router.post("/:id/access", documentController.grantAccess);

// Revoke access
router.delete("/access/:accessId", documentController.revokeAccess);

export default router;
