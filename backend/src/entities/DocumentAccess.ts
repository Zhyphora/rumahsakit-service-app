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

export type AccessType = "view" | "edit" | "delete" | "full";

@Entity("document_access")
export class DocumentAccess {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "document_id" })
  documentId!: string;

  @ManyToOne(() => Document, (doc) => doc.accessList)
  @JoinColumn({ name: "document_id" })
  document!: Document;

  @Column({ name: "user_id" })
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column({ name: "access_type", type: "varchar", length: 20 })
  accessType!: AccessType;

  @Column({ name: "granted_by" })
  grantedBy!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "granted_by" })
  grantor!: User;

  @Column({ name: "expires_at", type: "timestamp", nullable: true })
  expiresAt?: Date;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
