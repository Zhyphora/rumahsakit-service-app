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
import { Polyclinic } from "./Polyclinic";

@Entity("queue_counters")
@Unique(["polyclinicId", "counterDate"])
export class QueueCounter {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "polyclinic_id" })
  polyclinicId!: string;

  @ManyToOne(() => Polyclinic)
  @JoinColumn({ name: "polyclinic_id" })
  polyclinic!: Polyclinic;

  @Column({ name: "counter_date", type: "date" })
  counterDate!: Date;

  @Column({ name: "last_number", default: 0 })
  lastNumber!: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
