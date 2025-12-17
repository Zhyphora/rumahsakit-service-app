import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from "typeorm";
import { User } from "./User";
import { Patient } from "./Patient";
import { DocumentAccess } from "./DocumentAccess";
import { DocumentFolder } from "./DocumentFolder";

@Entity("documents")
export class Document {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  title!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ name: "file_path" })
  filePath!: string;

  @Column({ name: "file_type", nullable: true })
  fileType?: string;

  @Column({ name: "file_size", type: "bigint", nullable: true })
  fileSize?: number;

  @Column({ nullable: true })
  category?: string;

  @Column({ name: "patient_id", nullable: true })
  patientId?: string;

  @ManyToOne(() => Patient, { nullable: true })
  @JoinColumn({ name: "patient_id" })
  patient?: Patient;

  @Column({ name: "uploaded_by" })
  uploadedBy!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "uploaded_by" })
  uploader!: User;

  @Column({ name: "is_confidential", default: false })
  isConfidential!: boolean;

  @Column({ name: "folder_id", nullable: true })
  folderId?: string;

  @ManyToOne(() => DocumentFolder, (folder) => folder.documents, {
    nullable: true,
  })
  @JoinColumn({ name: "folder_id" })
  folder?: DocumentFolder;

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;

  @OneToMany(() => DocumentAccess, (access) => access.document)
  accessList!: DocumentAccess[];
}
