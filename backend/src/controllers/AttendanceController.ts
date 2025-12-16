import { Request, Response } from "express";
import { AttendanceService } from "../services/AttendanceService";
import { AuthRequest } from "../middlewares/auth";

export class AttendanceController {
  private attendanceService = new AttendanceService();

  // Check in
  checkIn = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
      }

      const { location } = req.body;
      const attendance = await this.attendanceService.checkIn(
        req.user.id,
        location
      );
      res.json(attendance);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  // Check out
  checkOut = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
      }

      const { location } = req.body;
      const attendance = await this.attendanceService.checkOut(
        req.user.id,
        location
      );
      res.json(attendance);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  // Get today's status
  getTodayStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
      }

      const status = await this.attendanceService.getTodayStatus(req.user.id);
      res.json(status || { message: "No attendance record for today" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  // Get attendance history
  getHistory = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
      }

      const { startDate, endDate } = req.query;
      const history = await this.attendanceService.getAttendanceHistory(
        req.user.id,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json(history);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  // Get attendance report (admin)
  getReport = async (req: Request, res: Response): Promise<void> => {
    try {
      const { date } = req.query;
      const reportDate = date ? new Date(date as string) : new Date();
      const report = await this.attendanceService.getAttendanceReport(
        reportDate
      );
      res.json(report);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  // Create leave request
  createLeaveRequest = async (
    req: AuthRequest,
    res: Response
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
      }

      const request = await this.attendanceService.createLeaveRequest({
        userId: req.user.id,
        leaveType: req.body.leaveType,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
        reason: req.body.reason,
      });
      res.status(201).json(request);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  // Get leave requests
  getLeaveRequests = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
      }

      const { status } = req.query;
      const userId = req.user.role === "admin" ? undefined : req.user.id;
      const requests = await this.attendanceService.getLeaveRequests(
        userId,
        status as any
      );
      res.json(requests);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  // Approve/reject leave request
  processLeaveRequest = async (
    req: AuthRequest,
    res: Response
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
      }

      const { approved } = req.body;
      const request = await this.attendanceService.approveLeaveRequest(
        req.params.id,
        req.user.id,
        approved
      );
      res.json(request);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  // Get monthly summary
  getMonthlySummary = async (
    req: AuthRequest,
    res: Response
  ): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
      }

      const { year, month } = req.query;
      const now = new Date();
      const summary = await this.attendanceService.getMonthlySummary(
        req.user.id,
        year ? parseInt(year as string) : now.getFullYear(),
        month ? parseInt(month as string) : now.getMonth() + 1
      );
      res.json(summary);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };
}
