import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";
import { Role } from "./Role";

@Entity("access_controls")
export class AccessControl {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ nullable: true })
  roleId?: string;

  @ManyToOne(() => Role, (role) => role.accessControls)
  @JoinColumn({ name: "role_id" })
  role?: Role;

  @Column({ name: "user_id", type: "uuid", nullable: true })
  userId?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user?: User;

  // Feature identifier, e.g., "stock:adjust", "user:manage"
  @Column({ type: "varchar", length: 100 })
  feature!: string;
}
