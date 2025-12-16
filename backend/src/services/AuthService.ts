import { AppDataSource } from "../config/database";
import { User } from "../entities/User";
import { Doctor } from "../entities/Doctor";
import { Staff } from "../entities/Staff";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);
  private doctorRepository = AppDataSource.getRepository(Doctor);
  private staffRepository = AppDataSource.getRepository(Staff);

  async register(data: {
    email: string;
    password: string;
    name: string;
    role: "doctor" | "staff" | "patient";
    phone?: string;
    doctorData?: {
      specialization: string;
      licenseNumber?: string;
      polyclinicId?: string;
    };
    staffData?: {
      department?: string;
      position?: string;
    };
  }) {
    const existingUser = await this.userRepository.findOne({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error("Email already registered");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = this.userRepository.create({
      email: data.email,
      password: hashedPassword,
      name: data.name,
      role: data.role,
      phone: data.phone,
    });

    await this.userRepository.save(user);

    if (data.role === "doctor" && data.doctorData) {
      const doctor = this.doctorRepository.create({
        userId: user.id,
        ...data.doctorData,
      });
      await this.doctorRepository.save(doctor);
    }

    if (data.role === "staff" && data.staffData) {
      const staff = this.staffRepository.create({
        userId: user.id,
        ...data.staffData,
      });
      await this.staffRepository.save(staff);
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async login(email: string, password: string) {
    const user = await this.userRepository.findOne({
      where: { email, isActive: true },
    });

    if (!user) {
      throw new Error("Invalid email or password");
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      throw new Error("Invalid email or password");
    }

    const token = jwt.sign({ userId: user.id }, env.jwt.secret, {
      expiresIn: env.jwt.expiresIn as jwt.SignOptions["expiresIn"],
    } as jwt.SignOptions);

    const { password: _, ...userWithoutPassword } = user;

    // Get additional data based on role
    let additionalData = {};
    if (user.role === "doctor") {
      const doctor = await this.doctorRepository.findOne({
        where: { userId: user.id },
        relations: ["polyclinic"],
      });
      additionalData = { doctor };
    } else if (user.role === "staff") {
      const staff = await this.staffRepository.findOne({
        where: { userId: user.id },
      });
      additionalData = { staff };
    }

    return {
      user: { ...userWithoutPassword, ...additionalData },
      token,
    };
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const { password: _, ...userWithoutPassword } = user;

    let additionalData = {};
    if (user.role === "doctor") {
      const doctor = await this.doctorRepository.findOne({
        where: { userId: user.id },
        relations: ["polyclinic"],
      });
      additionalData = { doctor };
    } else if (user.role === "staff") {
      const staff = await this.staffRepository.findOne({
        where: { userId: user.id },
      });
      additionalData = { staff };
    }

    return { ...userWithoutPassword, ...additionalData };
  }

  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const isValidPassword = await bcrypt.compare(oldPassword, user.password);
    if (!isValidPassword) {
      throw new Error("Invalid old password");
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);

    return { message: "Password changed successfully" };
  }
}
