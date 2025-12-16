import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { User } from "./User";
import { QueueNumber } from "./QueueNumber";
import { Document } from "./Document";

@Entity("patients")
export class Patient {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "user_id", nullable: true })
  userId?: string;

  @OneToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user?: User;

  @Column({ name: "medical_record_number", unique: true })
  medicalRecordNumber!: string;

  @Column()
  name!: string;

  @Column({ name: "date_of_birth", type: "date", nullable: true })
  dateOfBirth?: Date;

  @Column({ nullable: true })
  gender?: string;

  @Column({ type: "text", nullable: true })
  address?: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ name: "emergency_contact", nullable: true })
  emergencyContact?: string;

  @Column({ name: "blood_type", nullable: true })
  bloodType?: string;

  @Column({ type: "text", nullable: true })
  allergies?: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @OneToMany(() => QueueNumber, (queue) => queue.patient)
  queueNumbers!: QueueNumber[];

  @OneToMany(() => Document, (doc) => doc.patient)
  documents!: Document[];
}
