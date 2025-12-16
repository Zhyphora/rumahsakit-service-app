import { Request, Response } from "express";
import { PrescriptionService } from "../services/PrescriptionService";
import { AuthRequest } from "../middlewares/auth";

export class PrescriptionController {
  private prescriptionService = new PrescriptionService();

  // Create prescription
  createPrescription = async (
    req: AuthRequest,
    res: Response
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
      }

      const prescription = await this.prescriptionService.createPrescription(
        req.body
      );
      res.status(201).json(prescription);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  // Get prescription by ID
  getPrescriptionById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const prescription = await this.prescriptionService.getPrescriptionById(
        id
      );
      if (!prescription) {
        res.status(404).json({ message: "Prescription not found" });
        return;
      }
      res.json(prescription);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  // Get patient medical history
  getPatientHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { patientId } = req.params;
      const history = await this.prescriptionService.getPatientMedicalHistory(
        patientId
      );
      res.json(history);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  // Get pending prescriptions (pharmacy queue)
  getPendingPrescriptions = async (
    _req: Request,
    res: Response
  ): Promise<void> => {
    try {
      const prescriptions =
        await this.prescriptionService.getPendingPrescriptions();
      res.json(prescriptions);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  // Get all prescriptions
  getAllPrescriptions = async (req: Request, res: Response): Promise<void> => {
    try {
      const { status } = req.query;
      const prescriptions = await this.prescriptionService.getAllPrescriptions(
        status as any
      );
      res.json(prescriptions);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  // Dispense prescription (pharmacy)
  dispensePrescription = async (
    req: AuthRequest,
    res: Response
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
      }

      const { id } = req.params;
      const prescription = await this.prescriptionService.dispensePrescription(
        id,
        req.user.id
      );
      res.json(prescription);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  // Cancel prescription
  cancelPrescription = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const prescription = await this.prescriptionService.cancelPrescription(
        id
      );
      res.json(prescription);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };
}
