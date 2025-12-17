import { Router } from "express";
import { AccessControlController } from "../controllers/AccessControlController";
import { roleMiddleware, authMiddleware } from "../middlewares/auth";

const router = Router();
const accessController = new AccessControlController();

// All admin routes require authentication and admin role
router.use(authMiddleware);
router.use(roleMiddleware("admin"));

router.get("/access-controls", accessController.listAll);
router.post("/access-controls", accessController.setPermission);
router.delete("/access-controls/:id", accessController.deletePermission);
router.get("/users-list", accessController.getUsersList);

export default router;
