import { Router } from "express";
import { RoleController } from "../controllers/RoleController";
import { authMiddleware, roleMiddleware } from "../middlewares/auth";
import { permissionMiddleware } from "../middlewares/permission";

const router = Router();
const roleController = new RoleController();

router.use(authMiddleware);

// Only admins or those with specific permission can manage roles
// Using 'admin:access-control' feature permission
router.get(
  "/",
  permissionMiddleware("admin:access-control"),
  roleController.findAll.bind(roleController)
);
router.post(
  "/",
  permissionMiddleware("admin:access-control"),
  roleController.create.bind(roleController)
);
router.get(
  "/:id",
  permissionMiddleware("admin:access-control"),
  roleController.findOne.bind(roleController)
);
router.put(
  "/:id",
  permissionMiddleware("admin:access-control"),
  roleController.update.bind(roleController)
);
router.delete(
  "/:id",
  permissionMiddleware("admin:access-control"),
  roleController.delete.bind(roleController)
);

export default router;
