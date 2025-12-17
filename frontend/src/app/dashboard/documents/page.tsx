"use client";

import { useState, useEffect } from "react";
import api from "@/services/api";
import { Document, Patient } from "@/types";
import styles from "./documents.module.css";
import DocumentAccessModal from "./DocumentAccessModal";
import toast from "react-hot-toast";
import {
  FiFile,
  FiImage,
  FiFileText,
  FiGrid,
  FiFolder,
  FiLock,
  FiSettings,
  FiDownload,
  FiTrash2,
} from "react-icons/fi";

const getFileIcon = (fileType?: string) => {
  if (fileType?.includes("pdf"))
    return <FiFileText size={24} color="#ef4444" />;
  if (fileType?.includes("image")) return <FiImage size={24} color="#3b82f6" />;
  if (fileType?.includes("word")) return <FiFile size={24} color="#2563eb" />;
  if (fileType?.includes("excel")) return <FiGrid size={24} color="#059669" />;
  return <FiFolder size={24} color="#6b7280" />;
};

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState({
    title: "",
    category: "general",
    description: "",
    isConfidential: false,
  });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  );
  const [showAccessModal, setShowAccessModal] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const response = await api.get("/documents");
      setDocuments(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal memuat dokumen");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("title", uploadData.title || selectedFile.name);
    formData.append("category", uploadData.category);
    formData.append("description", uploadData.description);
    formData.append("isConfidential", String(uploadData.isConfidential));

    try {
      await api.post("/documents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Dokumen berhasil diupload");
      setShowUploadModal(false);
      setSelectedFile(null);
      setUploadData({
        title: "",
        category: "general",
        description: "",
        isConfidential: false,
      });
      loadDocuments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal mengupload dokumen");
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const response = await api.get(`/documents/${doc.id}/download`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", doc.title);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Download dimulai");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal mengunduh dokumen");
    }
  };

  const handleOpenAccessModal = (doc: Document) => {
    setSelectedDocument(doc);
    setShowAccessModal(true);
  };

  const handleDeleteDocument = async (doc: Document) => {
    if (!confirm(`Yakin ingin menghapus dokumen "${doc.title}"?`)) return;

    try {
      await api.delete(`/documents/${doc.id}`);
      toast.success("Dokumen berhasil dihapus");
      loadDocuments();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal menghapus dokumen");
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "-";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Manajemen Dokumen</h1>
        <button
          onClick={() => setShowUploadModal(true)}
          className={styles.uploadBtn}
        >
          + Upload Dokumen
        </button>
      </div>

      <div className={styles.grid}>
        {documents.map((doc) => (
          <div key={doc.id} className={styles.docCard}>
            <div className={styles.docIcon}>{getFileIcon(doc.fileType)}</div>
            <div className={styles.docInfo}>
              <h3 className={styles.docTitle}>{doc.title}</h3>
              <p className={styles.docMeta}>
                {formatFileSize(doc.fileSize)} • {doc.category || "General"}
                {doc.isConfidential && (
                  <span className={styles.confidential}>
                    <FiLock size={12} />
                  </span>
                )}
              </p>
              <p className={styles.docDate}>
                {new Date(doc.createdAt).toLocaleDateString("id-ID")}
              </p>
            </div>
            <div className={styles.docActions}>
              <button
                onClick={() => handleOpenAccessModal(doc)}
                className={styles.settingsBtn}
                title="Pengaturan Akses"
              >
                <FiSettings size={16} />
              </button>
              <button
                onClick={() => handleDownload(doc)}
                className={styles.downloadBtn}
                title="Download"
              >
                <FiDownload size={16} />
              </button>
              <button
                onClick={() => handleDeleteDocument(doc)}
                className={styles.settingsBtn}
                title="Hapus"
                style={{ color: "#dc2626" }}
              >
                <FiTrash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {documents.length === 0 && (
        <div className={styles.emptyState}>
          <p>Belum ada dokumen</p>
          <button
            onClick={() => setShowUploadModal(true)}
            className={styles.uploadBtn}
          >
            Upload Dokumen Pertama
          </button>
        </div>
      )}

      {showUploadModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>Upload Dokumen</h2>
            <form onSubmit={handleUpload}>
              <div className={styles.formGroup}>
                <label>File</label>
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className={styles.fileInput}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Judul</label>
                <input
                  type="text"
                  value={uploadData.title}
                  onChange={(e) =>
                    setUploadData({ ...uploadData, title: e.target.value })
                  }
                  className={styles.input}
                  placeholder="Judul dokumen"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Kategori</label>
                <select
                  value={uploadData.category}
                  onChange={(e) =>
                    setUploadData({ ...uploadData, category: e.target.value })
                  }
                  className={styles.input}
                >
                  <option value="general">General</option>
                  <option value="medical_record">Medical Record</option>
                  <option value="lab_result">Lab Result</option>
                  <option value="prescription">Prescription</option>
                  <option value="bpjs">Tagihan BPJS</option>
                  <option value="invoice">Invoice</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={uploadData.isConfidential}
                    onChange={(e) =>
                      setUploadData({
                        ...uploadData,
                        isConfidential: e.target.checked,
                      })
                    }
                  />
                  Dokumen Rahasia
                </label>
              </div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className={styles.cancelBtn}
                >
                  Batal
                </button>
                <button type="submit" className={styles.submitBtn}>
                  Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Access Control Modal */}
      {showAccessModal && selectedDocument && (
        <DocumentAccessModal
          document={selectedDocument}
          onClose={() => {
            setShowAccessModal(false);
            setSelectedDocument(null);
          }}
          onUpdate={loadDocuments}
        />
      )}
    </div>
  );
}
