import { Router } from "express";
import { StockController } from "../controllers/StockController";
import { authMiddleware, roleMiddleware } from "../middlewares/auth";

const router = Router();
const stockController = new StockController();

// All routes require authentication
router.use(authMiddleware);
router.use(roleMiddleware("admin", "staff"));

// Items
router.get("/items", stockController.getItems);
router.get("/items/low-stock", stockController.getLowStockItems);
router.get("/items/:id", stockController.getItemById);
router.post("/items", stockController.createItem);
router.put("/items/:id", stockController.updateItem);
router.delete("/items/:id", stockController.deleteItem);

// Stock Opname
router.get("/opname", stockController.getStockOpnames);
router.get("/opname/:id", stockController.getStockOpnameById);
router.post("/opname", stockController.createStockOpname);
router.post("/opname/:id/items", stockController.addItemToOpname);
router.post("/opname/:id/complete", stockController.completeStockOpname);

// Stock Movements
router.get("/movements", stockController.getStockMovements);
router.post("/adjust", stockController.adjustStock);

export default router;
