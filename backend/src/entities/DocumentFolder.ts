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
import { Document } from "./Document";

@Entity("document_folders")
export class DocumentFolder {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column()
  name!: string;

  @Column({ type: "text", nullable: true })
  description?: string;

  @Column({ name: "parent_folder_id", nullable: true })
  parentFolderId?: string;

  @ManyToOne(() => DocumentFolder, (folder) => folder.children, {
    nullable: true,
  })
  @JoinColumn({ name: "parent_folder_id" })
  parentFolder?: DocumentFolder;

  @OneToMany(() => DocumentFolder, (folder) => folder.parentFolder)
  children!: DocumentFolder[];

  @Column({ name: "created_by" })
  createdBy!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "created_by" })
  creator!: User;

  @OneToMany(() => Document, (doc) => doc.folder)
  documents!: Document[];

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
