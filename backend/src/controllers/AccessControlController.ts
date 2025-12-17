import { Request, Response } from "express";
import { AccessControlService } from "../services/AccessControlService";
import { AuthRequest } from "../middlewares/auth";

export class AccessControlController {
  private accessService = new AccessControlService();

  // GET /admin/access-controls
  listAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const entries = await this.accessService.listAll();
      res.json(entries);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  };

  // POST /admin/access-controls
  // body: { role?: string, userId?: string, feature?: string, features?: string[], allowed?: boolean }
  setPermission = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { role, userId, feature, features, allowed } = req.body;
      const isAllowed = allowed !== undefined ? allowed : true;

      if ((!role && !userId) || (!feature && !features)) {
        res.status(400).json({
          message:
            "Invalid payload: Either (role OR userId) AND (feature OR features) required",
        });
        return;
      }

      const featureList = features || [feature];
      const results = [];

      for (const f of featureList) {
        // Cast role/userId to handle potential undefined
        const result = await this.accessService.setPermission(
          role || null,
          userId || null,
          f,
          isAllowed
        );
        results.push(result);
      }

      res.json(results.length === 1 ? results[0] : results);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  };

  // GET /admin/users-list
  getUsersList = async (req: Request, res: Response): Promise<void> => {
    try {
      const { AppDataSource } = require("../config/database");
      const { User } = require("../entities/User");
      const userRepo = AppDataSource.getRepository(User);
      const users = await userRepo.find({
        select: ["id", "name", "role", "email"],
        order: { name: "ASC" },
      });
      res.json(users);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  };

  // DELETE /admin/access-controls/:id
  deletePermission = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      await this.accessService.removePermission(id);
      res.json({ message: "Permission removed" });
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  };
}
