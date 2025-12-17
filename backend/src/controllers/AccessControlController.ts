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
  // body: { role: string, feature: string, allowed: boolean }
  setPermission = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { role, feature, allowed } = req.body;
      if (!role || !feature || typeof allowed !== "boolean") {
        res.status(400).json({ message: "Invalid payload" });
        return;
      }
      const result = await this.accessService.setPermission(
        role,
        feature,
        allowed
      );
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
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
