import { Request, Response } from "express";
import { DocumentService } from "../services/DocumentService";
import { AuthRequest } from "../middlewares/auth";
import path from "path";
import { env } from "../config/env";
import { User } from "../entities/User";

// Helper to extract role name from user
const getRoleName = (user: User): string => {
  return typeof user.role === "string" ? user.role : user.role?.name || "";
};

export class DocumentController {
  private documentService = new DocumentService();

  // ==================== FOLDER ENDPOINTS ====================

  // Create folder
  createFolder = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
      }

      const folder = await this.documentService.createFolder({
        name: req.body.name,
        description: req.body.description,
        parentFolderId: req.body.parentFolderId,
        createdBy: req.user.id,
      });

      res.status(201).json(folder);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  // Get folders
  getFolders = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { parentFolderId } = req.query;
      const folders = await this.documentService.getFolders(
        parentFolderId as string | undefined
      );
      res.json(folders);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  // Get folder by ID
  getFolderById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const folder = await this.documentService.getFolderById(req.params.id);
      if (!folder) {
        res.status(404).json({ message: "Folder not found" });
        return;
      }
      res.json(folder);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  // Update folder
  updateFolder = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const folder = await this.documentService.updateFolder(
        req.params.id,
        req.body
      );
      res.json(folder);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  // Delete folder
  deleteFolder = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      await this.documentService.deleteFolder(req.params.id);
      res.json({ message: "Folder deleted successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  // ==================== DOCUMENT ENDPOINTS ====================

  // Upload document
  uploadDocument = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
      }

      if (!req.file) {
        res.status(400).json({ message: "No file uploaded" });
        return;
      }

      const document = await this.documentService.createDocument({
        title: req.body.title || req.file.originalname,
        description: req.body.description,
        filePath: req.file.path,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        category: req.body.category,
        patientId: req.body.patientId,
        folderId: req.body.folderId,
        uploadedBy: req.user.id,
        isConfidential: req.body.isConfidential === "true",
      });

      res.status(201).json(document);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  // Get documents
  getDocuments = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
      }

      const { category, patientId, folderId } = req.query;
      const documents = await this.documentService.getDocuments(
        req.user.id,
        getRoleName(req.user),
        {
          category: category as string,
          patientId: patientId as string,
          folderId: folderId as string,
        }
      );

      res.json(documents);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  // Get document by ID
  getDocumentById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
      }

      const document = await this.documentService.getDocumentById(
        req.params.id,
        req.user.id,
        getRoleName(req.user)
      );

      // Log access
      await this.documentService.logAccess(
        document.id,
        req.user.id,
        "view",
        req.ip
      );

      res.json(document);
    } catch (error: any) {
      if (error.message === "Access denied") {
        res.status(403).json({ message: error.message });
      } else {
        res.status(400).json({ message: error.message });
      }
    }
  };

  // Download document
  downloadDocument = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
      }

      const document = await this.documentService.getDocumentById(
        req.params.id,
        req.user.id,
        getRoleName(req.user)
      );

      // Log download
      await this.documentService.logAccess(
        document.id,
        req.user.id,
        "download",
        req.ip
      );

      res.download(document.filePath, document.title);
    } catch (error: any) {
      if (error.message === "Access denied") {
        res.status(403).json({ message: error.message });
      } else {
        res.status(400).json({ message: error.message });
      }
    }
  };

  // Update document
  updateDocument = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
      }

      const document = await this.documentService.updateDocument(
        req.params.id,
        req.user.id,
        getRoleName(req.user),
        req.body
      );

      res.json(document);
    } catch (error: any) {
      if (error.message === "Access denied") {
        res.status(403).json({ message: error.message });
      } else {
        res.status(400).json({ message: error.message });
      }
    }
  };

  // Delete document
  deleteDocument = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
      }

      await this.documentService.deleteDocument(
        req.params.id,
        req.user.id,
        getRoleName(req.user)
      );

      res.json({ message: "Document deleted successfully" });
    } catch (error: any) {
      if (error.message === "Access denied") {
        res.status(403).json({ message: error.message });
      } else {
        res.status(400).json({ message: error.message });
      }
    }
  };

  // ==================== ACCESS CONTROL ENDPOINTS ====================

  // Grant access (enhanced - supports role, polyclinic, doctor, user)
  grantAccess = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
      }

      const access = await this.documentService.grantAccess({
        documentId: req.body.documentId || req.params.id,
        folderId: req.body.folderId,
        accessCriteriaType: req.body.accessCriteriaType || "user",
        userId: req.body.userId,
        role: req.body.role,
        polyclinicId: req.body.polyclinicId,
        doctorId: req.body.doctorId,
        accessType: req.body.accessType,
        grantedBy: req.user.id,
        expiresAt: req.body.expiresAt
          ? new Date(req.body.expiresAt)
          : undefined,
      });

      res.json(access);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  // Revoke access
  revokeAccess = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      await this.documentService.revokeAccess(req.params.accessId);
      res.json({ message: "Access revoked successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  // Get document/folder access list
  getDocumentAccess = async (req: Request, res: Response): Promise<void> => {
    try {
      const { documentId, folderId } = req.query;
      const access = await this.documentService.getDocumentAccess(
        documentId as string,
        folderId as string
      );
      res.json(access);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  // Get access logs
  getAccessLogs = async (req: Request, res: Response): Promise<void> => {
    try {
      const logs = await this.documentService.getAccessLogs(req.params.id);
      res.json(logs);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  // Get categories
  getCategories = async (_req: Request, res: Response): Promise<void> => {
    try {
      const categories = await this.documentService.getCategories();
      res.json(categories);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };
}
