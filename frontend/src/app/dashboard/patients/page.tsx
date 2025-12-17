"use client";

import { useState, useEffect } from "react";
import api from "@/services/api";
import { Patient } from "@/types";
import styles from "./patients.module.css";
import toast from "react-hot-toast";
import {
  FiX,
  FiUser,
  FiPhone,
  FiCalendar,
  FiMapPin,
  FiFileText,
  FiAlertTriangle,
  FiEdit2,
  FiTrash2,
} from "react-icons/fi";

interface MedicalHistory {
  id: string;
  date: string;
  diagnosis: string;
  doctor: string;
  polyclinic: string;
  notes?: string;
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [medicalHistory, setMedicalHistory] = useState<MedicalHistory[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
  });
  const [newPatient, setNewPatient] = useState({
    name: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    setError(null);
    try {
      const response = await api.get("/patients");
      // Handle new format: { status, message, data } or old format: []
      const patientsData = response.data?.data || response.data;
      setPatients(Array.isArray(patientsData) ? patientsData : []);
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Gagal memuat data pasien";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      const response = await api.get(`/patients?search=${searchTerm}`);
      // Handle new format: { status, message, data } or old format: []
      const patientsData = response.data?.data || response.data;
      setPatients(Array.isArray(patientsData) ? patientsData : []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Pencarian gagal");
    }
  };

  const handleAddPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/patients", newPatient);
      toast.success("Pasien berhasil ditambahkan");
      setShowAddModal(false);
      setNewPatient({
        name: "",
        phone: "",
        dateOfBirth: "",
        gender: "",
        address: "",
      });
      loadPatients();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal menambah pasien");
    }
  };

  // Click on patient row to open detail modal
  const handleRowClick = async (patient: Patient) => {
    setSelectedPatient(patient);
    setIsEditing(false);
    setEditData({
      name: patient.name,
      phone: patient.phone || "",
      dateOfBirth: patient.dateOfBirth ? patient.dateOfBirth.split("T")[0] : "",
      gender: patient.gender || "",
      address: patient.address || "",
    });
    setShowDetailModal(true);
    setLoadingHistory(true);

    try {
      // Use new medical history API
      const response = await api.get(`/patients/${patient.id}/medical-history`);
      const data = response.data;

      // Handle standardized response format
      if (data.status === "success" && data.data?.medicalHistory) {
        setMedicalHistory(data.data.medicalHistory);
      } else if (Array.isArray(data)) {
        // Fallback for old format
        setMedicalHistory(data);
      } else {
        setMedicalHistory([]);
      }
    } catch (error) {
      // Fallback to prescriptions API
      try {
        const response = await api.get(`/prescriptions/patient/${patient.id}`);
        const prescriptions = response.data.data || response.data || [];

        const history: MedicalHistory[] = prescriptions.map((p: any) => ({
          id: p.id,
          date: p.createdAt,
          diagnosis: p.diagnosis || "Tidak ada diagnosis",
          doctor: p.doctor?.user?.name || "Dokter",
          polyclinic: p.doctor?.polyclinic?.name || "Poliklinik",
          notes: p.notes,
          items: p.items || [],
        }));

        setMedicalHistory(history);
      } catch (e) {
        setMedicalHistory([]);
      }
    } finally {
      setLoadingHistory(false);
    }
  };

  // Update patient
  const handleUpdatePatient = async () => {
    if (!selectedPatient) return;

    try {
      await api.put(`/patients/${selectedPatient.id}`, editData);
      toast.success("Data pasien berhasil diperbarui");
      setIsEditing(false);
      loadPatients();
      setShowDetailModal(false);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Gagal memperbarui data pasien"
      );
    }
  };

  // Open delete confirmation modal
  const handleOpenDeleteModal = (e: React.MouseEvent, patient: Patient) => {
    e.stopPropagation();
    setSelectedPatient(patient);
    setShowDeleteModal(true);
  };

  // Delete patient
  const handleDeletePatient = async (permanent: boolean) => {
    if (!selectedPatient) return;

    try {
      if (permanent) {
        await api.delete(`/patients/${selectedPatient.id}?permanent=true`);
        toast.success("Pasien berhasil dihapus permanen");
      } else {
        await api.delete(`/patients/${selectedPatient.id}`);
        toast.success("Pasien berhasil dinonaktifkan");
      }
      setShowDeleteModal(false);
      setShowDetailModal(false);
      loadPatients();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal menghapus pasien");
    }
  };

  const filteredPatients = Array.isArray(patients)
    ? patients.filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.medicalRecordNumber
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (p.phone && p.phone.includes(searchTerm))
      )
    : [];

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorState}>
        <FiAlertTriangle size={48} color="#dc2626" />
        <p>{error}</p>
        <button onClick={loadPatients} className={styles.retryBtn}>
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Data Pasien</h1>
        <button onClick={() => setShowAddModal(true)} className={styles.addBtn}>
          + Tambah Pasien
        </button>
      </div>

      <div className={styles.toolbar}>
        <input
          type="text"
          placeholder="Cari berdasarkan nama, No. RM, atau telepon..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          className={styles.searchInput}
        />
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>No. Rekam Medis</th>
              <th>Nama</th>
              <th>Tanggal Lahir</th>
              <th>Jenis Kelamin</th>
              <th>Telepon</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filteredPatients.map((patient) => (
              <tr
                key={patient.id}
                onClick={() => handleRowClick(patient)}
                className={styles.clickableRow}
              >
                <td className={styles.mrnCell}>
                  {patient.medicalRecordNumber}
                </td>
                <td>{patient.name}</td>
                <td>
                  {patient.dateOfBirth
                    ? new Date(patient.dateOfBirth).toLocaleDateString("id-ID")
                    : "-"}
                </td>
                <td>{patient.gender || "-"}</td>
                <td>{patient.phone || "-"}</td>
                <td>
                  <div className={styles.actionBtns}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRowClick(patient);
                        setIsEditing(true);
                      }}
                      className={styles.editBtn}
                      title="Edit"
                    >
                      <FiEdit2 size={16} />
                    </button>
                    <button
                      onClick={(e) => handleOpenDeleteModal(e, patient)}
                      className={styles.deleteBtn}
                      title="Hapus"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredPatients.length === 0 && (
          <div className={styles.emptyState}>Tidak ada pasien ditemukan</div>
        )}
      </div>

      {/* Add Patient Modal */}
      {showAddModal && (
        <div className={styles.modal} onClick={() => setShowAddModal(false)}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Tambah Pasien Baru</h2>
            <form onSubmit={handleAddPatient}>
              <div className={styles.formGroup}>
                <label>Nama Lengkap</label>
                <input
                  type="text"
                  value={newPatient.name}
                  onChange={(e) =>
                    setNewPatient({ ...newPatient, name: e.target.value })
                  }
                  className={styles.input}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Telepon</label>
                <input
                  type="tel"
                  value={newPatient.phone}
                  onChange={(e) =>
                    setNewPatient({ ...newPatient, phone: e.target.value })
                  }
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Tanggal Lahir</label>
                <input
                  type="date"
                  value={newPatient.dateOfBirth}
                  onChange={(e) =>
                    setNewPatient({
                      ...newPatient,
                      dateOfBirth: e.target.value,
                    })
                  }
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Jenis Kelamin</label>
                <select
                  value={newPatient.gender}
                  onChange={(e) =>
                    setNewPatient({ ...newPatient, gender: e.target.value })
                  }
                  className={styles.input}
                >
                  <option value="">Pilih</option>
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label>Alamat</label>
                <textarea
                  value={newPatient.address}
                  onChange={(e) =>
                    setNewPatient({ ...newPatient, address: e.target.value })
                  }
                  className={styles.textarea}
                  rows={3}
                />
              </div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className={styles.cancelBtn}
                >
                  Batal
                </button>
                <button type="submit" className={styles.submitBtn}>
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Patient Detail Modal */}
      {showDetailModal && selectedPatient && (
        <div className={styles.modal} onClick={() => setShowDetailModal(false)}>
          <div
            className={styles.detailModalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.detailHeader}>
              <h2>{isEditing ? "Edit Data Pasien" : "Rekam Medis Pasien"}</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className={styles.closeBtn}
              >
                <FiX size={20} />
              </button>
            </div>

            {isEditing ? (
              <div className={styles.editForm}>
                <div className={styles.formGroup}>
                  <label>Nama Lengkap</label>
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) =>
                      setEditData({ ...editData, name: e.target.value })
                    }
                    className={styles.input}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Telepon</label>
                  <input
                    type="tel"
                    value={editData.phone}
                    onChange={(e) =>
                      setEditData({ ...editData, phone: e.target.value })
                    }
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Tanggal Lahir</label>
                  <input
                    type="date"
                    value={editData.dateOfBirth}
                    onChange={(e) =>
                      setEditData({ ...editData, dateOfBirth: e.target.value })
                    }
                    className={styles.input}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Jenis Kelamin</label>
                  <select
                    value={editData.gender}
                    onChange={(e) =>
                      setEditData({ ...editData, gender: e.target.value })
                    }
                    className={styles.input}
                  >
                    <option value="">Pilih</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Alamat</label>
                  <textarea
                    value={editData.address}
                    onChange={(e) =>
                      setEditData({ ...editData, address: e.target.value })
                    }
                    className={styles.textarea}
                    rows={3}
                  />
                </div>
                <div className={styles.modalActions}>
                  <button
                    onClick={() => setIsEditing(false)}
                    className={styles.cancelBtn}
                  >
                    Batal
                  </button>
                  <button
                    onClick={handleUpdatePatient}
                    className={styles.submitBtn}
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.patientInfo}>
                  <div className={styles.infoRow}>
                    <FiUser size={16} />
                    <span className={styles.infoLabel}>Nama:</span>
                    <span>{selectedPatient.name}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <FiFileText size={16} />
                    <span className={styles.infoLabel}>No. RM:</span>
                    <span>{selectedPatient.medicalRecordNumber}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <FiCalendar size={16} />
                    <span className={styles.infoLabel}>Tanggal Lahir:</span>
                    <span>
                      {selectedPatient.dateOfBirth
                        ? new Date(
                            selectedPatient.dateOfBirth
                          ).toLocaleDateString("id-ID")
                        : "-"}
                    </span>
                  </div>
                  <div className={styles.infoRow}>
                    <FiPhone size={16} />
                    <span className={styles.infoLabel}>Telepon:</span>
                    <span>{selectedPatient.phone || "-"}</span>
                  </div>
                  <div className={styles.infoRow}>
                    <FiMapPin size={16} />
                    <span className={styles.infoLabel}>Alamat:</span>
                    <span>{selectedPatient.address || "-"}</span>
                  </div>

                  <div className={styles.detailActions}>
                    <button
                      onClick={() => setIsEditing(true)}
                      className={styles.editBtnLarge}
                    >
                      <FiEdit2 size={16} />
                      Edit Data
                    </button>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className={styles.deleteBtnLarge}
                    >
                      <FiTrash2 size={16} />
                      Hapus Pasien
                    </button>
                  </div>
                </div>

                <div className={styles.historySection}>
                  <h3>Riwayat Kunjungan</h3>
                  {loadingHistory ? (
                    <div className={styles.loadingHistory}>
                      Memuat riwayat...
                    </div>
                  ) : medicalHistory.length > 0 ? (
                    <div className={styles.historyList}>
                      {medicalHistory.map((record) => (
                        <div key={record.id} className={styles.historyCard}>
                          <div className={styles.historyDate}>
                            {new Date(record.date).toLocaleDateString("id-ID", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </div>
                          <div className={styles.historyDetail}>
                            <p>
                              <strong>Poliklinik:</strong> {record.polyclinic}
                            </p>
                            <p>
                              <strong>Dokter:</strong> {record.doctor}
                            </p>
                            <p>
                              <strong>Diagnosis:</strong> {record.diagnosis}
                            </p>
                            {record.notes && (
                              <p>
                                <strong>Catatan:</strong> {record.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.noHistory}>
                      Belum ada riwayat kunjungan
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedPatient && (
        <div className={styles.modal} onClick={() => setShowDeleteModal(false)}>
          <div
            className={styles.deleteModalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.deleteModalHeader}>
              <FiAlertTriangle size={48} color="#dc2626" />
              <h2>Hapus Pasien</h2>
            </div>
            <p className={styles.deleteMessage}>
              Anda akan menghapus data pasien{" "}
              <strong>{selectedPatient.name}</strong>.
            </p>
            <p className={styles.deleteNote}>Pilih jenis penghapusan:</p>
            <div className={styles.deleteOptions}>
              <button
                onClick={() => handleDeletePatient(false)}
                className={styles.softDeleteBtn}
              >
                <FiTrash2 size={16} />
                Soft Delete
                <span className={styles.deleteHint}>Data bisa dipulihkan</span>
              </button>
              <button
                onClick={() => handleDeletePatient(true)}
                className={styles.permanentDeleteBtn}
              >
                <FiAlertTriangle size={16} />
                Hapus Permanen
                <span className={styles.deleteHint}>
                  Data tidak bisa dipulihkan
                </span>
              </button>
            </div>
            <button
              onClick={() => setShowDeleteModal(false)}
              className={styles.cancelDeleteBtn}
            >
              Batal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
