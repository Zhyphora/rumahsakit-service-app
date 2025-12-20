import { AppDataSource } from "../config/database";
import { MedicalRecord } from "../entities/MedicalRecord";

export class MedicalRecordService {
  private medRecordRepo = AppDataSource.getRepository(MedicalRecord);

  async findAll(options?: any) {
    return this.medRecordRepo.find({
      ...options,
      relations: [
        "patient",
        "doctor",
        "polyclinic",
        "prescriptions",
        "prescriptions.items",
        "prescriptions.items.item",
      ],
      order: { visitDate: "DESC" },
    });
  }

  async findOne(id: string) {
    return this.medRecordRepo.findOne({
      where: { id },
      relations: [
        "patient",
        "doctor",
        "polyclinic",
        "prescriptions",
        "prescriptions.items",
        "prescriptions.items.item",
      ],
    });
  }

  async create(data: Partial<MedicalRecord>) {
    const record = this.medRecordRepo.create(data);
    return this.medRecordRepo.save(record);
  }

  async findByPatientId(patientId: string) {
    return this.medRecordRepo.find({
      where: { patientId },
      relations: [
        "doctor",
        "polyclinic",
        "prescriptions",
        "prescriptions.items",
        "prescriptions.items.item",
      ],
      order: { visitDate: "DESC" },
    });
  }
}
