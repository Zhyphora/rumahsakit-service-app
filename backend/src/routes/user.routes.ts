import { Router } from "express";
import { UserController } from "../controllers/UserController";
import { authMiddleware } from "../middlewares/auth";

import { permissionMiddleware } from "../middlewares/permission";

const router = Router();
const controller = new UserController();

router.use(authMiddleware);

// Only allow admins or those with 'user:manage' permission to view/edit users
router.get("/", permissionMiddleware("user:manage"), controller.getAll);
router.post("/", permissionMiddleware("user:manage"), controller.create);
router.get("/:id", permissionMiddleware("user:manage"), controller.getOne);
router.put(
  "/:id/role",
  permissionMiddleware("user:manage"),
  controller.updateRole
);

export default router;
