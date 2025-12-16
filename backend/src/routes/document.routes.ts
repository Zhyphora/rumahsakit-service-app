import { Router } from "express";
import { DocumentController } from "../controllers/DocumentController";
import { authMiddleware, roleMiddleware } from "../middlewares/auth";
import { upload } from "../middlewares/upload";

const router = Router();
const documentController = new DocumentController();

// All routes require authentication
router.use(authMiddleware);

router.get("/", documentController.getDocuments);
router.get("/categories", documentController.getCategories);
router.get("/:id", documentController.getDocumentById);
router.get("/:id/download", documentController.downloadDocument);
router.get("/:id/access", documentController.getDocumentAccess);
router.get(
  "/:id/logs",
  roleMiddleware("admin"),
  documentController.getAccessLogs
);

router.post("/", upload.single("file"), documentController.uploadDocument);
router.post("/:id/access", documentController.grantAccess);

router.put("/:id", documentController.updateDocument);

router.delete("/:id", documentController.deleteDocument);
router.delete("/:id/access/:userId", documentController.revokeAccess);

export default router;
