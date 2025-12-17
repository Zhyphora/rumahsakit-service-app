import { Request, Response } from "express";
import { DoctorService } from "../services/DoctorService";

export class DoctorController {
  private doctorService = new DoctorService();

  // Get all doctors
  getAllDoctors = async (_req: Request, res: Response): Promise<void> => {
    try {
      const doctors = await this.doctorService.getAllDoctors();
      res.json(doctors);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  // Get available doctors today
  getAvailableDoctors = async (_req: Request, res: Response): Promise<void> => {
    try {
      const doctors = await this.doctorService.getAvailableDoctors();
      res.json(doctors);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  // Get doctor by ID
  getDoctorById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const doctor = await this.doctorService.getDoctorById(id);
      if (!doctor) {
        res.status(404).json({ message: "Doctor not found" });
        return;
      }
      res.json(doctor);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  // Get doctor queue display data (for public display)
  getDoctorQueueDisplay = async (
    _req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const displayData = await this.doctorService.getDoctorQueueDisplay();
      res.json(displayData);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };
}
