import { Request, Response } from "express";
import { AuthService } from "../services/AuthService";
import { AuthRequest } from "../middlewares/auth";

export class AuthController {
  private authService = new AuthService();

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = await this.authService.register(req.body);
      res.status(201).json({ message: "User registered successfully", user });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);
      res.json(result);
    } catch (error: any) {
      res.status(401).json({ message: error.message });
    }
  };

  getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
      }
      const profile = await this.authService.getProfile(req.user.id);
      res.json(profile);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
      }
      const { oldPassword, newPassword } = req.body;
      const result = await this.authService.changePassword(
        req.user.id,
        oldPassword,
        newPassword
      );
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };
}
