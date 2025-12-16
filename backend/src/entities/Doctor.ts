import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from "typeorm";
import { User } from "./User";
import { Polyclinic } from "./Polyclinic";
import { QueueNumber } from "./QueueNumber";

@Entity("doctors")
export class Doctor {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "user_id" })
  userId!: string;

  @OneToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column()
  specialization!: string;

  @Column({ name: "license_number", nullable: true })
  licenseNumber?: string;

  @Column({ name: "polyclinic_id", nullable: true })
  polyclinicId?: string;

  @ManyToOne(() => Polyclinic)
  @JoinColumn({ name: "polyclinic_id" })
  polyclinic?: Polyclinic;

  @Column({ type: "jsonb", nullable: true })
  schedule?: Record<string, { start: string; end: string }>;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @OneToMany(() => QueueNumber, (queue) => queue.doctor)
  queueNumbers!: QueueNumber[];
}
