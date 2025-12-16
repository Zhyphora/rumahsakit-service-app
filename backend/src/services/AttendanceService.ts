import { AppDataSource } from "../config/database";
import { Attendance, AttendanceStatus } from "../entities/Attendance";
import { LeaveRequest, LeaveStatus } from "../entities/LeaveRequest";
import { Between, LessThanOrEqual, MoreThanOrEqual } from "typeorm";
import * as fs from "fs";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";

export class AttendanceService {
  private attendanceRepository = AppDataSource.getRepository(Attendance);
  private leaveRequestRepository = AppDataSource.getRepository(LeaveRequest);

  // Save base64 photo to disk
  private savePhoto(base64Data: string): string {
    const matches = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
      throw new Error("Invalid image data");
    }

    const ext = matches[1];
    const data = matches[2];
    const filename = `${uuidv4()}.${ext}`;
    const uploadDir = path.join(__dirname, "../../uploads/attendance");

    // Create directory if not exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filepath = path.join(uploadDir, filename);
    fs.writeFileSync(filepath, Buffer.from(data, "base64"));

    return `/uploads/attendance/${filename}`;
  }

  // Check in
  async checkIn(
    userId: string,
    location?: { lat: number; lng: number },
    photo?: string
  ) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already checked in today
    const existing = await this.attendanceRepository.findOne({
      where: { userId, attendanceDate: today },
    });

    if (existing && existing.checkIn) {
      throw new Error("Already checked in today");
    }

    const now = new Date();
    const checkInHour = now.getHours();

    // Determine status based on check-in time (late if after 9 AM)
    const status: AttendanceStatus = checkInHour >= 9 ? "late" : "present";

    // Save photo if provided
    let photoPath: string | undefined;
    if (photo) {
      photoPath = this.savePhoto(photo);
    }

    if (existing) {
      existing.checkIn = now;
      existing.checkInLocation = location;
      existing.checkInPhoto = photoPath;
      existing.status = status;
      return this.attendanceRepository.save(existing);
    }

    const attendance = this.attendanceRepository.create({
      userId,
      attendanceDate: today,
      checkIn: now,
      checkInLocation: location,
      checkInPhoto: photoPath,
      status,
    });

    return this.attendanceRepository.save(attendance);
  }

  // Check out
  async checkOut(
    userId: string,
    location?: { lat: number; lng: number },
    photo?: string
  ) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await this.attendanceRepository.findOne({
      where: { userId, attendanceDate: today },
    });

    if (!attendance) {
      throw new Error("No check-in record found for today");
    }

    if (attendance.checkOut) {
      throw new Error("Already checked out today");
    }

    // Save photo if provided
    let photoPath: string | undefined;
    if (photo) {
      photoPath = this.savePhoto(photo);
    }

    attendance.checkOut = new Date();
    attendance.checkOutLocation = location;
    attendance.checkOutPhoto = photoPath;

    return this.attendanceRepository.save(attendance);
  }

  // Get today's attendance status
  async getTodayStatus(userId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.attendanceRepository.findOne({
      where: { userId, attendanceDate: today },
    });
  }

  // Get attendance history
  async getAttendanceHistory(userId: string, startDate?: Date, endDate?: Date) {
    const where: any = { userId };

    if (startDate && endDate) {
      where.attendanceDate = Between(startDate, endDate);
    } else if (startDate) {
      where.attendanceDate = MoreThanOrEqual(startDate);
    } else if (endDate) {
      where.attendanceDate = LessThanOrEqual(endDate);
    }

    return this.attendanceRepository.find({
      where,
      order: { attendanceDate: "DESC" },
    });
  }

  // Get attendance report (for admin)
  async getAttendanceReport(date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const attendances = await this.attendanceRepository.find({
      where: { attendanceDate: startOfDay },
      relations: ["user"],
      order: { checkIn: "ASC" },
    });

    const summary = {
      date: startOfDay,
      total: attendances.length,
      present: attendances.filter((a) => a.status === "present").length,
      late: attendances.filter((a) => a.status === "late").length,
      absent: attendances.filter((a) => a.status === "absent").length,
      leave: attendances.filter((a) => a.status === "leave").length,
      sick: attendances.filter((a) => a.status === "sick").length,
      attendances,
    };

    return summary;
  }

  // Leave Requests
  async createLeaveRequest(data: {
    userId: string;
    leaveType: "annual" | "sick" | "emergency";
    startDate: Date;
    endDate: Date;
    reason?: string;
  }) {
    // Check for overlapping leave requests
    const existing = await this.leaveRequestRepository.findOne({
      where: {
        userId: data.userId,
        status: "pending",
        startDate: LessThanOrEqual(data.endDate),
        endDate: MoreThanOrEqual(data.startDate),
      },
    });

    if (existing) {
      throw new Error("Overlapping leave request already exists");
    }

    const leaveRequest = this.leaveRequestRepository.create(data);
    return this.leaveRequestRepository.save(leaveRequest);
  }

  async getLeaveRequests(userId?: string, status?: LeaveStatus) {
    const where: any = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;

    return this.leaveRequestRepository.find({
      where,
      relations: ["user", "approver"],
      order: { createdAt: "DESC" },
    });
  }

  async approveLeaveRequest(
    requestId: string,
    approverId: string,
    approved: boolean
  ) {
    const request = await this.leaveRequestRepository.findOne({
      where: { id: requestId },
    });

    if (!request) {
      throw new Error("Leave request not found");
    }

    if (request.status !== "pending") {
      throw new Error("Leave request already processed");
    }

    request.status = approved ? "approved" : "rejected";
    request.approvedBy = approverId;
    request.approvedAt = new Date();

    // If approved, create attendance records for leave days
    if (approved) {
      const startDate = new Date(request.startDate);
      const endDate = new Date(request.endDate);

      for (
        let date = startDate;
        date <= endDate;
        date.setDate(date.getDate() + 1)
      ) {
        const attendanceDate = new Date(date);
        attendanceDate.setHours(0, 0, 0, 0);

        const existingAttendance = await this.attendanceRepository.findOne({
          where: { userId: request.userId, attendanceDate },
        });

        if (!existingAttendance) {
          const attendance = this.attendanceRepository.create({
            userId: request.userId,
            attendanceDate,
            status: request.leaveType === "sick" ? "sick" : "leave",
            notes: `Leave: ${request.leaveType} - ${request.reason || ""}`,
          });
          await this.attendanceRepository.save(attendance);
        }
      }
    }

    return this.leaveRequestRepository.save(request);
  }

  // Get monthly summary
  async getMonthlySummary(userId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const attendances = await this.attendanceRepository.find({
      where: {
        userId,
        attendanceDate: Between(startDate, endDate),
      },
    });

    return {
      year,
      month,
      totalDays: endDate.getDate(),
      present: attendances.filter((a) => a.status === "present").length,
      late: attendances.filter((a) => a.status === "late").length,
      absent: attendances.filter((a) => a.status === "absent").length,
      leave: attendances.filter((a) => a.status === "leave").length,
      sick: attendances.filter((a) => a.status === "sick").length,
      attendances,
    };
  }
}
