import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { UserRole } from "./User";

@Entity("access_controls")
export class AccessControl {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 50 })
  role!: UserRole;

  // Feature identifier, e.g., "stock:adjust", "user:manage"
  @Column({ type: "varchar", length: 100 })
  feature!: string;
}
