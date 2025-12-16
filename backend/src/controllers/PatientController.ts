import { Request, Response } from "express";
import { PatientService } from "../services/PatientService";

export class PatientController {
  private patientService = new PatientService();

  getPatients = async (req: Request, res: Response): Promise<void> => {
    try {
      const { search } = req.query;
      const patients = await this.patientService.getPatients(search as string);
      res.json(patients);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  getPatientById = async (req: Request, res: Response): Promise<void> => {
    try {
      const patient = await this.patientService.getPatientById(req.params.id);
      if (!patient) {
        res.status(404).json({ message: "Patient not found" });
        return;
      }
      res.json(patient);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  createPatient = async (req: Request, res: Response): Promise<void> => {
    try {
      const patient = await this.patientService.createPatient(req.body);
      res.status(201).json(patient);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  updatePatient = async (req: Request, res: Response): Promise<void> => {
    try {
      const patient = await this.patientService.updatePatient(
        req.params.id,
        req.body
      );
      res.json(patient);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  deletePatient = async (req: Request, res: Response): Promise<void> => {
    try {
      await this.patientService.deletePatient(req.params.id);
      res.json({ message: "Patient deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  searchByMRN = async (req: Request, res: Response): Promise<void> => {
    try {
      const { mrn } = req.params;
      const patient = await this.patientService.searchByMRN(mrn);
      if (!patient) {
        res.status(404).json({ message: "Patient not found" });
        return;
      }
      res.json(patient);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };
}
