import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { authMiddleware } from "../middlewares/auth";

const router = Router();
const authController = new AuthController();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/login-bpjs", authController.loginByBpjs);
router.get("/profile", authMiddleware, authController.getProfile);
router.put("/change-password", authMiddleware, authController.changePassword);

export default router;
