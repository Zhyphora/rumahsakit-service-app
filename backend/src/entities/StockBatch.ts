import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { Item } from "./Item";

@Entity("stock_batches")
export class StockBatch {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "item_id" })
  itemId!: string;

  @ManyToOne(() => Item)
  @JoinColumn({ name: "item_id" })
  item!: Item;

  // Quantity remaining in this batch
  @Column({ type: "int" })
  quantity!: number;

  // When the batch was received (used for FIFO ordering)
  @Column({ name: "received_at", type: "timestamp" })
  receivedAt!: Date;

  // Optional expiry date (e.g., for medicines)
  @Column({ name: "expiry_at", type: "timestamp", nullable: true })
  expiryAt?: Date;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
