import { AppDataSource } from "../config/database";
import { QueueNumber, QueueStatus } from "../entities/QueueNumber";
import { QueueCounter } from "../entities/QueueCounter";
import { Patient } from "../entities/Patient";
import { Polyclinic } from "../entities/Polyclinic";
import {
  broadcastQueueUpdate,
  broadcastQueueCalled,
  broadcastMedicalRecordUpdate,
} from "../config/websocket";

import { User } from "../entities/User";
import { Role } from "../entities/Role";
import * as bcrypt from "bcryptjs";

export class QueueService {
  private queueNumberRepository = AppDataSource.getRepository(QueueNumber);
  private queueCounterRepository = AppDataSource.getRepository(QueueCounter);
  private patientRepository = AppDataSource.getRepository(Patient);
  private polyclinicRepository = AppDataSource.getRepository(Polyclinic);
  private userRepository = AppDataSource.getRepository(User);
  private roleRepository = AppDataSource.getRepository(Role);

  // Get or create counter for specific date
  private async getOrCreateCounter(
    polyclinicId: string,
    date: Date
  ): Promise<QueueCounter> {
    // Normalize date to start of day
    const counterDate = new Date(date);
    counterDate.setHours(0, 0, 0, 0);

    let counter = await this.queueCounterRepository.findOne({
      where: {
        polyclinicId,
        counterDate,
      },
    });

    if (!counter) {
      counter = this.queueCounterRepository.create({
        polyclinicId,
        counterDate,
        lastNumber: 0,
      });
      await this.queueCounterRepository.save(counter);
    }

    return counter;
  }

  // Take a new queue number
  async takeNumber(data: {
    polyclinicId: string;
    patientId?: string;
    patientName?: string;
    patientPhone?: string;
    doctorId?: string;
    bpjsNumber?: string;
    queueDate?: string; // Optional future date YYYY-MM-DD
    // password removed
  }) {
    // Find or create patient
    let patient: Patient | null = null;

    if (data.patientId) {
      patient = await this.patientRepository.findOne({
        where: { id: data.patientId },
      });
    } else if (data.bpjsNumber && !data.patientName) {
      // Existing patient lookup by BPJS (Only if name not provided, meaning it's "Pasien Lama" tab intent)
      // Actually frontend sends name for new patients. unique distinction: name/phone is present for new.
      // But verify logic:
      patient = await this.patientRepository.findOne({
        where: { bpjsNumber: data.bpjsNumber },
      });
      if (!patient) {
        throw new Error(
          "Data pasien tidak ditemukan. Silakan daftar sebagai pasien baru."
        );
      }
    } else if (data.patientName && data.patientPhone) {
      // Register New Patient (Always create user now if not exists)
      const generatedEmail = `${data.patientPhone}@mediku.com`;

      // Check if user exists
      let user = await this.userRepository.findOne({
        where: { email: generatedEmail },
      });

      if (!user) {
        // Create new user with Phone as password (default)
        const patientRole = await this.roleRepository.findOne({
          where: { name: "patient" },
        });
        if (!patientRole) throw new Error("Role patient not found");

        const hashedPassword = await bcrypt.hash(data.patientPhone, 10);

        user = this.userRepository.create({
          name: data.patientName,
          email: generatedEmail,
          password: hashedPassword,
          role: patientRole,
          phone: data.patientPhone,
        });

        await this.userRepository.save(user);
      }

      // Check if patient record exists for this user?
      // Or just create new patient record linked to user?
      // If we found the user, they might already have a patient record.
      // But "Pasien Baru" implies we want to create one.
      // Let's check matching patient by user_id
      patient = await this.patientRepository.findOne({
        where: { userId: user.id },
      });

      if (!patient) {
        const mrn = "REG-" + Date.now().toString();
        patient = this.patientRepository.create({
          user: user,
          name: data.patientName,
          medicalRecordNumber: mrn,
          phone: data.patientPhone,
          bpjsNumber: data.bpjsNumber,
        });
        await this.patientRepository.save(patient);
      }
    } else if (data.patientName) {
      // Fallback walk-in without phone? Rare case given frontend validation.
      const mrn = "WI-" + Date.now().toString();
      patient = this.patientRepository.create({
        name: data.patientName,
        medicalRecordNumber: mrn,
        phone: data.patientPhone,
        bpjsNumber: data.bpjsNumber,
      });
      await this.patientRepository.save(patient);
    }

    if (!patient) {
      throw new Error("Informasi pasien tidak lengkap.");
    }

    // specific date or today
    const targetDate = data.queueDate ? new Date(data.queueDate) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    // Get counter and increment
    const counter = await this.getOrCreateCounter(
      data.polyclinicId,
      targetDate
    );
    counter.lastNumber += 1;
    await this.queueCounterRepository.save(counter);

    // Create queue number with optional doctor assignment
    const queueNumber = this.queueNumberRepository.create({
      polyclinicId: data.polyclinicId,
      patientId: patient.id,
      doctorId: data.doctorId || undefined,
      queueNumber: counter.lastNumber,
      queueDate: targetDate,
      status: "waiting",
      checkInTime: new Date(),
    });

    await this.queueNumberRepository.save(queueNumber);

    // Load relations for response
    const savedQueue = await this.queueNumberRepository.findOne({
      where: { id: queueNumber.id },
      relations: ["polyclinic", "patient", "doctor", "doctor.user"],
    });

    // Broadcast update only if it's for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (targetDate.getTime() === today.getTime()) {
      await this.broadcastQueueState(data.polyclinicId);
    }

    return savedQueue;
  }

  // Get queue for a polyclinic
  async getPolyclinicQueue(polyclinicId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const queue = await this.queueNumberRepository.find({
      where: {
        polyclinicId,
        queueDate: today,
      },
      relations: ["patient", "doctor"],
      order: { queueNumber: "ASC" },
    });

    const polyclinic = await this.polyclinicRepository.findOne({
      where: { id: polyclinicId },
    });

    const currentlyServing = queue.find((q) => q.status === "serving");
    const lastCalled = queue.filter((q) => q.status === "called").pop();
    const waiting = queue.filter((q) => q.status === "waiting");
    const completed = queue.filter((q) => q.status === "completed");
    const skipped = queue.filter((q) => q.status === "skipped");

    return {
      polyclinic,
      currentlyServing,
      lastCalled,
      waiting,
      completed,
      skipped,
      total: queue.length,
    };
  }

  // Call next number
  async callNumber(queueId: string, doctorId?: string) {
    const queue = await this.queueNumberRepository.findOne({
      where: { id: queueId },
      relations: ["polyclinic", "patient"],
    });

    if (!queue) {
      throw new Error("Queue not found");
    }

    queue.status = "called";
    queue.calledTime = new Date();
    if (doctorId) {
      queue.doctorId = doctorId;
    }

    await this.queueNumberRepository.save(queue);

    // Broadcast call
    broadcastQueueCalled(queue.polyclinicId, {
      queueNumber: queue.queueNumber,
      polyclinic: queue.polyclinic,
      patient: queue.patient,
    });

    await this.broadcastQueueState(queue.polyclinicId);

    return queue;
  }

  // Start serving
  async serveNumber(queueId: string) {
    const queue = await this.queueNumberRepository.findOne({
      where: { id: queueId },
      relations: ["polyclinic", "patient"],
    });

    if (!queue) {
      throw new Error("Queue not found");
    }

    queue.status = "serving";
    queue.servedTime = new Date();

    await this.queueNumberRepository.save(queue);
    await this.broadcastQueueState(queue.polyclinicId);

    return queue;
  }

  // Complete serving
  async completeNumber(queueId: string, notes?: string) {
    const queue = await this.queueNumberRepository.findOne({
      where: { id: queueId },
      relations: ["polyclinic", "patient"],
    });

    if (!queue) {
      throw new Error("Queue not found");
    }

    queue.status = "completed";
    queue.completedTime = new Date();
    if (notes) {
      queue.notes = notes;
    }

    await this.queueNumberRepository.save(queue);
    await this.broadcastQueueState(queue.polyclinicId);

    // Broadcast medical record update to patient
    if (queue.patientId) {
      broadcastMedicalRecordUpdate(queue.patientId, {
        type: "queue_completed",
        queueId: queue.id,
      });
    }

    return queue;
  }

  // Skip number
  async skipNumber(queueId: string, notes?: string) {
    const queue = await this.queueNumberRepository.findOne({
      where: { id: queueId },
      relations: ["polyclinic", "patient"],
    });

    if (!queue) {
      throw new Error("Queue not found");
    }

    queue.status = "skipped";
    if (notes) {
      queue.notes = notes;
    }

    await this.queueNumberRepository.save(queue);
    await this.broadcastQueueState(queue.polyclinicId);

    return queue;
  }

  // Get display data (for TV/public display)
  async getDisplayData() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const polyclinics = await this.polyclinicRepository.find({
      where: { isActive: true },
    });

    const displayData = await Promise.all(
      polyclinics.map(async (poly) => {
        const queue = await this.queueNumberRepository.find({
          where: {
            polyclinicId: poly.id,
            queueDate: today,
          },
          relations: ["patient"],
          order: { queueNumber: "ASC" },
        });

        const currentlyServing = queue.find((q) => q.status === "serving");
        const lastCalled = queue.filter((q) => q.status === "called").pop();
        const waitingCount = queue.filter((q) => q.status === "waiting").length;

        return {
          polyclinic: poly,
          currentNumber:
            currentlyServing?.queueNumber || lastCalled?.queueNumber || 0,
          waitingCount,
          status: currentlyServing
            ? "serving"
            : lastCalled
            ? "called"
            : "waiting",
        };
      })
    );

    return displayData;
  }

  // Broadcast queue state update
  private async broadcastQueueState(polyclinicId: string) {
    const queueState = await this.getPolyclinicQueue(polyclinicId);
    broadcastQueueUpdate(polyclinicId, queueState);
  }

  // Get all polyclinics
  async getPolyclinics() {
    return this.polyclinicRepository.find({
      where: { isActive: true },
      order: { name: "ASC" },
    });
  }

  // Get my queue (for patient)
  async getMyQueue(userId: string) {
    // Find patient by userId
    const patient = await this.patientRepository.findOne({
      where: { userId },
    });

    if (!patient) {
      return [];
    }

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find queues for this patient (today and future)
    const queues = await this.queueNumberRepository.find({
      where: {
        patientId: patient.id,
      },
      relations: ["polyclinic", "doctor", "doctor.user"],
      order: { queueDate: "DESC", queueNumber: "ASC" },
    });

    // Filter to show only today and future queues that are not completed
    const activeQueues = queues.filter((q) => {
      const queueDate = new Date(q.queueDate);
      queueDate.setHours(0, 0, 0, 0);
      return (
        queueDate >= today &&
        q.status !== "completed" &&
        q.status !== "cancelled"
      );
    });

    return activeQueues;
  }
}
