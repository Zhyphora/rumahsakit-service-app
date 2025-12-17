import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User, UserRole } from "./User";

@Entity("access_controls")
export class AccessControl {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 50, nullable: true })
  role?: UserRole;

  @Column({ name: "user_id", type: "uuid", nullable: true })
  userId?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user?: User;

  // Feature identifier, e.g., "stock:adjust", "user:manage"
  @Column({ type: "varchar", length: 100 })
  feature!: string;
}
