import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Document } from "./Document";
import { User } from "./User";
import { Role } from "./Role";
import { Polyclinic } from "./Polyclinic";
import { Doctor } from "./Doctor";
import { DocumentFolder } from "./DocumentFolder";

export type AccessType = "view" | "edit" | "delete" | "full";
export type AccessCriteriaType = "user" | "role" | "polyclinic" | "doctor";

@Entity("document_access")
export class DocumentAccess {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  // Access criteria type determines which field is used for access check
  @Column({
    name: "access_criteria_type",
    type: "varchar",
    length: 20,
    default: "user",
  })
  accessCriteriaType!: AccessCriteriaType;

  // Document or Folder (one of these should be set)
  @Column({ name: "document_id", nullable: true })
  documentId?: string;

  @ManyToOne(() => Document, (doc) => doc.accessList, { nullable: true })
  @JoinColumn({ name: "document_id" })
  document?: Document;

  @Column({ name: "folder_id", nullable: true })
  folderId?: string;

  @ManyToOne(() => DocumentFolder, { nullable: true })
  @JoinColumn({ name: "folder_id" })
  folder?: DocumentFolder;

  // User-based access (when accessCriteriaType = "user")
  @Column({ name: "user_id", nullable: true })
  userId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: "user_id" })
  user?: User;

  // Role-based access (when accessCriteriaType = "role")
  // Role-based access (when accessCriteriaType = "role")
  @Column({ nullable: true })
  roleId?: string;

  @ManyToOne(() => Role, { nullable: true })
  @JoinColumn({ name: "role_id" })
  role?: Role;

  // Polyclinic-based access (when accessCriteriaType = "polyclinic")
  @Column({ name: "polyclinic_id", nullable: true })
  polyclinicId?: string;

  @ManyToOne(() => Polyclinic, { nullable: true })
  @JoinColumn({ name: "polyclinic_id" })
  polyclinic?: Polyclinic;

  // Doctor-based access (when accessCriteriaType = "doctor")
  @Column({ name: "doctor_id", nullable: true })
  doctorId?: string;

  @ManyToOne(() => Doctor, { nullable: true })
  @JoinColumn({ name: "doctor_id" })
  doctor?: Doctor;

  // Access type (view, edit, delete, full)
  @Column({ name: "access_type", type: "varchar", length: 20 })
  accessType!: AccessType;

  // Who granted the access
  @Column({ name: "granted_by" })
  grantedBy!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "granted_by" })
  grantor!: User;

  // Optional expiry
  @Column({ name: "expires_at", type: "timestamp", nullable: true })
  expiresAt?: Date;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
