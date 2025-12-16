import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from "typeorm";
import { Doctor } from "./Doctor";
import { Staff } from "./Staff";

export type UserRole = "admin" | "doctor" | "staff" | "patient";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column()
  name!: string;

  @Column({ type: "varchar", length: 50 })
  role!: UserRole;

  @Column({ nullable: true })
  phone?: string;

  @Column({ name: "is_active", default: true })
  isActive!: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @OneToOne(() => Doctor, (doctor) => doctor.user)
  doctor?: Doctor;

  @OneToOne(() => Staff, (staff) => staff.user)
  staff?: Staff;
}
