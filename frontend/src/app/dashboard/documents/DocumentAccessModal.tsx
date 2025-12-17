"use client";

import { useState, useEffect } from "react";
import api from "@/services/api";
import {
  Document,
  DocumentAccess,
  Polyclinic,
  Doctor,
  User,
  AccessCriteriaType,
  AccessType,
} from "@/types";
import styles from "./documents.module.css";
import toast from "react-hot-toast";
import { FiLock, FiUsers, FiHome, FiUser, FiX } from "react-icons/fi";
import { MdLocalHospital } from "react-icons/md";

interface DocumentAccessModalProps {
  document: Document;
  onClose: () => void;
  onUpdate: () => void;
}

export default function DocumentAccessModal({
  document,
  onClose,
  onUpdate,
}: DocumentAccessModalProps) {
  const [accessList, setAccessList] = useState<DocumentAccess[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [polyclinics, setPolyclinics] = useState<Polyclinic[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    accessCriteriaType: "role" as AccessCriteriaType,
    role: "",
    polyclinicId: "",
    doctorId: "",
    userId: "",
    accessType: "view" as AccessType,
  });

  useEffect(() => {
    loadAccessList();
    loadPolyclinics();
    loadDoctors();
    loadUsers();
  }, []);

  const loadAccessList = async () => {
    try {
      const response = await api.get(
        `/documents/access/list?documentId=${document.id}`
      );
      setAccessList(response.data);
    } catch (error) {
      console.error("Failed to load access list:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPolyclinics = async () => {
    try {
      const response = await api.get("/polyclinics");
      setPolyclinics(response.data);
    } catch (error) {
      console.error("Failed to load polyclinics:", error);
    }
  };

  const loadDoctors = async () => {
    try {
      const response = await api.get("/doctors");
      setDoctors(response.data);
    } catch (error) {
      console.error("Failed to load doctors:", error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await api.get("/users");
      setUsers(response.data);
    } catch (error) {
      console.error("Failed to load users:", error);
    }
  };

  const handleGrantAccess = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: any = {
      documentId: document.id,
      accessCriteriaType: formData.accessCriteriaType,
      accessType: formData.accessType,
    };

    // Add criteria-specific field
    switch (formData.accessCriteriaType) {
      case "role":
        if (!formData.role) {
          alert("Pilih role terlebih dahulu");
          return;
        }
        payload.role = formData.role;
        break;
      case "polyclinic":
        if (!formData.polyclinicId) {
          alert("Pilih polyclinic terlebih dahulu");
          return;
        }
        payload.polyclinicId = formData.polyclinicId;
        break;
      case "doctor":
        if (!formData.doctorId) {
          alert("Pilih dokter terlebih dahulu");
          return;
        }
        payload.doctorId = formData.doctorId;
        break;
      case "user":
        if (!formData.userId) {
          alert("Pilih user terlebih dahulu");
          return;
        }
        payload.userId = formData.userId;
        break;
    }

    try {
      await api.post("/documents/access", payload);
      loadAccessList();
      setFormData({
        ...formData,
        role: "",
        polyclinicId: "",
        doctorId: "",
        userId: "",
      });
      onUpdate();
    } catch (error) {
      alert("Gagal menambah akses");
    }
  };

  const handleRevokeAccess = async (accessId: string) => {
    if (!confirm("Yakin ingin menghapus akses ini?")) return;

    try {
      await api.delete(`/documents/access/${accessId}`);
      loadAccessList();
      onUpdate();
    } catch (error) {
      alert("Gagal menghapus akses");
    }
  };

  const getCriteriaLabel = (access: DocumentAccess): string => {
    switch (access.accessCriteriaType) {
      case "role":
        return `Role: ${access.role}`;
      case "polyclinic":
        return `Poli: ${access.polyclinic?.name || access.polyclinicId}`;
      case "doctor":
        return `Dokter: ${access.doctor?.user?.name || access.doctorId}`;
      case "user":
        return `User: ${access.user?.name || access.userId}`;
      default:
        return "-";
    }
  };

  const getAccessTypeLabel = (type: AccessType): string => {
    switch (type) {
      case "view":
        return "Lihat";
      case "edit":
        return "Edit";
      case "delete":
        return "Hapus";
      case "full":
        return "Penuh";
      default:
        return type;
    }
  };

  return (
    <div className={styles.modal} onClick={onClose}>
      <div
        className={styles.accessModalContent}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.accessModalHeader}>
          <h2>Pengaturan Akses</h2>
          <p className={styles.docName}>
            <FiLock size={14} style={{ marginRight: 4 }} />
            {document.title}
            {document.isConfidential && " (Rahasia)"}
          </p>
        </div>

        {/* Current Access List */}
        <div className={styles.accessSection}>
          <h3>Akses Saat Ini</h3>
          {isLoading ? (
            <p>Memuat...</p>
          ) : accessList.length === 0 ? (
            <p className={styles.noAccess}>
              Belum ada akses khusus. Dokumen non-rahasia dapat diakses semua
              orang.
            </p>
          ) : (
            <div className={styles.accessList}>
              {accessList.map((access) => (
                <div key={access.id} className={styles.accessItem}>
                  <div className={styles.accessInfo}>
                    <span className={styles.criteriaType}>
                      {access.accessCriteriaType === "role" && (
                        <FiUsers size={14} />
                      )}
                      {access.accessCriteriaType === "polyclinic" && (
                        <MdLocalHospital size={14} />
                      )}
                      {access.accessCriteriaType === "doctor" && (
                        <FiUser size={14} />
                      )}
                      {access.accessCriteriaType === "user" && (
                        <FiUser size={14} />
                      )}
                    </span>
                    <span className={styles.criteriaValue}>
                      {getCriteriaLabel(access)}
                    </span>
                    <span className={styles.accessType}>
                      {getAccessTypeLabel(access.accessType)}
                    </span>
                  </div>
                  <button
                    onClick={() => handleRevokeAccess(access.id)}
                    className={styles.revokeBtn}
                  >
                    <FiX size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Grant Access Form */}
        <form onSubmit={handleGrantAccess} className={styles.accessForm}>
          <h3>Tambah Akses</h3>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Tipe Akses</label>
              <select
                value={formData.accessCriteriaType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    accessCriteriaType: e.target.value as AccessCriteriaType,
                  })
                }
                className={styles.input}
              >
                <option value="role">Berdasarkan Role</option>
                <option value="polyclinic">Berdasarkan Poliklinik</option>
                <option value="doctor">Berdasarkan Dokter</option>
                <option value="user">Berdasarkan User</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label>Level Akses</label>
              <select
                value={formData.accessType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    accessType: e.target.value as AccessType,
                  })
                }
                className={styles.input}
              >
                <option value="view">Lihat</option>
                <option value="edit">Edit</option>
                <option value="delete">Hapus</option>
                <option value="full">Akses Penuh</option>
              </select>
            </div>
          </div>

          {/* Conditional fields based on accessCriteriaType */}
          {formData.accessCriteriaType === "role" && (
            <div className={styles.formGroup}>
              <label>Pilih Role</label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value })
                }
                className={styles.input}
              >
                <option value="">-- Pilih Role --</option>
                <option value="admin">Admin</option>
                <option value="doctor">Dokter</option>
                <option value="staff">Staff</option>
              </select>
            </div>
          )}

          {formData.accessCriteriaType === "polyclinic" && (
            <div className={styles.formGroup}>
              <label>Pilih Poliklinik</label>
              <select
                value={formData.polyclinicId}
                onChange={(e) =>
                  setFormData({ ...formData, polyclinicId: e.target.value })
                }
                className={styles.input}
              >
                <option value="">-- Pilih Poliklinik --</option>
                {polyclinics.map((poly) => (
                  <option key={poly.id} value={poly.id}>
                    {poly.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {formData.accessCriteriaType === "doctor" && (
            <div className={styles.formGroup}>
              <label>Pilih Dokter</label>
              <select
                value={formData.doctorId}
                onChange={(e) =>
                  setFormData({ ...formData, doctorId: e.target.value })
                }
                className={styles.input}
              >
                <option value="">-- Pilih Dokter --</option>
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.user?.name || doc.specialization}
                  </option>
                ))}
              </select>
            </div>
          )}

          {formData.accessCriteriaType === "user" && (
            <div className={styles.formGroup}>
              <label>Pilih User</label>
              <select
                value={formData.userId}
                onChange={(e) =>
                  setFormData({ ...formData, userId: e.target.value })
                }
                className={styles.input}
              >
                <option value="">-- Pilih User --</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.role})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className={styles.modalActions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.cancelBtn}
            >
              Tutup
            </button>
            <button type="submit" className={styles.submitBtn}>
              Tambah Akses
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
