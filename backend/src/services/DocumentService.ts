import { AppDataSource } from "../config/database";
import { Document } from "../entities/Document";
import {
  DocumentAccess,
  AccessType,
  AccessCriteriaType,
} from "../entities/DocumentAccess";
import { DocumentAccessLog } from "../entities/DocumentAccessLog";
import { DocumentFolder } from "../entities/DocumentFolder";
import { User } from "../entities/User";
import { Doctor } from "../entities/Doctor";
import fs from "fs";
import path from "path";

export class DocumentService {
  private documentRepository = AppDataSource.getRepository(Document);
  private documentAccessRepository =
    AppDataSource.getRepository(DocumentAccess);
  private documentAccessLogRepository =
    AppDataSource.getRepository(DocumentAccessLog);
  private documentFolderRepository =
    AppDataSource.getRepository(DocumentFolder);
  private doctorRepository = AppDataSource.getRepository(Doctor);

  // ==================== FOLDER OPERATIONS ====================

  // Create folder
  async createFolder(data: {
    name: string;
    description?: string;
    parentFolderId?: string;
    createdBy: string;
  }) {
    const folder = this.documentFolderRepository.create(data);
    return this.documentFolderRepository.save(folder);
  }

  // Get folders
  async getFolders(parentFolderId?: string) {
    const where = parentFolderId
      ? { parentFolderId }
      : { parentFolderId: undefined as any };

    return this.documentFolderRepository.find({
      where: parentFolderId ? { parentFolderId } : {},
      relations: ["creator", "children"],
      order: { name: "ASC" },
    });
  }

  // Get folder by ID
  async getFolderById(folderId: string) {
    return this.documentFolderRepository.findOne({
      where: { id: folderId },
      relations: ["creator", "children", "documents", "parentFolder"],
    });
  }

  // Update folder
  async updateFolder(folderId: string, data: Partial<DocumentFolder>) {
    const folder = await this.documentFolderRepository.findOne({
      where: { id: folderId },
    });
    if (!folder) {
      throw new Error("Folder not found");
    }
    Object.assign(folder, data);
    return this.documentFolderRepository.save(folder);
  }

  // Delete folder
  async deleteFolder(folderId: string) {
    const folder = await this.documentFolderRepository.findOne({
      where: { id: folderId },
    });
    if (!folder) {
      throw new Error("Folder not found");
    }
    return this.documentFolderRepository.remove(folder);
  }

  // ==================== DOCUMENT OPERATIONS ====================

  // Create document
  async createDocument(data: {
    title: string;
    description?: string;
    filePath: string;
    fileType?: string;
    fileSize?: number;
    category?: string;
    patientId?: string;
    folderId?: string;
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
    filters?: { category?: string; patientId?: string; folderId?: string }
  ) {
    const query = this.documentRepository
      .createQueryBuilder("doc")
      .leftJoinAndSelect("doc.uploader", "uploader")
      .leftJoinAndSelect("doc.patient", "patient")
      .leftJoinAndSelect("doc.folder", "folder");

    // Admin can see all
    if (userRole !== "admin") {
      // Get user's doctor info if they are a doctor
      const doctor = await this.doctorRepository.findOne({
        where: { userId },
      });

      // Non-admin users can only see:
      // 1. Documents they uploaded
      // 2. Non-confidential documents
      // 3. Documents they have explicit access to (user, role, polyclinic, doctor)
      const accessConditions = [
        "doc.uploaded_by = :userId",
        "doc.is_confidential = false",
        // User-based access
        `EXISTS (
          SELECT 1 FROM document_access da 
          WHERE da.document_id = doc.id 
          AND da.access_criteria_type = 'user'
          AND da.user_id = :userId
          AND (da.expires_at IS NULL OR da.expires_at > NOW())
        )`,
        // Role-based access
        `EXISTS (
          SELECT 1 FROM document_access da 
          WHERE da.document_id = doc.id 
          AND da.access_criteria_type = 'role'
          AND da.role = :userRole
          AND (da.expires_at IS NULL OR da.expires_at > NOW())
        )`,
      ];

      // Add polyclinic/doctor based access if user is a doctor
      if (doctor) {
        accessConditions.push(
          // Polyclinic-based access
          `EXISTS (
            SELECT 1 FROM document_access da 
            WHERE da.document_id = doc.id 
            AND da.access_criteria_type = 'polyclinic'
            AND da.polyclinic_id = :polyclinicId
            AND (da.expires_at IS NULL OR da.expires_at > NOW())
          )`,
          // Doctor-based access
          `EXISTS (
            SELECT 1 FROM document_access da 
            WHERE da.document_id = doc.id 
            AND da.access_criteria_type = 'doctor'
            AND da.doctor_id = :doctorId
            AND (da.expires_at IS NULL OR da.expires_at > NOW())
          )`
        );

        query.setParameters({
          userId,
          userRole,
          polyclinicId: doctor.polyclinicId,
          doctorId: doctor.id,
        });
      } else {
        query.setParameters({ userId, userRole });
      }

      // Also check folder-level access
      accessConditions.push(
        `EXISTS (
          SELECT 1 FROM document_access da 
          WHERE da.folder_id = doc.folder_id 
          AND doc.folder_id IS NOT NULL
          AND (
            (da.access_criteria_type = 'user' AND da.user_id = :userId)
            OR (da.access_criteria_type = 'role' AND da.role = :userRole)
          )
          AND (da.expires_at IS NULL OR da.expires_at > NOW())
        )`
      );

      query.andWhere(`(${accessConditions.join(" OR ")})`);
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

    if (filters?.folderId) {
      query.andWhere("doc.folder_id = :folderId", {
        folderId: filters.folderId,
      });
    }

    return query.orderBy("doc.created_at", "DESC").getMany();
  }

  // Get document by ID with access check
  async getDocumentById(documentId: string, userId: string, userRole: string) {
    const document = await this.documentRepository.findOne({
      where: { id: documentId },
      relations: [
        "uploader",
        "patient",
        "accessList",
        "accessList.user",
        "folder",
      ],
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

  // Check document access (enhanced version)
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

    // Get user's doctor info if they are a doctor
    const doctor = await this.doctorRepository.findOne({
      where: { userId },
    });

    // Check explicit access entries
    const accessQuery = this.documentAccessRepository
      .createQueryBuilder("da")
      .where("(da.document_id = :documentId OR da.folder_id = :folderId)", {
        documentId: document.id,
        folderId: document.folderId,
      })
      .andWhere("(da.expires_at IS NULL OR da.expires_at > NOW())");

    // Build OR conditions for different access criteria types
    const accessConditions: string[] = [];
    const params: any = {
      documentId: document.id,
      folderId: document.folderId,
    };

    // User-based access
    accessConditions.push(
      "(da.access_criteria_type = 'user' AND da.user_id = :userId)"
    );
    params.userId = userId;

    // Role-based access
    accessConditions.push(
      "(da.access_criteria_type = 'role' AND da.role = :userRole)"
    );
    params.userRole = userRole;

    // Polyclinic-based access (if user is a doctor)
    if (doctor?.polyclinicId) {
      accessConditions.push(
        "(da.access_criteria_type = 'polyclinic' AND da.polyclinic_id = :polyclinicId)"
      );
      params.polyclinicId = doctor.polyclinicId;
    }

    // Doctor-based access
    if (doctor) {
      accessConditions.push(
        "(da.access_criteria_type = 'doctor' AND da.doctor_id = :doctorId)"
      );
      params.doctorId = doctor.id;
    }

    accessQuery.andWhere(`(${accessConditions.join(" OR ")})`);
    accessQuery.setParameters(params);

    const accessEntries = await accessQuery.getMany();

    if (accessEntries.length === 0) return false;

    // Check access type hierarchy
    const accessHierarchy: AccessType[] = ["view", "edit", "delete", "full"];
    const requiredLevel = accessHierarchy.indexOf(requiredAccess);

    // Find the highest access level granted
    for (const entry of accessEntries) {
      if (entry.accessType === "full") return true;
      const grantedLevel = accessHierarchy.indexOf(entry.accessType);
      if (grantedLevel >= requiredLevel) return true;
    }

    return false;
  }

  // ==================== ACCESS MANAGEMENT ====================

  // Grant access (enhanced version)
  async grantAccess(data: {
    documentId?: string;
    folderId?: string;
    accessCriteriaType: AccessCriteriaType;
    userId?: string;
    role?: string;
    polyclinicId?: string;
    doctorId?: string;
    accessType: AccessType;
    grantedBy: string;
    expiresAt?: Date;
  }) {
    // Validate that we have either documentId or folderId
    if (!data.documentId && !data.folderId) {
      throw new Error("Either documentId or folderId must be provided");
    }

    // Validate criteria based on type
    switch (data.accessCriteriaType) {
      case "user":
        if (!data.userId)
          throw new Error("userId is required for user-based access");
        break;
      case "role":
        if (!data.role)
          throw new Error("role is required for role-based access");
        break;
      case "polyclinic":
        if (!data.polyclinicId)
          throw new Error(
            "polyclinicId is required for polyclinic-based access"
          );
        break;
      case "doctor":
        if (!data.doctorId)
          throw new Error("doctorId is required for doctor-based access");
        break;
    }

    // Check if access already exists
    const existingQuery = this.documentAccessRepository
      .createQueryBuilder("da")
      .where("da.access_criteria_type = :accessCriteriaType", {
        accessCriteriaType: data.accessCriteriaType,
      });

    if (data.documentId) {
      existingQuery.andWhere("da.document_id = :documentId", {
        documentId: data.documentId,
      });
    }
    if (data.folderId) {
      existingQuery.andWhere("da.folder_id = :folderId", {
        folderId: data.folderId,
      });
    }

    switch (data.accessCriteriaType) {
      case "user":
        existingQuery.andWhere("da.user_id = :userId", { userId: data.userId });
        break;
      case "role":
        existingQuery.andWhere("da.role = :role", { role: data.role });
        break;
      case "polyclinic":
        existingQuery.andWhere("da.polyclinic_id = :polyclinicId", {
          polyclinicId: data.polyclinicId,
        });
        break;
      case "doctor":
        existingQuery.andWhere("da.doctor_id = :doctorId", {
          doctorId: data.doctorId,
        });
        break;
    }

    const existing = await existingQuery.getOne();

    if (existing) {
      existing.accessType = data.accessType;
      existing.expiresAt = data.expiresAt;
      return this.documentAccessRepository.save(existing);
    }

    const access = this.documentAccessRepository.create(data);
    return this.documentAccessRepository.save(access);
  }

  // Revoke access
  async revokeAccess(accessId: string) {
    const access = await this.documentAccessRepository.findOne({
      where: { id: accessId },
    });

    if (!access) {
      throw new Error("Access not found");
    }

    return this.documentAccessRepository.remove(access);
  }

  // Get document/folder access list
  async getDocumentAccess(documentId?: string, folderId?: string) {
    const where: any = {};
    if (documentId) where.documentId = documentId;
    if (folderId) where.folderId = folderId;

    return this.documentAccessRepository.find({
      where,
      relations: ["user", "grantor", "polyclinic", "doctor", "doctor.user"],
    });
  }

  // ==================== LOGGING ====================

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

  // ==================== DOCUMENT CRUD ====================

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
