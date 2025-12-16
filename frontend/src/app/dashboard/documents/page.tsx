"use client";

import { useState, useEffect } from "react";
import api from "@/services/api";
import { Document } from "@/types";
import styles from "./documents.module.css";

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

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const response = await api.get("/documents");
      setDocuments(response.data);
    } catch (error) {
      console.error("Failed to load documents:", error);
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
      setShowUploadModal(false);
      setSelectedFile(null);
      setUploadData({
        title: "",
        category: "general",
        description: "",
        isConfidential: false,
      });
      loadDocuments();
    } catch (error) {
      alert("Gagal mengupload dokumen");
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
    } catch (error) {
      alert("Gagal mengunduh dokumen");
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
            <div className={styles.docIcon}>
              {doc.fileType?.includes("pdf")
                ? "📄"
                : doc.fileType?.includes("image")
                ? "🖼️"
                : doc.fileType?.includes("word")
                ? "📝"
                : doc.fileType?.includes("excel")
                ? "📊"
                : "📁"}
            </div>
            <div className={styles.docInfo}>
              <h3 className={styles.docTitle}>{doc.title}</h3>
              <p className={styles.docMeta}>
                {formatFileSize(doc.fileSize)} • {doc.category || "General"}
                {doc.isConfidential && (
                  <span className={styles.confidential}>🔒</span>
                )}
              </p>
              <p className={styles.docDate}>
                {new Date(doc.createdAt).toLocaleDateString("id-ID")}
              </p>
            </div>
            <button
              onClick={() => handleDownload(doc)}
              className={styles.downloadBtn}
            >
              ⬇️
            </button>
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
    </div>
  );
}
