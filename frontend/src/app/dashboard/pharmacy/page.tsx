"use client";

import { useState, useEffect } from "react";
import api from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import styles from "./pharmacy.module.css";
import Swal from "sweetalert2";
import { FiAlertCircle } from "react-icons/fi";

interface PrescriptionItem {
  id: string;
  item: { id: string; name: string; unit: string };
  quantity: number;
  dosage: string;
  instructions: string;
}

interface Prescription {
  id: string;
  patient: { id: string; name: string; medicalRecordNumber: string };
  doctor: { user: { name: string }; specialization: string };
  diagnosis: string;
  notes: string;
  status: string;
  items: PrescriptionItem[];
  createdAt: string;
}

interface StaffInfo {
  department: string;
  position: string;
}

export default function PharmacyPage() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPrescription, setSelectedPrescription] =
    useState<Prescription | null>(null);
  const [dispensing, setDispensing] = useState(false);
  const [staffInfo, setStaffInfo] = useState<StaffInfo | null>(null);

  // Check if user is pharmacist (from staff info or admin)
  const isPharmacist =
    staffInfo?.department === "Farmasi" ||
    staffInfo?.position === "Apoteker" ||
    user?.role === "admin";

  useEffect(() => {
    loadPrescriptions();
    // Refresh every 10 seconds
    const interval = setInterval(loadPrescriptions, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadPrescriptions = async () => {
    try {
      const res = await api.get("/prescriptions/pending");
      setPrescriptions(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to load prescriptions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDispense = async (id: string) => {
    // Only pharmacists can dispense
    if (!isPharmacist && user?.role !== "admin") {
      Swal.fire({
        icon: "error",
        title: "Akses Ditolak",
        text: "Hanya Apoteker yang dapat menyerahkan obat",
        confirmButtonColor: "#dc2626",
      });
      return;
    }

    const result = await Swal.fire({
      title: "Konfirmasi Penyerahan Obat",
      html: `
        <p>Apakah Anda yakin ingin menyerahkan obat untuk pasien:</p>
        <p><strong>${selectedPrescription?.patient.name}</strong></p>
        <p style="font-size: 0.9rem; color: #666;">No. RM: ${selectedPrescription?.patient.medicalRecordNumber}</p>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#16a34a",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Ya, Serahkan Obat",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    setDispensing(true);
    try {
      await api.post(`/prescriptions/${id}/dispense`);

      Swal.fire({
        icon: "success",
        title: "Berhasil!",
        text: "Obat telah diserahkan kepada pasien",
        confirmButtonColor: "#16a34a",
        timer: 2000,
        showConfirmButton: false,
      });

      setSelectedPrescription(null);
      loadPrescriptions();
    } catch (error: any) {
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: error.response?.data?.message || "Gagal menyerahkan obat",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setDispensing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  // Show access denied if not pharmacist
  if (!isPharmacist && user?.role !== "admin") {
    return (
      <div className={styles.container}>
        <div className={styles.accessDenied}>
          <FiAlertCircle size={48} />
          <h2>Akses Ditolak</h2>
          <p>Halaman ini hanya dapat diakses oleh bagian Farmasi/Apoteker</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Antrian Farmasi</h1>
        <span className={styles.badge}>{prescriptions.length} menunggu</span>
      </div>

      {prescriptions.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Tidak ada resep yang menunggu</p>
        </div>
      ) : (
        <div className={styles.prescriptionList}>
          {prescriptions.map((prescription) => (
            <div
              key={prescription.id}
              className={styles.prescriptionCard}
              onClick={() => setSelectedPrescription(prescription)}
            >
              <div className={styles.patientInfo}>
                <span className={styles.patientName}>
                  {prescription.patient.name}
                </span>
                <span className={styles.mrn}>
                  {prescription.patient.medicalRecordNumber}
                </span>
              </div>
              <div className={styles.doctorInfo}>
                <span>Dr. {prescription.doctor.user.name}</span>
                <span className={styles.time}>
                  {formatDate(prescription.createdAt)}
                </span>
              </div>
              <div className={styles.itemCount}>
                {prescription.items.length} item obat
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Prescription Detail Modal */}
      {selectedPrescription && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Detail Resep</h2>
              <button
                onClick={() => setSelectedPrescription(null)}
                className={styles.closeBtn}
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.patientDetail}>
                <h3>{selectedPrescription.patient.name}</h3>
                <p>
                  No. RM: {selectedPrescription.patient.medicalRecordNumber}
                </p>
                <p>Dokter: Dr. {selectedPrescription.doctor.user.name}</p>
              </div>

              {selectedPrescription.diagnosis && (
                <div className={styles.diagnosis}>
                  <strong>Diagnosis:</strong>
                  <p>{selectedPrescription.diagnosis}</p>
                </div>
              )}

              <div className={styles.itemsList}>
                <h4>Daftar Obat</h4>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Nama Obat</th>
                      <th>Jumlah</th>
                      <th>Dosis</th>
                      <th>Aturan Pakai</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPrescription.items.map((item) => (
                      <tr key={item.id}>
                        <td>{item.item.name}</td>
                        <td>
                          {item.quantity} {item.item.unit}
                        </td>
                        <td>{item.dosage || "-"}</td>
                        <td>{item.instructions || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedPrescription.notes && (
                <div className={styles.notes}>
                  <strong>Catatan:</strong>
                  <p>{selectedPrescription.notes}</p>
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button
                onClick={() => setSelectedPrescription(null)}
                className={`${styles.btn} ${styles.btnSecondary}`}
              >
                Tutup
              </button>
              <button
                onClick={() => handleDispense(selectedPrescription.id)}
                disabled={dispensing}
                className={`${styles.btn} ${styles.btnPrimary}`}
              >
                {dispensing ? "Memproses..." : "Serahkan Obat"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
