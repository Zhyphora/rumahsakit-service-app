import { AppDataSource } from "../config/database";
import { Doctor } from "../entities/Doctor";
import { QueueNumber } from "../entities/QueueNumber";

export class DoctorService {
  private doctorRepository = AppDataSource.getRepository(Doctor);
  private queueNumberRepository = AppDataSource.getRepository(QueueNumber);

  // Get all doctors with their polyclinic
  async getAllDoctors() {
    return this.doctorRepository.find({
      relations: ["user", "polyclinic"],
      order: { user: { name: "ASC" } },
    });
  }

  // Get doctors available today (based on schedule)
  async getAvailableDoctors() {
    const today = new Date();
    const dayNames = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const todayName = dayNames[today.getDay()];

    const doctors = await this.doctorRepository.find({
      relations: ["user", "polyclinic"],
      order: { user: { name: "ASC" } },
    });

    // Filter doctors who have schedule today
    const availableDoctors = doctors.filter((doctor) => {
      if (!doctor.schedule) return true; // If no schedule defined, assume available
      // Schedule is a Record with day names as keys
      const todaySchedule = doctor.schedule[todayName];
      return !!todaySchedule;
    });

    // Get current serving status for each doctor
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const doctorsWithStatus = await Promise.all(
      availableDoctors.map(async (doctor) => {
        // Check if doctor is currently serving someone
        const servingQueue = await this.queueNumberRepository.findOne({
          where: {
            doctorId: doctor.id,
            queueDate: todayStart,
            status: "serving",
          },
          relations: ["patient"],
        });

        // Count completed today
        const completedCount = await this.queueNumberRepository.count({
          where: {
            doctorId: doctor.id,
            queueDate: todayStart,
            status: "completed",
          },
        });

        return {
          id: doctor.id,
          name: doctor.user.name,
          specialization: doctor.specialization,
          polyclinic: doctor.polyclinic,
          schedule: doctor.schedule?.[todayName]
            ? `${doctor.schedule[todayName].start} - ${doctor.schedule[todayName].end}`
            : "Tersedia",
          isServing: !!servingQueue,
          currentPatient: servingQueue?.patient?.name || null,
          completedToday: completedCount,
        };
      })
    );

    return doctorsWithStatus;
  }

  // Get doctor by ID with details
  async getDoctorById(id: string) {
    return this.doctorRepository.findOne({
      where: { id },
      relations: ["user", "polyclinic"],
    });
  }

  // Get doctor queue display data for public monitor
  async getDoctorQueueDisplay() {
    const today = new Date();
    const dayNames = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const todayName = dayNames[today.getDay()];
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const doctors = await this.doctorRepository.find({
      relations: ["user", "polyclinic"],
      order: { user: { name: "ASC" } },
    });

    // Filter doctors who have schedule today
    const availableDoctors = doctors.filter((doctor) => {
      if (!doctor.schedule) return true;
      const todaySchedule = doctor.schedule[todayName];
      return !!todaySchedule;
    });

    const displayData = await Promise.all(
      availableDoctors.map(async (doctor) => {
        // Get current queue being served
        const servingQueue = await this.queueNumberRepository.findOne({
          where: {
            doctorId: doctor.id,
            queueDate: todayStart,
            status: "serving",
          },
          relations: ["patient"],
        });

        // Get called queue
        const calledQueue = await this.queueNumberRepository.findOne({
          where: {
            doctorId: doctor.id,
            queueDate: todayStart,
            status: "called",
          },
          relations: ["patient"],
          order: { calledTime: "DESC" },
        });

        // Count waiting
        const waitingCount = await this.queueNumberRepository.count({
          where: {
            doctorId: doctor.id,
            queueDate: todayStart,
            status: "waiting",
          },
        });

        const currentQueue = servingQueue || calledQueue;

        return {
          doctor: {
            id: doctor.id,
            name: doctor.user.name,
            specialization: doctor.specialization,
          },
          polyclinic: doctor.polyclinic,
          currentNumber: currentQueue?.queueNumber || 0,
          currentPatient: currentQueue?.patient?.name || null,
          status: servingQueue ? "serving" : calledQueue ? "called" : "waiting",
          waitingCount,
          schedule: doctor.schedule?.[todayName]
            ? `${doctor.schedule[todayName].start} - ${doctor.schedule[todayName].end}`
            : "Tersedia",
        };
      })
    );

    return displayData;
  }
}
