import { Request, Response } from "express";
import { DocumentService } from "../services/DocumentService";
import { AuthRequest } from "../middlewares/auth";
import path from "path";
import { env } from "../config/env";

export class DocumentController {
  private documentService = new DocumentService();

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

      const { category, patientId } = req.query;
      const documents = await this.documentService.getDocuments(
        req.user.id,
        req.user.role,
        {
          category: category as string,
          patientId: patientId as string,
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
        req.user.role
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
        req.user.role
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
        req.user.role,
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
        req.user.role
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

  // Grant access
  grantAccess = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ message: "Not authenticated" });
        return;
      }

      const access = await this.documentService.grantAccess({
        documentId: req.params.id,
        userId: req.body.userId,
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
      await this.documentService.revokeAccess(req.params.id, req.params.userId);
      res.json({ message: "Access revoked successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };

  // Get document access list
  getDocumentAccess = async (req: Request, res: Response): Promise<void> => {
    try {
      const access = await this.documentService.getDocumentAccess(
        req.params.id
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
