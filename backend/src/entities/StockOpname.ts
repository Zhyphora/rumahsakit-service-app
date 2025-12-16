import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { User } from "./User";
import { StockOpnameItem } from "./StockOpnameItem";

export type StockOpnameStatus = "draft" | "in_progress" | "completed";

@Entity("stock_opnames")
export class StockOpname {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "opname_date", type: "date" })
  opnameDate!: Date;

  @Column({ type: "varchar", length: 20, default: "draft" })
  status!: StockOpnameStatus;

  @Column({ type: "text", nullable: true })
  notes?: string;

  @Column({ name: "created_by" })
  createdBy!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "created_by" })
  creator!: User;

  @Column({ name: "completed_at", type: "timestamp", nullable: true })
  completedAt?: Date;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @OneToMany(() => StockOpnameItem, (item) => item.stockOpname)
  items!: StockOpnameItem[];
}
