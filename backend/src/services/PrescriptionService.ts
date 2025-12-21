import { AppDataSource } from "../config/database";
import { Prescription, PrescriptionStatus } from "../entities/Prescription";
import { PrescriptionItem } from "../entities/PrescriptionItem";
import { Item } from "../entities/Item";
import { StockMovement } from "../entities/StockMovement";
import { MedicalRecord } from "../entities/MedicalRecord";
import { QueueNumber } from "../entities/QueueNumber";
import {
  broadcastMedicalRecordUpdate,
  broadcastPrescriptionUpdate,
} from "../config/websocket";

interface CreatePrescriptionDto {
  queueNumberId?: string;
  patientId: string;
  doctorId: string;
  diagnosis?: string;
  actions?: string;
  notes?: string;
  items: {
    itemId: string;
    quantity: number;
    dosage?: string;
    instructions?: string;
  }[];
}

export class PrescriptionService {
  private prescriptionRepository = AppDataSource.getRepository(Prescription);
  private prescriptionItemRepository =
    AppDataSource.getRepository(PrescriptionItem);
  private itemRepository = AppDataSource.getRepository(Item);
  private stockMovementRepository = AppDataSource.getRepository(StockMovement);
  private medicalRecordRepository = AppDataSource.getRepository(MedicalRecord);
  private queueNumberRepository = AppDataSource.getRepository(QueueNumber);

  // Create new prescription
  async createPrescription(data: CreatePrescriptionDto): Promise<Prescription> {
    // First, create a medical record for this visit
    let polyclinicId: string | undefined;

    // Get polyclinic from queue if available
    if (data.queueNumberId) {
      const queue = await this.queueNumberRepository.findOne({
        where: { id: data.queueNumberId },
      });
      polyclinicId = queue?.polyclinicId;
    }

    // Create medical record
    const medicalRecord = this.medicalRecordRepository.create({
      patientId: data.patientId,
      doctorId: data.doctorId,
      polyclinicId: polyclinicId,
      visitDate: new Date(),
      diagnosis: data.diagnosis || "Pemeriksaan",
      actions: data.actions,
      notes: data.notes,
    });
    const savedMedicalRecord = await this.medicalRecordRepository.save(
      medicalRecord
    );

    // Create prescription linked to medical record
    const prescription = this.prescriptionRepository.create({
      queueNumberId: data.queueNumberId,
      patientId: data.patientId,
      doctorId: data.doctorId,
      medicalRecordId: savedMedicalRecord.id,
      diagnosis: data.diagnosis,
      notes: data.notes,
      status: "pending",
    });

    const savedPrescription = await this.prescriptionRepository.save(
      prescription
    );

    // Create prescription items
    const items = data.items.map((itemData) =>
      this.prescriptionItemRepository.create({
        prescriptionId: savedPrescription.id,
        itemId: itemData.itemId,
        quantity: itemData.quantity,
        dosage: itemData.dosage,
        instructions: itemData.instructions,
      })
    );

    await this.prescriptionItemRepository.save(items);

    // Broadcast update to patient dashboard
    broadcastPrescriptionUpdate(data.patientId, {
      prescriptionId: savedPrescription.id,
    });
    broadcastMedicalRecordUpdate(data.patientId, {
      type: "prescription_created",
      medicalRecordId: savedMedicalRecord.id,
    });

    return this.getPrescriptionById(
      savedPrescription.id
    ) as Promise<Prescription>;
  }

  // Get prescription by ID
  async getPrescriptionById(id: string): Promise<Prescription | null> {
    return this.prescriptionRepository.findOne({
      where: { id },
      relations: [
        "patient",
        "doctor",
        "doctor.user",
        "items",
        "items.item",
        "dispenser",
      ],
    });
  }

  // Get prescriptions by patient (medical record history)
  async getPatientMedicalHistory(patientId: string): Promise<Prescription[]> {
    return this.prescriptionRepository.find({
      where: { patientId },
      relations: ["doctor", "doctor.user", "items", "items.item"],
      order: { createdAt: "DESC" },
    });
  }

  // Get my prescriptions (by user id - finds patient first)
  async getMyPrescriptions(userId: string): Promise<Prescription[]> {
    // Import Patient repository
    const { Patient } = require("../entities/Patient");
    const patientRepo = AppDataSource.getRepository(Patient);

    const patient = await patientRepo.findOne({ where: { userId } });
    if (!patient) {
      return [];
    }

    return this.prescriptionRepository.find({
      where: { patientId: patient.id },
      relations: [
        "doctor",
        "doctor.user",
        "doctor.polyclinic",
        "items",
        "items.item",
      ],
      order: { createdAt: "DESC" },
    });
  }

  // Get pending prescriptions for pharmacy
  async getPendingPrescriptions(): Promise<Prescription[]> {
    return this.prescriptionRepository.find({
      where: { status: "pending" },
      relations: ["patient", "doctor", "doctor.user", "items", "items.item"],
      order: { createdAt: "ASC" },
    });
  }

  // Get all prescriptions with optional status filter
  async getAllPrescriptions(
    status?: PrescriptionStatus
  ): Promise<Prescription[]> {
    const where: any = {};
    if (status) where.status = status;

    return this.prescriptionRepository.find({
      where,
      relations: [
        "patient",
        "doctor",
        "doctor.user",
        "items",
        "items.item",
        "dispenser",
      ],
      order: { createdAt: "DESC" },
    });
  }

  // Dispense prescription (pharmacy)
  async dispensePrescription(
    id: string,
    pharmacistId: string
  ): Promise<Prescription> {
    const prescription = await this.prescriptionRepository.findOne({
      where: { id },
      relations: ["items"],
    });

    if (!prescription) {
      throw new Error("Prescription not found");
    }

    if (prescription.status !== "pending") {
      throw new Error("Prescription already processed");
    }

    // Update stock for each item
    for (const prescItem of prescription.items) {
      const item = await this.itemRepository.findOne({
        where: { id: prescItem.itemId },
      });

      if (!item) {
        throw new Error(`Item not found: ${prescItem.itemId}`);
      }

      if (item.currentStock < prescItem.quantity) {
        throw new Error(`Insufficient stock for: ${item.name}`);
      }

      // Decrease stock
      item.currentStock -= prescItem.quantity;
      await this.itemRepository.save(item);

      // Create stock movement record
      const movement = this.stockMovementRepository.create({
        itemId: item.id,
        movementType: "out",
        quantity: prescItem.quantity,
        referenceType: "prescription",
        referenceId: prescription.id,
        notes: `Prescription dispensed`,
        createdBy: pharmacistId,
      });
      await this.stockMovementRepository.save(movement);
    }

    // Update prescription status
    prescription.status = "completed";
    prescription.dispensedBy = pharmacistId;
    prescription.dispensedAt = new Date();

    const savedPrescription = await this.prescriptionRepository.save(
      prescription
    );

    // Broadcast update to patient
    broadcastPrescriptionUpdate(prescription.patientId, {
      prescriptionId: prescription.id,
      status: "completed",
    });
    broadcastMedicalRecordUpdate(prescription.patientId, {
      type: "prescription_dispensed",
    });

    return savedPrescription;
  }

  // Cancel prescription
  async cancelPrescription(id: string): Promise<Prescription> {
    const prescription = await this.prescriptionRepository.findOne({
      where: { id },
    });

    if (!prescription) {
      throw new Error("Prescription not found");
    }

    if (prescription.status === "completed") {
      throw new Error("Cannot cancel completed prescription");
    }

    prescription.status = "cancelled";
    return this.prescriptionRepository.save(prescription);
  }
}
