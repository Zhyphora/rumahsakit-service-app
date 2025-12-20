import { Request, Response } from "express";
import { QueueService } from "../services/QueueService";
import { AuthRequest } from "../middlewares/auth";

export class QueueController {
  private queueService = new QueueService();

  // Take a new queue number
  takeNumber = async (req: Request, res: Response): Promise<void> => {
    try {
      const queue = await this.queueService.takeNumber(req.body);
      res.status(201).json(queue);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  // Get queue for a polyclinic
  getPolyclinicQueue = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const queue = await this.queueService.getPolyclinicQueue(id);
      res.json(queue);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  // Call next number
  callNumber = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const doctorId = req.body?.doctorId;
      const queue = await this.queueService.callNumber(id, doctorId);
      res.json(queue);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  // Start serving
  serveNumber = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const queue = await this.queueService.serveNumber(id);
      res.json(queue);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  // Complete serving
  completeNumber = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const notes = req.body?.notes;
      const queue = await this.queueService.completeNumber(id, notes);
      res.json(queue);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  // Skip number
  skipNumber = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const notes = req.body?.notes;
      const queue = await this.queueService.skipNumber(id, notes);
      res.json(queue);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  // Get display data
  getDisplayData = async (_req: Request, res: Response): Promise<void> => {
    try {
      const data = await this.queueService.getDisplayData();
      res.json(data);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  // Get polyclinics
  getPolyclinics = async (_req: Request, res: Response): Promise<void> => {
    try {
      const polyclinics = await this.queueService.getPolyclinics();
      res.json(polyclinics);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  // Get my queue (for patient)
  getMyQueue = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
      }
      const queue = await this.queueService.getMyQueue(req.user.id);
      res.json(queue);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };
}
