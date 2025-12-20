import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from "typeorm";
import { Patient } from "./Patient";
import { Doctor } from "./Doctor";
import { QueueNumber } from "./QueueNumber";
import { User } from "./User";
import { PrescriptionItem } from "./PrescriptionItem";
import { MedicalRecord } from "./MedicalRecord";

export type PrescriptionStatus =
  | "pending"
  | "dispensing"
  | "completed"
  | "cancelled";

@Entity("prescriptions")
export class Prescription {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "queue_number_id", nullable: true })
  queueNumberId?: string;

  @ManyToOne(() => QueueNumber)
  @JoinColumn({ name: "queue_number_id" })
  queueNumber?: QueueNumber;

  @Column({ name: "patient_id" })
  patientId!: string;

  @ManyToOne(() => Patient)
  @JoinColumn({ name: "patient_id" })
  patient!: Patient;

  @Column({ name: "medical_record_id", nullable: true })
  medicalRecordId?: string;

  @ManyToOne(
    () => MedicalRecord,
    (medicalRecord) => medicalRecord.prescriptions
  )
  @JoinColumn({ name: "medical_record_id" })
  medicalRecord?: MedicalRecord;

  @Column({ name: "doctor_id" })
  doctorId!: string;

  @ManyToOne(() => Doctor)
  @JoinColumn({ name: "doctor_id" })
  doctor!: Doctor;

  @Column({ type: "text", nullable: true })
  diagnosis?: string;

  @Column({ type: "text", nullable: true })
  notes?: string;

  @Column({ type: "varchar", length: 20, default: "pending" })
  status!: PrescriptionStatus;

  @Column({ name: "dispensed_by", nullable: true })
  dispensedBy?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "dispensed_by" })
  dispenser?: User;

  @Column({ name: "dispensed_at", type: "timestamp", nullable: true })
  dispensedAt?: Date;

  @OneToMany(() => PrescriptionItem, (item) => item.prescription, {
    cascade: true,
  })
  items!: PrescriptionItem[];

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
