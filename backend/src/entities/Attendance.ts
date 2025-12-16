import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from "typeorm";
import { User } from "./User";

export type AttendanceStatus = "present" | "late" | "absent" | "leave" | "sick";

@Entity("attendances")
@Unique(["userId", "attendanceDate"])
export class Attendance {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "user_id" })
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ name: "attendance_date", type: "date" })
  attendanceDate!: Date;

  @Column({ name: "check_in", type: "timestamp", nullable: true })
  checkIn?: Date;

  @Column({ name: "check_out", type: "timestamp", nullable: true })
  checkOut?: Date;

  @Column({ name: "check_in_location", type: "jsonb", nullable: true })
  checkInLocation?: { lat: number; lng: number };

  @Column({ name: "check_out_location", type: "jsonb", nullable: true })
  checkOutLocation?: { lat: number; lng: number };

  @Column({ type: "varchar", length: 20, default: "present" })
  status!: AttendanceStatus;

  @Column({ type: "text", nullable: true })
  notes?: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
