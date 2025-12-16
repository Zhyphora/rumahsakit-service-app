import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";

export type LeaveType = "annual" | "sick" | "emergency";
export type LeaveStatus = "pending" | "approved" | "rejected";

@Entity("leave_requests")
export class LeaveRequest {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "user_id" })
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ name: "leave_type", type: "varchar", length: 50 })
  leaveType!: LeaveType;

  @Column({ name: "start_date", type: "date" })
  startDate!: Date;

  @Column({ name: "end_date", type: "date" })
  endDate!: Date;

  @Column({ type: "text", nullable: true })
  reason?: string;

  @Column({ type: "varchar", length: 20, default: "pending" })
  status!: LeaveStatus;

  @Column({ name: "approved_by", nullable: true })
  approvedBy?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "approved_by" })
  approver?: User;

  @Column({ name: "approved_at", type: "timestamp", nullable: true })
  approvedAt?: Date;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
