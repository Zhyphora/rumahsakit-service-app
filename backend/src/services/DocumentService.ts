import { AppDataSource } from "../config/database";
import { Document } from "../entities/Document";
import { DocumentAccess, AccessType } from "../entities/DocumentAccess";
import { DocumentAccessLog } from "../entities/DocumentAccessLog";
import { User } from "../entities/User";
import fs from "fs";
import path from "path";

export class DocumentService {
  private documentRepository = AppDataSource.getRepository(Document);
  private documentAccessRepository =
    AppDataSource.getRepository(DocumentAccess);
  private documentAccessLogRepository =
    AppDataSource.getRepository(DocumentAccessLog);

  // Create document
  async createDocument(data: {
    title: string;
    description?: string;
    filePath: string;
    fileType?: string;
    fileSize?: number;
    category?: string;
    patientId?: string;
    uploadedBy: string;
    isConfidential?: boolean;
  }) {
    const document = this.documentRepository.create(data);
    return this.documentRepository.save(document);
  }

  // Get documents with access control
  async getDocuments(
    userId: string,
    userRole: string,
    filters?: { category?: string; patientId?: string }
  ) {
    const query = this.documentRepository
      .createQueryBuilder("doc")
      .leftJoinAndSelect("doc.uploader", "uploader")
      .leftJoinAndSelect("doc.patient", "patient");

    // Admin can see all
    if (userRole !== "admin") {
      // Non-admin users can only see:
      // 1. Documents they uploaded
      // 2. Non-confidential documents
      // 3. Documents they have explicit access to
      query.andWhere(
        `(doc.uploaded_by = :userId OR doc.is_confidential = false OR EXISTS (
          SELECT 1 FROM document_access da 
          WHERE da.document_id = doc.id 
          AND da.user_id = :userId
          AND (da.expires_at IS NULL OR da.expires_at > NOW())
        ))`,
        { userId }
      );
    }

    if (filters?.category) {
      query.andWhere("doc.category = :category", {
        category: filters.category,
      });
    }

    if (filters?.patientId) {
      query.andWhere("doc.patient_id = :patientId", {
        patientId: filters.patientId,
      });
    }

    return query.orderBy("doc.created_at", "DESC").getMany();
  }

  // Get document by ID with access check
  async getDocumentById(documentId: string, userId: string, userRole: string) {
    const document = await this.documentRepository.findOne({
      where: { id: documentId },
      relations: ["uploader", "patient", "accessList", "accessList.user"],
    });

    if (!document) {
      throw new Error("Document not found");
    }

    // Check access
    const hasAccess = await this.checkAccess(
      document,
      userId,
      userRole,
      "view"
    );
    if (!hasAccess) {
      throw new Error("Access denied");
    }

    return document;
  }

  // Check document access
  async checkAccess(
    document: Document,
    userId: string,
    userRole: string,
    requiredAccess: AccessType
  ): Promise<boolean> {
    // Admin has full access
    if (userRole === "admin") return true;

    // Owner has full access
    if (document.uploadedBy === userId) return true;

    // Non-confidential documents are viewable by all
    if (!document.isConfidential && requiredAccess === "view") return true;

    // Check explicit access
    const accessEntry = await this.documentAccessRepository.findOne({
      where: { documentId: document.id, userId },
    });

    if (!accessEntry) return false;

    // Check expiry
    if (accessEntry.expiresAt && accessEntry.expiresAt < new Date())
      return false;

    // Check access type
    const accessHierarchy: AccessType[] = ["view", "edit", "delete", "full"];
    const requiredLevel = accessHierarchy.indexOf(requiredAccess);
    const grantedLevel = accessHierarchy.indexOf(accessEntry.accessType);

    return grantedLevel >= requiredLevel || accessEntry.accessType === "full";
  }

  // Grant access
  async grantAccess(data: {
    documentId: string;
    userId: string;
    accessType: AccessType;
    grantedBy: string;
    expiresAt?: Date;
  }) {
    // Check if access already exists
    const existing = await this.documentAccessRepository.findOne({
      where: { documentId: data.documentId, userId: data.userId },
    });

    if (existing) {
      existing.accessType = data.accessType;
      existing.expiresAt = data.expiresAt;
      return this.documentAccessRepository.save(existing);
    }

    const access = this.documentAccessRepository.create(data);
    return this.documentAccessRepository.save(access);
  }

  // Revoke access
  async revokeAccess(documentId: string, userId: string) {
    const access = await this.documentAccessRepository.findOne({
      where: { documentId, userId },
    });

    if (!access) {
      throw new Error("Access not found");
    }

    return this.documentAccessRepository.remove(access);
  }

  // Get document access list
  async getDocumentAccess(documentId: string) {
    return this.documentAccessRepository.find({
      where: { documentId },
      relations: ["user", "grantor"],
    });
  }

  // Log access
  async logAccess(
    documentId: string,
    userId: string,
    action: string,
    ipAddress?: string
  ) {
    const log = this.documentAccessLogRepository.create({
      documentId,
      userId,
      action,
      ipAddress,
    });
    return this.documentAccessLogRepository.save(log);
  }

  // Get access logs
  async getAccessLogs(documentId: string) {
    return this.documentAccessLogRepository.find({
      where: { documentId },
      relations: ["user"],
      order: { createdAt: "DESC" },
    });
  }

  // Update document
  async updateDocument(
    documentId: string,
    userId: string,
    userRole: string,
    data: Partial<Document>
  ) {
    const document = await this.documentRepository.findOne({
      where: { id: documentId },
    });
    if (!document) {
      throw new Error("Document not found");
    }

    const hasAccess = await this.checkAccess(
      document,
      userId,
      userRole,
      "edit"
    );
    if (!hasAccess) {
      throw new Error("Access denied");
    }

    Object.assign(document, data);
    return this.documentRepository.save(document);
  }

  // Delete document
  async deleteDocument(documentId: string, userId: string, userRole: string) {
    const document = await this.documentRepository.findOne({
      where: { id: documentId },
    });
    if (!document) {
      throw new Error("Document not found");
    }

    const hasAccess = await this.checkAccess(
      document,
      userId,
      userRole,
      "delete"
    );
    if (!hasAccess) {
      throw new Error("Access denied");
    }

    // Delete file from disk
    try {
      fs.unlinkSync(document.filePath);
    } catch (error) {
      console.error("Failed to delete file:", error);
    }

    return this.documentRepository.remove(document);
  }

  // Get document categories
  async getCategories() {
    const result = await this.documentRepository
      .createQueryBuilder("doc")
      .select("DISTINCT doc.category", "category")
      .where("doc.category IS NOT NULL")
      .getRawMany();

    return result.map((r) => r.category);
  }
}
