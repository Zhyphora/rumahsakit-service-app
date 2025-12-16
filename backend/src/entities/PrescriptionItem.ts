import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Prescription } from "./Prescription";
import { Item } from "./Item";

@Entity("prescription_items")
export class PrescriptionItem {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "prescription_id" })
  prescriptionId!: string;

  @ManyToOne(() => Prescription, (prescription) => prescription.items)
  @JoinColumn({ name: "prescription_id" })
  prescription!: Prescription;

  @Column({ name: "item_id" })
  itemId!: string;

  @ManyToOne(() => Item)
  @JoinColumn({ name: "item_id" })
  item!: Item;

  @Column({ type: "integer", default: 1 })
  quantity!: number;

  @Column({ type: "varchar", length: 100, nullable: true })
  dosage?: string; // e.g., "3x1 sehari"

  @Column({ type: "text", nullable: true })
  instructions?: string; // e.g., "Setelah makan"
}
