"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "@/services/api";
import { Document, User } from "@/types";
import styles from "./documents.module.css";
import DocumentAccessModal from "./DocumentAccessModal";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
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
  FiPlus,
  FiArrowLeft,
  FiUpload,
  FiX,
  FiUsers,
  FiUserPlus,
  FiCheck,
  FiSearch,
} from "react-icons/fi";

interface Folder {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  ownerId?: string;
  _count?: { documents: number };
}

interface SimpleUser {
  id: string;
  name: string;
  email: string;
  role?: { name: string } | string;
}

const getFileIcon = (fileType?: string) => {
  if (fileType?.includes("pdf"))
    return <FiFileText size={24} color="#ef4444" />;
  if (fileType?.includes("image")) return <FiImage size={24} color="#3b82f6" />;
  if (fileType?.includes("word")) return <FiFile size={24} color="#2563eb" />;
  if (fileType?.includes("excel")) return <FiGrid size={24} color="#059669" />;
  return <FiFolder size={24} color="#6b7280" />;
};

export default function DocumentsPage() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);

  // Upload Modal State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState({
    title: "",
    description: "",
    isConfidential: false,
  });

  // Create Folder Modal State
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [folderDescription, setFolderDescription] = useState("");
  const [folderFiles, setFolderFiles] = useState<File[]>([]);
  const [folderAccessUsers, setFolderAccessUsers] = useState<string[]>([]);
  const [availableUsers, setAvailableUsers] = useState<SimpleUser[]>([]);
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [isDraggingFiles, setIsDraggingFiles] = useState(false);

  // Access Modal State
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(
    null
  );
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [showFolderAccessModal, setShowFolderAccessModal] = useState(false);

  const [portalMounted, setPortalMounted] = useState(false);

  useEffect(() => {
    setPortalMounted(true);
    loadFolders();
    loadUsers();
  }, []);

  const loadFolders = async () => {
    try {
      const response = await api.get("/documents/folders");
      setFolders(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal memuat folder");
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      // Use same endpoint as roles page with high limit to get all users
      const response = await api.get("/users?page=1&limit=100");
      const users = response.data.data || response.data || [];
      setAvailableUsers(users);
    } catch (error: any) {
      console.error("Failed to load users:", error);
    }
  };

  const loadDocuments = async (folderId: string) => {
    try {
      const response = await api.get(`/documents?folderId=${folderId}`);
      setDocuments(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal memuat dokumen");
    }
  };

  const openFolder = (folder: Folder) => {
    setCurrentFolder(folder);
    loadDocuments(folder.id);
  };

  const goBack = () => {
    setCurrentFolder(null);
    setDocuments([]);
  };

  const resetFolderModal = () => {
    setFolderName("");
    setFolderDescription("");
    setFolderFiles([]);
    setFolderAccessUsers([]);
    setShowUserSelector(false);
    setShowFolderModal(false);
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    try {
      // Step 1: Create folder
      const folderResponse = await api.post("/documents/folders", {
        name: folderName,
        description: folderDescription,
        accessUserIds: folderAccessUsers,
      });
      const folderId = folderResponse.data.id;

      // Step 2: Upload files if any
      if (folderFiles.length > 0) {
        for (const file of folderFiles) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("title", file.name);
          formData.append("folderId", folderId);
          await api.post("/documents", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
        }
      }

      toast.success(
        `Folder berhasil dibuat${
          folderFiles.length > 0 ? ` dengan ${folderFiles.length} dokumen` : ""
        }`
      );
      resetFolderModal();
      loadFolders();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal membuat folder");
    }
  };

  const toggleUserAccess = (userId: string) => {
    setFolderAccessUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAddFilesToFolder = (files: FileList | null) => {
    if (files) {
      setFolderFiles((prev) => [...prev, ...Array.from(files)]);
    }
  };

  const removeFileFromFolder = (index: number) => {
    setFolderFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !currentFolder) return;

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("title", uploadData.title || selectedFile.name);
    formData.append("description", uploadData.description);
    formData.append("isConfidential", String(uploadData.isConfidential));
    formData.append("folderId", currentFolder.id);

    try {
      await api.post("/documents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success("Dokumen berhasil diupload");
      setShowUploadModal(false);
      setSelectedFile(null);
      setUploadData({ title: "", description: "", isConfidential: false });
      loadDocuments(currentFolder.id);
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

  const handleDeleteDocument = async (doc: Document) => {
    const result = await Swal.fire({
      title: "Hapus Dokumen?",
      text: `Yakin ingin menghapus dokumen "${doc.title}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Ya, Hapus",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/documents/${doc.id}`);
      toast.success("Dokumen berhasil dihapus");
      if (currentFolder) loadDocuments(currentFolder.id);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal menghapus dokumen");
    }
  };

  const handleDeleteFolder = async (folder: Folder) => {
    const result = await Swal.fire({
      title: "Hapus Folder?",
      text: `Yakin ingin menghapus folder "${folder.name}"? Semua dokumen di dalamnya juga akan dihapus.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Ya, Hapus Semua",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/documents/folders/${folder.id}`);
      toast.success("Folder berhasil dihapus");
      loadFolders();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal menghapus folder");
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
        <div className={styles.headerLeft}>
          {currentFolder && (
            <button onClick={goBack} className={styles.backBtn}>
              <FiArrowLeft size={20} />
            </button>
          )}
          <h1 className={styles.title}>
            {currentFolder ? currentFolder.name : "Manajemen Dokumen"}
          </h1>
        </div>
        <div className={styles.headerActions}>
          {currentFolder ? (
            <button
              onClick={() => setShowUploadModal(true)}
              className={styles.uploadBtn}
            >
              <FiUpload size={18} />
              Upload Dokumen
            </button>
          ) : (
            <button
              onClick={() => setShowFolderModal(true)}
              className={styles.uploadBtn}
            >
              <FiPlus size={18} />
              Buat Folder
            </button>
          )}
        </div>
      </div>

      {/* Folder View */}
      {!currentFolder && (
        <>
          <div className={styles.folderGrid}>
            {folders.map((folder) => (
              <div
                key={folder.id}
                className={styles.folderCard}
                onClick={() => openFolder(folder)}
              >
                <div className={styles.folderIcon}>
                  <FiFolder size={40} />
                </div>
                <div className={styles.folderInfo}>
                  <h3 className={styles.folderName}>{folder.name}</h3>
                  {folder.description && (
                    <p className={styles.folderDesc}>{folder.description}</p>
                  )}
                  <p className={styles.folderMeta}>
                    {new Date(folder.createdAt).toLocaleDateString("id-ID")}
                  </p>
                </div>
                <button
                  className={styles.folderDeleteBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFolder(folder);
                  }}
                >
                  <FiTrash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {folders.length === 0 && (
            <div className={styles.emptyState}>
              <FiFolder size={64} />
              <p>Belum ada folder</p>
              <button
                onClick={() => setShowFolderModal(true)}
                className={styles.uploadBtn}
              >
                <FiPlus size={18} />
                Buat Folder Pertama
              </button>
            </div>
          )}
        </>
      )}

      {/* Documents in Folder View */}
      {currentFolder && (
        <>
          <div className={styles.grid}>
            {documents.map((doc) => (
              <div key={doc.id} className={styles.docCard}>
                <div className={styles.docIcon}>
                  {getFileIcon(doc.fileType)}
                </div>
                <div className={styles.docInfo}>
                  <h3 className={styles.docTitle}>{doc.title}</h3>
                  <p className={styles.docMeta}>
                    {formatFileSize(doc.fileSize)}
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
              <FiFile size={64} />
              <p>Belum ada dokumen di folder ini</p>
              <button
                onClick={() => setShowUploadModal(true)}
                className={styles.uploadBtn}
              >
                <FiUpload size={18} />
                Upload Dokumen Pertama
              </button>
            </div>
          )}
        </>
      )}

      {/* Create Folder Modal */}
      {showFolderModal &&
        portalMounted &&
        createPortal(
          <div className={styles.modal}>
            <div className={styles.uploadModalContentLarge}>
              <div className={styles.uploadModalHeader}>
                <h2>Buat Folder Baru</h2>
                <button className={styles.closeBtn} onClick={resetFolderModal}>
                  <FiX size={20} />
                </button>
              </div>
              <form onSubmit={handleCreateFolder} className={styles.uploadForm}>
                {/* Folder Name */}
                <div className={styles.uploadFormGroup}>
                  <label className={styles.uploadLabel}>
                    <FiFolder size={16} />
                    Nama Folder <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={folderName}
                    onChange={(e) => setFolderName(e.target.value)}
                    className={styles.uploadInput}
                    placeholder="Masukkan nama folder"
                    required
                  />
                </div>

                {/* Description */}
                <div className={styles.uploadFormGroup}>
                  <label className={styles.uploadLabel}>
                    <FiFileText size={16} />
                    Deskripsi (Opsional)
                  </label>
                  <input
                    type="text"
                    value={folderDescription}
                    onChange={(e) => setFolderDescription(e.target.value)}
                    className={styles.uploadInput}
                    placeholder="Masukkan deskripsi folder"
                  />
                </div>

                {/* File Upload */}
                <div className={styles.uploadFormGroup}>
                  <label className={styles.uploadLabel}>
                    <FiUpload size={16} />
                    Dokumen (Opsional)
                  </label>
                  <div
                    className={`${styles.dropzoneSmall} ${
                      isDraggingFiles ? styles.dropzoneSmallActive : ""
                    }`}
                    onClick={() =>
                      document.getElementById("folderFileInput")?.click()
                    }
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDraggingFiles(true);
                    }}
                    onDragLeave={(e) => {
                      e.preventDefault();
                      setIsDraggingFiles(false);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingFiles(false);
                      handleAddFilesToFolder(e.dataTransfer.files);
                    }}
                  >
                    <input
                      type="file"
                      id="folderFileInput"
                      multiple
                      onChange={(e) => handleAddFilesToFolder(e.target.files)}
                      style={{ display: "none" }}
                    />
                    <FiPlus size={24} />
                    <span>
                      {isDraggingFiles
                        ? "Lepas file di sini..."
                        : "Klik atau seret file ke sini"}
                    </span>
                  </div>
                  {folderFiles.length > 0 && (
                    <div className={styles.fileList}>
                      {folderFiles.map((file, index) => (
                        <div key={index} className={styles.fileListItem}>
                          <FiFile size={16} />
                          <span className={styles.fileListName}>
                            {file.name}
                          </span>
                          <span className={styles.fileListSize}>
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                          <button
                            type="button"
                            className={styles.fileListRemove}
                            onClick={() => removeFileFromFolder(index)}
                          >
                            <FiX size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* User Access */}
                <div className={styles.uploadFormGroup}>
                  <label className={styles.uploadLabel}>
                    <FiUsers size={16} />
                    Siapa yang bisa akses folder ini?
                  </label>
                  <button
                    type="button"
                    className={styles.accessSelectorBtn}
                    onClick={() => setShowUserSelector(!showUserSelector)}
                  >
                    <FiUserPlus size={18} />
                    {folderAccessUsers.length > 0
                      ? `${folderAccessUsers.length} user dipilih`
                      : "Pilih user..."}
                  </button>
                  {showUserSelector && (
                    <div className={styles.userSelectorContainer}>
                      <div className={styles.userSearchBox}>
                        <FiSearch size={16} />
                        <input
                          type="text"
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          placeholder="Cari user..."
                          className={styles.userSearchInput}
                        />
                      </div>
                      <div className={styles.userSelectorList}>
                        {availableUsers
                          .filter(
                            (user) =>
                              user.name
                                .toLowerCase()
                                .includes(userSearch.toLowerCase()) ||
                              user.email
                                .toLowerCase()
                                .includes(userSearch.toLowerCase())
                          )
                          .map((user) => (
                            <div
                              key={user.id}
                              className={`${styles.userSelectorItem} ${
                                folderAccessUsers.includes(user.id)
                                  ? styles.userSelected
                                  : ""
                              }`}
                              onClick={() => toggleUserAccess(user.id)}
                            >
                              <div className={styles.userSelectorInfo}>
                                <span className={styles.userName}>
                                  {user.name}
                                </span>
                                <span className={styles.userEmail}>
                                  {user.email}
                                </span>
                              </div>
                              {folderAccessUsers.includes(user.id) && (
                                <FiCheck size={18} color="#10b981" />
                              )}
                            </div>
                          ))}
                        {availableUsers.filter(
                          (user) =>
                            user.name
                              .toLowerCase()
                              .includes(userSearch.toLowerCase()) ||
                            user.email
                              .toLowerCase()
                              .includes(userSearch.toLowerCase())
                        ).length === 0 && (
                          <p className={styles.noUsers}>
                            {userSearch
                              ? "Tidak ditemukan"
                              : "Tidak ada user tersedia"}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  <p className={styles.accessHint}>
                    Kosongkan jika folder hanya untuk Anda sendiri
                  </p>
                </div>

                {/* Actions */}
                <div className={styles.uploadActions}>
                  <button
                    type="button"
                    onClick={resetFolderModal}
                    className={styles.cancelBtnNew}
                  >
                    Batal
                  </button>
                  <button type="submit" className={styles.submitBtnNew}>
                    <FiPlus size={18} />
                    Buat Folder
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Upload Document Modal */}
      {showUploadModal &&
        portalMounted &&
        createPortal(
          <div className={styles.modal}>
            <div className={styles.uploadModalContent}>
              <div className={styles.uploadModalHeader}>
                <h2>Upload Dokumen</h2>
                <button
                  className={styles.closeBtn}
                  onClick={() => setShowUploadModal(false)}
                >
                  <FiX size={20} />
                </button>
              </div>

              <form onSubmit={handleUpload} className={styles.uploadForm}>
                {/* Drag & Drop Area */}
                <div
                  className={`${styles.dropzone} ${
                    selectedFile ? styles.dropzoneActive : ""
                  }`}
                  onClick={() => document.getElementById("fileInput")?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.add(styles.dropzoneActive);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove(styles.dropzoneActive);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.classList.remove(styles.dropzoneActive);
                    const file = e.dataTransfer.files[0];
                    if (file) setSelectedFile(file);
                  }}
                >
                  <input
                    type="file"
                    id="fileInput"
                    onChange={(e) =>
                      setSelectedFile(e.target.files?.[0] || null)
                    }
                    style={{ display: "none" }}
                  />
                  {selectedFile ? (
                    <div className={styles.filePreview}>
                      <div className={styles.filePreviewIcon}>
                        {selectedFile.type.includes("pdf") ? (
                          <FiFileText size={48} color="#ef4444" />
                        ) : selectedFile.type.includes("image") ? (
                          <FiImage size={48} color="#3b82f6" />
                        ) : (
                          <FiFile size={48} color="#6b7280" />
                        )}
                      </div>
                      <div className={styles.filePreviewInfo}>
                        <span className={styles.fileName}>
                          {selectedFile.name}
                        </span>
                        <span className={styles.fileSize}>
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                      <button
                        type="button"
                        className={styles.removeFileBtn}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                        }}
                      >
                        <FiX size={18} />
                      </button>
                    </div>
                  ) : (
                    <div className={styles.dropzoneContent}>
                      <div className={styles.dropzoneIcon}>
                        <FiUpload size={48} />
                      </div>
                      <p className={styles.dropzoneText}>
                        <span className={styles.dropzoneHighlight}>
                          Klik untuk pilih file
                        </span>
                        <br />
                        atau drag & drop file di sini
                      </p>
                      <span className={styles.dropzoneHint}>
                        PDF, DOC, XLS, JPG, PNG (Max. 10MB)
                      </span>
                    </div>
                  )}
                </div>

                {/* Title Input */}
                <div className={styles.uploadFormGroup}>
                  <label className={styles.uploadLabel}>
                    <FiFileText size={16} />
                    Judul Dokumen
                  </label>
                  <input
                    type="text"
                    value={uploadData.title}
                    onChange={(e) =>
                      setUploadData({ ...uploadData, title: e.target.value })
                    }
                    className={styles.uploadInput}
                    placeholder="Masukkan judul dokumen (opsional)"
                  />
                </div>

                {/* Folder Info */}
                <div className={styles.uploadFormGroup}>
                  <label className={styles.uploadLabel}>
                    <FiFolder size={16} />
                    Folder
                  </label>
                  <div className={styles.folderBadge}>
                    <FiFolder size={16} />
                    {currentFolder?.name}
                  </div>
                </div>

                {/* Confidential Checkbox */}
                <div className={styles.uploadFormGroup}>
                  <label className={styles.confidentialCheckbox}>
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
                    <div className={styles.checkboxCustom}>
                      <FiLock size={14} />
                    </div>
                    <span>Tandai sebagai dokumen rahasia</span>
                  </label>
                </div>

                {/* Actions */}
                <div className={styles.uploadActions}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUploadModal(false);
                      setSelectedFile(null);
                    }}
                    className={styles.cancelBtnNew}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className={styles.submitBtnNew}
                    disabled={!selectedFile}
                  >
                    <FiUpload size={18} />
                    Upload Dokumen
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
