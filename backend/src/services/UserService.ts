import { AppDataSource } from "../config/database";
import { User } from "../entities/User";
import { Role } from "../entities/Role";
import { Staff } from "../entities/Staff";
import { Doctor } from "../entities/Doctor";
import * as bcrypt from "bcryptjs";
import { Polyclinic } from "../entities/Polyclinic"; // If needed for validation? Or just use relation?
// Assuming Polyclinic is used if passed, but maybe not strictly required to import if we just set relations. But better to be safe.
// Wait, to create Doctor with Polyclinic, we might need to fetch Polyclinic.
// Let's stick to basics first.

export class UserService {
  private userRepository = AppDataSource.getRepository(User);
  private roleRepository = AppDataSource.getRepository(Role);

  async findAll(page: number = 1, limit: number = 10, roleFilter?: string) {
    const query = this.userRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.role", "role")
      .leftJoinAndSelect("user.doctor", "doctor")
      .leftJoinAndSelect("doctor.polyclinic", "polyclinic")
      .leftJoinAndSelect("user.staff", "staff")
      .skip((page - 1) * limit)
      .take(limit);

    if (roleFilter && roleFilter !== "all") {
      query.where("role.name = :roleName", { roleName: roleFilter });
    }

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    return this.userRepository.findOne({
      where: { id },
      relations: ["role"],
    });
  }

  async updateRole(userId: string, roleName: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new Error("User not found");

    const role = await this.roleRepository.findOne({
      where: { name: roleName },
    });
    if (!role) throw new Error("Role not found");

    user.role = role;
    return this.userRepository.save(user);
  }

  async createUser(data: any) {
    const qr = AppDataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const { name, email, password, roleName, staffData, doctorData } = data;

      // Check if user exists
      const existing = await qr.manager.findOne(User, { where: { email } });
      if (existing) throw new Error("Email already registered");

      const role = await qr.manager.findOne(Role, {
        where: { name: roleName },
      });
      if (!role) throw new Error("Role not found");

      const user = new User();
      user.name = name;
      user.email = email;
      user.password = await bcrypt.hash(password, 10);
      user.role = role;

      const savedUser = await qr.manager.save(user);

      // Handle Staff Creation
      if (staffData && role.name !== "doctor" && role.name !== "patient") {
        const staff = new Staff();
        staff.user = savedUser;
        staff.department = staffData.department;
        staff.position = staffData.position;
        await qr.manager.save(staff);
      }

      // Handle Doctor Creation
      if (role.name === "doctor" && doctorData) {
        const doctor = new Doctor();
        doctor.user = savedUser;
        doctor.specialization = doctorData.specialization;
        doctor.licenseNumber = doctorData.licenseNumber;

        // Handle Schedule Logic
        if (doctorData.scheduleType) {
          const schedules: any = {
            pagi: {
              monday: { start: "08:00", end: "14:00" },
              tuesday: { start: "08:00", end: "14:00" },
              wednesday: { start: "08:00", end: "14:00" },
              thursday: { start: "08:00", end: "14:00" },
              friday: { start: "08:00", end: "12:00" },
            },
            siang: {
              monday: { start: "13:00", end: "20:00" },
              tuesday: { start: "13:00", end: "20:00" },
              wednesday: { start: "13:00", end: "20:00" },
              thursday: { start: "13:00", end: "20:00" },
              friday: { start: "13:00", end: "17:00" },
            },
            weekend: {
              saturday: { start: "09:00", end: "15:00" },
              sunday: { start: "10:00", end: "14:00" },
            },
          };
          if (schedules[doctorData.scheduleType]) {
            doctor.schedule = schedules[doctorData.scheduleType];
          }
        }

        await qr.manager.save(doctor);
      }

      await qr.commitTransaction();
      return savedUser;
    } catch (e) {
      await qr.rollbackTransaction();
      throw e;
    } finally {
      await qr.release();
    }
  }
}
