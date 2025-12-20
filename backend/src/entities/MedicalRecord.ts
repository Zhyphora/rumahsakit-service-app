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
import { Polyclinic } from "./Polyclinic";
import { Prescription } from "./Prescription";

@Entity("medical_records")
export class MedicalRecord {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "patient_id" })
  patientId!: string;

  @ManyToOne(() => Patient)
  @JoinColumn({ name: "patient_id" })
  patient!: Patient;

  @Column({ name: "doctor_id" })
  doctorId!: string;

  @ManyToOne(() => Doctor)
  @JoinColumn({ name: "doctor_id" })
  doctor!: Doctor;

  @Column({ name: "polyclinic_id" })
  polyclinicId!: string;

  @ManyToOne(() => Polyclinic)
  @JoinColumn({ name: "polyclinic_id" })
  polyclinic!: Polyclinic;

  @Column({ name: "visit_date", type: "timestamp" })
  visitDate!: Date;

  @Column({ type: "text" })
  diagnosis!: string;

  @Column({ type: "text", nullable: true })
  actions?: string; // "Tindakan" requested by user

  @Column({ type: "text", nullable: true })
  notes?: string;

  @OneToMany(() => Prescription, (prescription) => prescription.medicalRecord)
  prescriptions!: Prescription[];

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
