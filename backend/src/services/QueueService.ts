import { AppDataSource } from "../config/database";
import { QueueNumber, QueueStatus } from "../entities/QueueNumber";
import { QueueCounter } from "../entities/QueueCounter";
import { Patient } from "../entities/Patient";
import { Polyclinic } from "../entities/Polyclinic";
import {
  broadcastQueueUpdate,
  broadcastQueueCalled,
} from "../config/websocket";

export class QueueService {
  private queueNumberRepository = AppDataSource.getRepository(QueueNumber);
  private queueCounterRepository = AppDataSource.getRepository(QueueCounter);
  private patientRepository = AppDataSource.getRepository(Patient);
  private polyclinicRepository = AppDataSource.getRepository(Polyclinic);

  // Get or create counter for today
  private async getOrCreateCounter(
    polyclinicId: string
  ): Promise<QueueCounter> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let counter = await this.queueCounterRepository.findOne({
      where: {
        polyclinicId,
        counterDate: today,
      },
    });

    if (!counter) {
      counter = this.queueCounterRepository.create({
        polyclinicId,
        counterDate: today,
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
  }) {
    // Find or create patient
    let patient: Patient | null = null;

    if (data.patientId) {
      patient = await this.patientRepository.findOne({
        where: { id: data.patientId },
      });
    } else if (data.patientName) {
      // Create walk-in patient
      const mrn = "WI-" + Date.now().toString();
      patient = this.patientRepository.create({
        name: data.patientName,
        medicalRecordNumber: mrn,
        phone: data.patientPhone,
      });
      await this.patientRepository.save(patient);
    }

    if (!patient) {
      throw new Error("Patient information required");
    }

    // Get counter and increment
    const counter = await this.getOrCreateCounter(data.polyclinicId);
    counter.lastNumber += 1;
    await this.queueCounterRepository.save(counter);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Create queue number
    const queueNumber = this.queueNumberRepository.create({
      polyclinicId: data.polyclinicId,
      patientId: patient.id,
      queueNumber: counter.lastNumber,
      queueDate: today,
      status: "waiting",
      checkInTime: new Date(),
    });

    await this.queueNumberRepository.save(queueNumber);

    // Load relations for response
    const savedQueue = await this.queueNumberRepository.findOne({
      where: { id: queueNumber.id },
      relations: ["polyclinic", "patient"],
    });

    // Broadcast update
    await this.broadcastQueueState(data.polyclinicId);

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
}
