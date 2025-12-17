import { AppDataSource } from "../config/database";
import { Patient } from "../entities/Patient";

export class PatientService {
  private patientRepository = AppDataSource.getRepository(Patient);

  async getPatients(search?: string) {
    const query = this.patientRepository.createQueryBuilder("patient");

    if (search) {
      query.where(
        "(patient.name ILIKE :search OR patient.medical_record_number ILIKE :search OR patient.phone ILIKE :search)",
        { search: `%${search}%` }
      );
    }

    return query.orderBy("patient.name", "ASC").getMany();
  }

  async getPatientById(id: string) {
    return this.patientRepository.findOne({
      where: { id },
      relations: ["queueNumbers", "documents"],
    });
  }

  async createPatient(data: Partial<Patient>) {
    // Generate MRN if not provided
    if (!data.medicalRecordNumber) {
      const lastPatient = await this.patientRepository
        .createQueryBuilder("patient")
        .orderBy("patient.created_at", "DESC")
        .getOne();

      const lastNum = lastPatient
        ? parseInt(lastPatient.medicalRecordNumber.replace("RM-", "")) || 0
        : 0;
      data.medicalRecordNumber = `RM-${String(lastNum + 1).padStart(3, "0")}`;
    }

    const patient = this.patientRepository.create(data);
    return this.patientRepository.save(patient);
  }

  async updatePatient(id: string, data: Partial<Patient>) {
    const patient = await this.patientRepository.findOne({ where: { id } });
    if (!patient) {
      return null;
    }

    Object.assign(patient, data);
    return this.patientRepository.save(patient);
  }

  // Soft delete - just marks as inactive by appending _DELETED to MRN
  async softDeletePatient(id: string) {
    const patient = await this.patientRepository.findOne({ where: { id } });
    if (!patient) {
      throw new Error("Patient not found");
    }

    // Mark as deleted by modifying MRN
    if (!patient.medicalRecordNumber.includes("_DELETED")) {
      patient.medicalRecordNumber = `${
        patient.medicalRecordNumber
      }_DELETED_${Date.now()}`;
    }

    return this.patientRepository.save(patient);
  }

  // Permanent delete
  async deletePatient(id: string, permanent: boolean = false) {
    const patient = await this.patientRepository.findOne({ where: { id } });
    if (!patient) {
      throw new Error("Patient not found");
    }

    if (permanent) {
      return this.patientRepository.remove(patient);
    } else {
      return this.softDeletePatient(id);
    }
  }

  async searchByMRN(mrn: string) {
    return this.patientRepository.findOne({
      where: { medicalRecordNumber: mrn },
    });
  }
}
