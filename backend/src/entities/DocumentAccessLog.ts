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

@Entity("document_access_logs")
export class DocumentAccessLog {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "document_id" })
  documentId!: string;

  @ManyToOne(() => Document)
  @JoinColumn({ name: "document_id" })
  document!: Document;

  @Column({ name: "user_id" })
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user!: User;

  @Column()
  action!: string;

  @Column({ name: "ip_address", nullable: true })
  ipAddress?: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;
}
