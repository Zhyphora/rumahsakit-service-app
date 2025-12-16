"use client";

import { useState, useEffect } from "react";
import api from "@/services/api";
import { Patient } from "@/types";
import styles from "./patients.module.css";

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [newPatient, setNewPatient] = useState({
    name: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
  });

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const response = await api.get("/patients");
      setPatients(response.data);
    } catch (error) {
      console.error("Failed to load patients:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      const response = await api.get(`/patients?search=${searchTerm}`);
      setPatients(response.data);
    } catch (error) {
      console.error("Search failed:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/patients", newPatient);
      setShowModal(false);
      setNewPatient({
        name: "",
        phone: "",
        dateOfBirth: "",
        gender: "",
        address: "",
      });
      loadPatients();
    } catch (error) {
      alert("Gagal menambah pasien");
    }
  };

  const filteredPatients = patients.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.medicalRecordNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.phone && p.phone.includes(searchTerm))
  );

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
        <h1 className={styles.title}>Data Pasien</h1>
        <button onClick={() => setShowModal(true)} className={styles.addBtn}>
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
            </tr>
          </thead>
          <tbody>
            {filteredPatients.map((patient) => (
              <tr key={patient.id}>
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
              </tr>
            ))}
          </tbody>
        </table>

        {filteredPatients.length === 0 && (
          <div className={styles.emptyState}>Tidak ada pasien ditemukan</div>
        )}
      </div>

      {showModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h2>Tambah Pasien Baru</h2>
            <form onSubmit={handleSubmit}>
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
                  onClick={() => setShowModal(false)}
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
    </div>
  );
}
