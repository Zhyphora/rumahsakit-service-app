import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { StockOpnameItem } from "./StockOpnameItem";
import { StockMovement } from "./StockMovement";

@Entity("items")
export class Item {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  code!: string;

  @Column()
  name!: string;

  @Column({ nullable: true })
  category?: string;

  @Column({ nullable: true })
  unit?: string;

  @Column({ name: "min_stock", default: 0 })
  minStock!: number;

  @Column({ name: "current_stock", default: 0 })
  currentStock!: number;

  @Column({ type: "decimal", precision: 15, scale: 2, nullable: true })
  price?: number;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ name: "is_active", default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @OneToMany(() => StockOpnameItem, (item) => item.item)
  stockOpnameItems!: StockOpnameItem[];

  @OneToMany(() => StockMovement, (movement) => movement.item)
  stockMovements!: StockMovement[];
}
