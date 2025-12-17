import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { Item } from "./Item";
import { User } from "./User";

@Entity("stock_corrections")
export class StockCorrection {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "item_id" })
  itemId!: string;

  @ManyToOne(() => Item)
  @JoinColumn({ name: "item_id" })
  item!: Item;

  // Quantity adjusted (positive for increase, negative for decrease)
  @Column({ type: "int" })
  adjustedQty!: number;

  @Column({ type: "text", nullable: true })
  reason?: string;

  @Column({ name: "created_by" })
  createdBy!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "created_by" })
  creator!: User;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
