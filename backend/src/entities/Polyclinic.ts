import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Doctor } from "./Doctor";
import { QueueNumber } from "./QueueNumber";
import { QueueCounter } from "./QueueCounter";

@Entity("polyclinics")
export class Polyclinic {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @Column({ length: 10 })
  code!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ name: "is_active", default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @OneToMany(() => Doctor, (doctor) => doctor.polyclinic)
  doctors!: Doctor[];

  @OneToMany(() => QueueNumber, (queue) => queue.polyclinic)
  queueNumbers!: QueueNumber[];

  @OneToMany(() => QueueCounter, (counter) => counter.polyclinic)
  counters!: QueueCounter[];
}
