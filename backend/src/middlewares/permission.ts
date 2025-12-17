import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../middlewares/auth";
import { AccessControlService } from "../services/AccessControlService";

const accessControlService = new AccessControlService();

export const permissionMiddleware = (feature: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const has = await accessControlService.hasAccess(req.user.role, feature);
      if (!has) {
        return res.status(403).json({ message: "Access denied" });
      }
      next();
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  };
};
