import { Request, Response } from "express";
import { MedicalRecordService } from "../services/MedicalRecordService";
import { AppDataSource } from "../config/database";
import { Patient } from "../entities/Patient";

const recordService = new MedicalRecordService();
const patientRepo = AppDataSource.getRepository(Patient);

export class MedicalRecordController {
  async getMyRecords(req: Request, res: Response) {
    try {
      // Find patient profile for current user
      const patient = await patientRepo.findOne({
        where: { userId: req.user.id },
      });
      if (!patient) {
        return res.status(404).json({ message: "Patient profile not found" });
      }

      const records = await recordService.findByPatientId(patient.id);
      res.json(records);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error fetching medical records", error });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const records = await recordService.findAll();
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: "Error fetching records" });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const record = await recordService.findOne(req.params.id);
      if (!record) return res.status(404).json({ message: "Record not found" });
      res.json(record);
    } catch (error) {
      res.status(500).json({ message: "Error fetching record" });
    }
  }
}
