import { Request, Response } from "express";
import { StockService } from "../services/StockService";
import { StockOpnameService } from "../services/StockOpnameService";
import { AuthRequest } from "../middlewares/auth";

export class StockController {
  private stockService = new StockService();
  private stockOpnameService = new StockOpnameService();

  // Items
  getItems = async (req: Request, res: Response): Promise<void> => {
    try {
      const { category, search, lowStock } = req.query;
      const items = await this.stockService.getItems({
        category: category as string,
        search: search as string,
        lowStock: lowStock === "true",
      });
      res.json(items);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  getItemById = async (req: Request, res: Response): Promise<void> => {
    try {
      const item = await this.stockService.getItemById(req.params.id);
      if (!item) {
        res.status(404).json({ message: "Item not found" });
        return;
      }
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  createItem = async (req: Request, res: Response): Promise<void> => {
    try {
      const item = await this.stockService.createItem(req.body);
      res.status(201).json(item);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  updateItem = async (req: Request, res: Response): Promise<void> => {
    try {
      const item = await this.stockService.updateItem(req.params.id, req.body);
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  deleteItem = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.stockService.deleteItem(req.params.id);
      res.json({ message: "Item deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  // Stock Opname
  getStockOpnames = async (req: Request, res: Response): Promise<void> => {
    try {
      const { status } = req.query;
      const opnames = await this.stockService.getStockOpnames(status as any);
      res.json(opnames);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  getStockOpnameById = async (req: Request, res: Response): Promise<void> => {
    try {
      const opname = await this.stockService.getStockOpnameById(req.params.id);
      if (!opname) {
        res.status(404).json({ message: "Stock opname not found" });
        return;
      }
      res.json(opname);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  createStockOpname = async (
    req: AuthRequest,
    res: Response
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
      }
      const { notes } = req.body;
      const opname = await this.stockService.createStockOpname(
        req.user.id,
        notes
      );
      res.status(201).json(opname);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  addItemToOpname = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { itemId, actualQty, notes } = req.body;
      const item = await this.stockOpnameService.addItem(
        id,
        itemId,
        actualQty,
        notes
      );
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  completeStockOpname = async (
    req: AuthRequest,
    res: Response
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
      }
      const opname = await this.stockOpnameService.completeOpname(
        req.params.id,
        req.user.id
      );
      res.json(opname);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  // Stock Movements
  getStockMovements = async (req: Request, res: Response): Promise<void> => {
    try {
      const { itemId, limit } = req.query;
      const movements = await this.stockService.getStockMovements(
        itemId as string,
        limit ? parseInt(limit as string) : undefined
      );
      res.json(movements);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  adjustStock = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
      }
      const { itemId, quantity, notes } = req.body;
      const item = await this.stockService.adjustStock(
        itemId,
        quantity,
        notes,
        req.user.id
      );
      res.json(item);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  // New endpoints using StockOpnameService
  correctStock = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
      }
      const { itemId, adjustedQty, reason } = req.body;
      const correction = await this.stockOpnameService.correctStock(
        itemId,
        adjustedQty,
        reason,
        req.user.id
      );
      res.json(correction);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  adjustIn = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
      }
      const { itemId, qty, notes } = req.body;
      const batch = await this.stockOpnameService.adjustIn(
        itemId,
        qty,
        notes,
        req.user.id
      );
      res.json(batch);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  adjustOut = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
      }
      const { itemId, qty, notes } = req.body;
      await this.stockOpnameService.adjustOut(itemId, qty, notes, req.user.id);
      res.json({ message: "Stock adjusted out successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  getLowStockItems = async (_req: Request, res: Response): Promise<void> => {
    try {
      const items = await this.stockService.getLowStockItems();
      res.json(items);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };
}
