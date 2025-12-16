import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Polyclinic } from "./Polyclinic";
import { Patient } from "./Patient";
import { Doctor } from "./Doctor";

export type QueueStatus =
  | "waiting"
  | "called"
  | "serving"
  | "completed"
  | "skipped";

@Entity("queue_numbers")
export class QueueNumber {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "polyclinic_id" })
  polyclinicId!: string;

  @ManyToOne(() => Polyclinic)
  @JoinColumn({ name: "polyclinic_id" })
  polyclinic!: Polyclinic;

  @Column({ name: "patient_id" })
  patientId!: string;

  @ManyToOne(() => Patient)
  @JoinColumn({ name: "patient_id" })
  patient!: Patient;

  @Column({ name: "queue_number" })
  queueNumber!: number;

  @Column({ name: "queue_date", type: "date" })
  queueDate!: Date;

  @Column({ type: "varchar", length: 20, default: "waiting" })
  status!: QueueStatus;

  @Column({ name: "check_in_time", type: "timestamp", default: () => "NOW()" })
  checkInTime!: Date;

  @Column({ name: "called_time", type: "timestamp", nullable: true })
  calledTime?: Date;

  @Column({ name: "served_time", type: "timestamp", nullable: true })
  servedTime?: Date;

  @Column({ name: "completed_time", type: "timestamp", nullable: true })
  completedTime?: Date;

  @Column({ name: "doctor_id", nullable: true })
  doctorId?: string;

  @ManyToOne(() => Doctor)
  @JoinColumn({ name: "doctor_id" })
  doctor?: Doctor;

  @Column({ type: "text", nullable: true })
  notes?: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
