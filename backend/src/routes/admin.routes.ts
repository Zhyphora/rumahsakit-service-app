import { Router } from "express";
import { AccessControlController } from "../controllers/AccessControlController";
import { roleMiddleware } from "../middlewares/auth";

const router = Router();
const accessController = new AccessControlController();

// All admin routes require admin role
router.use(roleMiddleware("admin"));

router.get("/access-controls", accessController.listAll);
router.post("/access-controls", accessController.setPermission);
router.delete("/access-controls/:id", accessController.deletePermission);

export default router;
