import { Request, Response } from "express";
import { PatientService } from "../services/PatientService";
import { PrescriptionService } from "../services/PrescriptionService";
import {
  sendSuccess,
  sendCreated,
  sendError,
  sendNotFound,
  sendServerError,
} from "../utils/response";

export class PatientController {
  private patientService = new PatientService();
  private prescriptionService = new PrescriptionService();

  getPatients = async (req: Request, res: Response): Promise<void> => {
    try {
      const { search } = req.query;
      const patients = await this.patientService.getPatients(search as string);
      sendSuccess(res, patients, "Patients retrieved successfully");
    } catch (error: any) {
      sendServerError(res, error, "Gagal memuat data pasien");
    }
  };

  getPatientById = async (req: Request, res: Response): Promise<void> => {
    try {
      const patient = await this.patientService.getPatientById(req.params.id);
      if (!patient) {
        sendNotFound(res, "Pasien tidak ditemukan");
        return;
      }
      sendSuccess(res, patient, "Patient retrieved successfully");
    } catch (error: any) {
      sendServerError(res, error, "Gagal memuat data pasien");
    }
  };

  createPatient = async (req: Request, res: Response): Promise<void> => {
    try {
      const patient = await this.patientService.createPatient(req.body);
      sendCreated(res, patient, "Pasien berhasil ditambahkan");
    } catch (error: any) {
      sendError(res, error.message || "Gagal menambah pasien");
    }
  };

  updatePatient = async (req: Request, res: Response): Promise<void> => {
    try {
      const patient = await this.patientService.updatePatient(
        req.params.id,
        req.body
      );
      if (!patient) {
        sendNotFound(res, "Pasien tidak ditemukan");
        return;
      }
      sendSuccess(res, patient, "Data pasien berhasil diperbarui");
    } catch (error: any) {
      sendError(res, error.message || "Gagal memperbarui data pasien");
    }
  };

  deletePatient = async (req: Request, res: Response): Promise<void> => {
    try {
      const { permanent } = req.query;
      const isPermanent = permanent === "true";

      if (isPermanent) {
        await this.patientService.deletePatient(req.params.id, true);
        sendSuccess(res, null, "Pasien berhasil dihapus permanen");
      } else {
        await this.patientService.softDeletePatient(req.params.id);
        sendSuccess(res, null, "Pasien berhasil dinonaktifkan");
      }
    } catch (error: any) {
      sendError(res, error.message || "Gagal menghapus pasien");
    }
  };

  searchByMRN = async (req: Request, res: Response): Promise<void> => {
    try {
      const { mrn } = req.params;
      const patient = await this.patientService.searchByMRN(mrn);
      if (!patient) {
        sendNotFound(res, "Pasien tidak ditemukan");
        return;
      }
      sendSuccess(res, patient, "Patient found");
    } catch (error: any) {
      sendServerError(res, error, "Gagal mencari pasien");
    }
  };

  // Get patient medical history (prescriptions + visits)
  getMedicalHistory = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // Get patient
      const patient = await this.patientService.getPatientById(id);
      if (!patient) {
        sendNotFound(res, "Pasien tidak ditemukan");
        return;
      }

      // Get prescriptions/medical history
      const prescriptions =
        await this.prescriptionService.getPatientMedicalHistory(id);

      const medicalHistory = prescriptions.map((p) => ({
        id: p.id,
        date: p.createdAt,
        diagnosis: p.diagnosis || "Tidak ada diagnosis",
        doctor: p.doctor?.user?.name || "Dokter",
        polyclinic: p.doctor?.polyclinic?.name || "Poliklinik",
        notes: p.notes,
        status: p.status,
        items:
          p.items?.map((item) => ({
            id: item.id,
            name: item.item?.name || "Obat",
            quantity: item.quantity,
            dosage: item.dosage,
            instructions: item.instructions,
          })) || [],
      }));

      sendSuccess(
        res,
        {
          patient,
          medicalHistory,
        },
        "Rekam medis berhasil dimuat"
      );
    } catch (error: any) {
      sendServerError(res, error, "Gagal memuat rekam medis");
    }
  };

  // Get my profile (for logged-in patient)
  getMyProfile = async (req: any, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        sendError(res, "Not authenticated");
        return;
      }
      const patient = await this.patientService.getPatientByUserId(req.user.id);
      if (!patient) {
        sendNotFound(res, "Profil pasien tidak ditemukan");
        return;
      }
      sendSuccess(res, patient, "Profil berhasil dimuat");
    } catch (error: any) {
      sendServerError(res, error, "Gagal memuat profil");
    }
  };
}
