import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Item } from "./Item";
import { User } from "./User";

export type MovementType = "in" | "out" | "adjustment";

@Entity("stock_movements")
export class StockMovement {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "item_id" })
  itemId!: string;

  @ManyToOne(() => Item)
  @JoinColumn({ name: "item_id" })
  item!: Item;

  @Column({ name: "movement_type", type: "varchar", length: 20 })
  movementType!: MovementType;

  @Column()
  quantity!: number;

  @Column({ name: "reference_type", nullable: true })
  referenceType?: string;

  @Column({ name: "reference_id", type: "uuid", nullable: true })
  referenceId?: string;

  @Column({ type: "text", nullable: true })
  notes?: string;

  @Column({ name: "created_by" })
  createdBy!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "created_by" })
  creator!: User;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
