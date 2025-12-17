import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { StockOpname } from "./StockOpname";
import { Item } from "./Item";

@Entity("stock_opname_items")
export class StockOpnameItem {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "stock_opname_id" })
  stockOpnameId!: string;

  @ManyToOne(() => StockOpname, (opname) => opname.items)
  @JoinColumn({ name: "stock_opname_id" })
  stockOpname!: StockOpname;

  @Column({ name: "item_id" })
  itemId!: string;

  @ManyToOne(() => Item)
  @JoinColumn({ name: "item_id" })
  item!: Item;

  @Column({ name: "system_qty" })
  systemQty!: number;

  @Column({ name: "actual_qty", type: "int", nullable: true })
  actualQty!: number | null;

  @Column({ type: "text", nullable: true })
  notes?: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  // Computed field
  get difference(): number {
    const actual = this.actualQty ?? this.systemQty;
    return actual - this.systemQty;
  }
}
