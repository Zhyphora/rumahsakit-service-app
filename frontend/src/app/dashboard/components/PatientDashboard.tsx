"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";
import {
  FiClock,
  FiFileText,
  FiUser,
  FiActivity,
  FiCalendar,
  FiX,
  FiPlusCircle,
  FiCheckCircle,
} from "react-icons/fi";
import {
  FaTooth,
  FaStethoscope,
  FaChild,
  FaEye,
  FaHeadSideCough,
} from "react-icons/fa";
import { MdLocalHospital, MdMedication } from "react-icons/md";
import { MedicalRecord, Patient, Polyclinic } from "@/types";
import styles from "./PatientDashboard.module.css";
import toast from "react-hot-toast";

interface AvailableDoctor {
  id: string;
  name: string;
  user?: { name: string };
  specialization: string;
  schedule: any;
  polyclinic: { id: string; name: string; code: string };
}

const getPolyIcon = (code: string) => {
  switch (code) {
    case "PA":
      return <FaChild />;
    case "PG":
      return <FaTooth />;
    case "PM":
      return <FaEye />;
    case "PT":
      return <FaHeadSideCough />;
    default:
      return <FaStethoscope />;
  }
};

const isDoctorAvailableOnDate = (
  schedule: any,
  date: Date
): { available: boolean; text: string } => {
  if (!schedule) return { available: true, text: "Tersedia" };
  const dayNames = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const dayName = dayNames[date.getDay()];
  const daySchedule = schedule[dayName];
  if (!daySchedule) return { available: false, text: "Tidak Praktik" };
  return { available: true, text: `${daySchedule.start} - ${daySchedule.end}` };
};

export default function PatientDashboard() {
  const { user } = useAuth();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(
    null
  );

  // My Queues State
  const [myQueues, setMyQueues] = useState<any[]>([]);

  // Queue Modal State
  const [showQueueModal, setShowQueueModal] = useState(false);
  const [polyclinics, setPolyclinics] = useState<Polyclinic[]>([]);
  const [doctors, setDoctors] = useState<AvailableDoctor[]>([]);
  const [selectedPoly, setSelectedPoly] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [queueDate, setQueueDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [queueResult, setQueueResult] = useState<any>(null);

  const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001";
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    loadData();

    // Setup WebSocket for real-time updates
    const socket = io(WS_URL);
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Patient Dashboard: WebSocket connected");
      // Join patient-specific room if we have patient ID
      if (user?.id) {
        socket.emit("join:patient", user.id);
      }
    });

    // Listen for queue updates
    socket.on("queue:update", () => {
      console.log("Queue update received");
      loadData();
    });

    // Listen for medical record updates
    socket.on("medical-record:update", () => {
      console.log("Medical record update received");
      loadData();
    });

    // Listen for prescription updates
    socket.on("prescription:update", () => {
      console.log("Prescription update received");
      loadData();
    });

    return () => {
      socket.close();
    };
  }, [user]);

  const loadData = async () => {
    try {
      const [recordsRes, queueRes, profileRes] = await Promise.all([
        api.get("/medical-records/my-records"),
        api.get("/queue/my"),
        api.get("/patients/my-profile"),
      ]);
      setMedicalRecords(recordsRes.data);
      setMyQueues(Array.isArray(queueRes.data) ? queueRes.data : []);
      // Set patient from profile endpoint
      if (profileRes.data?.data) {
        setPatient(profileRes.data.data);
      } else if (recordsRes.data.length > 0) {
        setPatient(recordsRes.data[0].patient);
      }
    } catch (error) {
      console.error("Error loading patient data", error);
    } finally {
      setIsLoading(false);
    }
  };

  const openQueueModal = async () => {
    setShowQueueModal(true);
    setQueueResult(null);
    setSelectedPoly("");
    setSelectedDoctor("");
    try {
      const [polyRes, docRes] = await Promise.all([
        api.get("/queue/polyclinics"),
        api.get("/doctors"),
      ]);
      setPolyclinics(polyRes.data);
      setDoctors(docRes.data);
    } catch (error) {
      toast.error("Gagal memuat data poliklinik");
    }
  };

  const closeQueueModal = () => {
    setShowQueueModal(false);
    setQueueResult(null);
  };

  const handleSubmitQueue = async () => {
    if (!selectedPoly || !selectedDoctor) {
      toast.error("Pilih poliklinik dan dokter terlebih dahulu");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await api.post("/queue/take", {
        polyclinicId: selectedPoly,
        doctorId: selectedDoctor,
        bpjsNumber: patient?.bpjsNumber || undefined,
        queueDate: queueDate,
      });
      setQueueResult(response.data);
      toast.success("Antrian berhasil diambil!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal mengambil antrian");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedDateObj = new Date(queueDate);
  const filteredDoctors = doctors
    .filter((doc) => doc.polyclinic?.id === selectedPoly)
    .map((doc) => ({
      ...doc,
      availability: isDoctorAvailableOnDate(doc.schedule, selectedDateObj),
    }))
    .filter((doc) => doc.availability.available);

  if (isLoading)
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );

  return (
    <div className={styles.container}>
      {/* Welcome Section */}
      <div className={styles.welcomeSection}>
        <h1>Halo, {user?.name}</h1>
        <p>
          Semoga Anda selalu dalam keadaan sehat. Berikut adalah ringkasan
          kesehatan Anda.
        </p>
      </div>

      {/* Info Cards */}
      <div className={styles.cardGrid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <FiUser size={24} />
            </div>
            <div className={styles.cardTitle}>Profil Pasien</div>
          </div>
          <div className={styles.cardContent}>
            <div className={styles.infoRow}>
              <span className={styles.label}>No. RM</span>
              <span className={styles.value}>
                {patient?.medicalRecordNumber || "-"}
              </span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>BPJS</span>
              <span className={styles.value}>
                {patient?.bpjsNumber || "Tidak ada"}
              </span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.label}>Tgl Lahir</span>
              <span className={styles.value}>
                {patient?.dateOfBirth
                  ? new Date(patient.dateOfBirth).toLocaleDateString("id-ID")
                  : "-"}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <FiClock size={24} />
            </div>
            <div className={styles.cardTitle}>Antrian Saat Ini</div>
          </div>
          <div className={styles.cardContent}>
            {myQueues.length > 0 ? (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {myQueues.map((queue) => (
                  <div
                    key={queue.id}
                    style={{
                      padding: 16,
                      borderRadius: 12,
                      background: "#ecfdf5",
                      border: "1px solid #a7f3d0",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "2rem",
                        fontWeight: 800,
                        color: "#10b981",
                        marginBottom: 4,
                      }}
                    >
                      {queue.polyclinic?.code}-
                      {String(queue.queueNumber).padStart(3, "0")}
                    </div>
                    <div
                      style={{
                        fontWeight: 600,
                        color: "#111827",
                        marginBottom: 4,
                      }}
                    >
                      {queue.polyclinic?.name}
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        color: "#6b7280",
                        marginBottom: 4,
                      }}
                    >
                      Dokter:{" "}
                      {queue.doctor?.user?.name || queue.doctor?.name || "-"}
                    </div>
                    <div style={{ fontSize: 14, color: "#6b7280" }}>
                      <FiCalendar
                        style={{ marginRight: 4, verticalAlign: "middle" }}
                      />
                      {new Date(queue.queueDate).toLocaleDateString("id-ID", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </div>
                    <div
                      style={{
                        marginTop: 8,
                        padding: "4px 8px",
                        fontSize: 12,
                        fontWeight: 600,
                        borderRadius: 6,
                        display: "inline-block",
                        background:
                          queue.status === "waiting"
                            ? "#fef9c3"
                            : queue.status === "called"
                            ? "#bfdbfe"
                            : queue.status === "serving"
                            ? "#a7f3d0"
                            : "#f1f5f9",
                        color:
                          queue.status === "waiting"
                            ? "#854d0e"
                            : queue.status === "called"
                            ? "#1e40af"
                            : queue.status === "serving"
                            ? "#166534"
                            : "#64748b",
                      }}
                    >
                      {queue.status === "waiting"
                        ? "Menunggu"
                        : queue.status === "called"
                        ? "Dipanggil"
                        : queue.status === "serving"
                        ? "Sedang Dilayani"
                        : queue.status}
                    </div>
                  </div>
                ))}
                <button onClick={openQueueModal} className={styles.queueBtn}>
                  <FiPlusCircle size={18} />
                  Ambil Antrian Lain
                </button>
              </div>
            ) : (
              <>
                <p style={{ marginBottom: 16, color: "#6b7280" }}>
                  Anda belum mengambil antrian.
                </p>
                <button onClick={openQueueModal} className={styles.queueBtn}>
                  <FiPlusCircle size={18} />
                  Ambil Antrian
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Medical History */}
      <div className={styles.tableSection}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>
            <FiActivity style={{ marginRight: 8, verticalAlign: "middle" }} />
            Riwayat Rekam Medis
          </div>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Poliklinik</th>
                <th>Dokter</th>
                <th>Diagnosa</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {medicalRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: 24 }}>
                    Belum ada riwayat medis
                  </td>
                </tr>
              ) : (
                medicalRecords.map((record) => (
                  <tr key={record.id}>
                    <td>
                      {new Date(record.visitDate).toLocaleDateString("id-ID", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </td>
                    <td>{record.polyclinic?.name}</td>
                    <td>{record.doctor?.user?.name || "Dokter"}</td>
                    <td>{record.diagnosis}</td>
                    <td>
                      <button
                        className={styles.actionBtn}
                        onClick={() => setSelectedRecord(record)}
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedRecord && (
        <div
          className={styles.modalOverlay}
          onClick={() => setSelectedRecord(null)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2>Detail Kunjungan</h2>
              <button
                className={styles.closeBtn}
                onClick={() => setSelectedRecord(null)}
              >
                <FiX size={24} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.detailSection}>
                <div className={styles.detailTitle}>
                  <FiCalendar style={{ marginRight: 6 }} /> Tanggal & Tempat
                </div>
                <div className={styles.detailText}>
                  <strong>
                    {new Date(selectedRecord.visitDate).toLocaleDateString(
                      "id-ID",
                      {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </strong>
                  <br />
                  {selectedRecord.polyclinic?.name} -{" "}
                  {selectedRecord.doctor?.user?.name}
                </div>
              </div>

              <div className={styles.detailSection}>
                <div className={styles.detailTitle}>
                  <FiActivity style={{ marginRight: 6 }} /> Diagnosa
                </div>
                <div className={styles.detailText}>
                  {selectedRecord.diagnosis}
                </div>
              </div>

              <div className={styles.detailSection}>
                <div className={styles.detailTitle}>
                  <MdLocalHospital style={{ marginRight: 6 }} /> Tindakan
                </div>
                <div className={styles.detailText}>
                  {selectedRecord.actions || "-"}
                </div>
              </div>

              <div className={styles.detailSection}>
                <div className={styles.detailTitle}>
                  <MdMedication style={{ marginRight: 6 }} /> Resep Obat
                </div>
                <div
                  className={styles.detailText}
                  style={{ padding: 0, overflow: "hidden" }}
                >
                  {selectedRecord.prescriptions &&
                  selectedRecord.prescriptions.length > 0 ? (
                    <ul className={styles.medicineList}>
                      {selectedRecord.prescriptions.map((pres) =>
                        pres.items?.map((item) => (
                          <li key={item.id} className={styles.medicineItem}>
                            <div>
                              <div className={styles.medName}>
                                {item.item?.name}
                              </div>
                              <div className={styles.medQty}>
                                {item.quantity} {item.item?.unit}{" "}
                                <span className={styles.medNotes}>
                                  {item.notes}
                                </span>
                              </div>
                            </div>
                          </li>
                        ))
                      )}
                    </ul>
                  ) : (
                    <div style={{ padding: 12 }}>Tidak ada resep</div>
                  )}
                </div>
              </div>

              {selectedRecord.notes && (
                <div className={styles.detailSection}>
                  <div className={styles.detailTitle}>
                    <FiFileText style={{ marginRight: 6 }} /> Catatan Dokter
                  </div>
                  <div className={styles.detailText}>
                    {selectedRecord.notes}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Queue Booking Modal */}
      {showQueueModal && (
        <div className={styles.modalOverlay} onClick={closeQueueModal}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.modalHeader}>
              <h2>{queueResult ? "Antrian Berhasil" : "Ambil Antrian"}</h2>
              <button className={styles.closeBtn} onClick={closeQueueModal}>
                <FiX size={24} />
              </button>
            </div>
            <div className={styles.modalBody}>
              {queueResult ? (
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: "4rem",
                      fontWeight: 800,
                      color: "#10b981",
                      marginBottom: 8,
                    }}
                  >
                    {queueResult.polyclinic?.code}-
                    {String(queueResult.queueNumber).padStart(3, "0")}
                  </div>
                  <div style={{ color: "#6b7280", marginBottom: 16 }}>
                    {queueResult.polyclinic?.name}
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <strong>Dokter:</strong>{" "}
                    {queueResult.doctor?.user?.name ||
                      queueResult.doctor?.name ||
                      "-"}
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <strong>Tanggal:</strong>{" "}
                    {new Date(queueResult.queueDate).toLocaleDateString(
                      "id-ID",
                      {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}
                  </div>
                  <button onClick={closeQueueModal} className={styles.queueBtn}>
                    Tutup
                  </button>
                </div>
              ) : (
                <>
                  {/* Date Selection */}
                  <div className={styles.detailSection}>
                    <div className={styles.detailTitle}>
                      <FiCalendar style={{ marginRight: 6 }} /> Pilih Tanggal
                    </div>
                    <input
                      type="date"
                      value={queueDate}
                      min={new Date().toISOString().split("T")[0]}
                      onChange={(e) => {
                        setQueueDate(e.target.value);
                        setSelectedDoctor("");
                      }}
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        fontSize: "16px",
                      }}
                    />
                  </div>

                  {/* Polyclinic Selection */}
                  <div className={styles.detailSection}>
                    <div className={styles.detailTitle}>Pilih Poliklinik</div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(120px, 1fr))",
                        gap: "12px",
                      }}
                    >
                      {polyclinics.map((poly) => (
                        <div
                          key={poly.id}
                          onClick={() => {
                            setSelectedPoly(poly.id);
                            setSelectedDoctor("");
                          }}
                          style={{
                            padding: "16px",
                            borderRadius: "12px",
                            border:
                              selectedPoly === poly.id
                                ? "2px solid #10b981"
                                : "2px solid #e5e7eb",
                            background:
                              selectedPoly === poly.id ? "#ecfdf5" : "white",
                            cursor: "pointer",
                            textAlign: "center",
                            transition: "all 0.2s",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "24px",
                              marginBottom: "8px",
                              color:
                                selectedPoly === poly.id
                                  ? "#10b981"
                                  : "#6b7280",
                            }}
                          >
                            {getPolyIcon(poly.code)}
                          </div>
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: 600,
                              color: "#374151",
                            }}
                          >
                            {poly.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Doctor Selection */}
                  {selectedPoly && (
                    <div className={styles.detailSection}>
                      <div className={styles.detailTitle}>
                        Pilih Dokter ({filteredDoctors.length} tersedia)
                      </div>
                      {filteredDoctors.length > 0 ? (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "12px",
                          }}
                        >
                          {filteredDoctors.map((doc) => (
                            <div
                              key={doc.id}
                              onClick={() => setSelectedDoctor(doc.id)}
                              style={{
                                padding: "16px",
                                borderRadius: "12px",
                                border:
                                  selectedDoctor === doc.id
                                    ? "2px solid #10b981"
                                    : "2px solid #e5e7eb",
                                background:
                                  selectedDoctor === doc.id
                                    ? "#ecfdf5"
                                    : "white",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                              }}
                            >
                              <div
                                style={{
                                  width: "48px",
                                  height: "48px",
                                  borderRadius: "12px",
                                  background:
                                    selectedDoctor === doc.id
                                      ? "#10b981"
                                      : "#ecfdf5",
                                  color:
                                    selectedDoctor === doc.id
                                      ? "white"
                                      : "#10b981",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <FiUser size={24} />
                              </div>
                              <div style={{ flex: 1 }}>
                                <div
                                  style={{ fontWeight: 600, color: "#111827" }}
                                >
                                  {doc.user?.name || doc.name}
                                </div>
                                <div
                                  style={{ fontSize: "14px", color: "#6b7280" }}
                                >
                                  {doc.specialization}
                                </div>
                                <div
                                  style={{ fontSize: "12px", color: "#10b981" }}
                                >
                                  <FiClock
                                    style={{
                                      marginRight: 4,
                                      verticalAlign: "middle",
                                    }}
                                  />
                                  {doc.availability.text}
                                </div>
                              </div>
                              {selectedDoctor === doc.id && (
                                <FiCheckCircle size={24} color="#10b981" />
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div
                          style={{
                            padding: "24px",
                            textAlign: "center",
                            color: "#6b7280",
                            background: "#f9fafb",
                            borderRadius: "12px",
                          }}
                        >
                          Tidak ada dokter tersedia pada hari ini
                        </div>
                      )}
                    </div>
                  )}

                  <button
                    onClick={handleSubmitQueue}
                    disabled={!selectedPoly || !selectedDoctor || isSubmitting}
                    className={styles.queueBtn}
                    style={{
                      opacity:
                        !selectedPoly || !selectedDoctor || isSubmitting
                          ? 0.5
                          : 1,
                      cursor:
                        !selectedPoly || !selectedDoctor || isSubmitting
                          ? "not-allowed"
                          : "pointer",
                    }}
                  >
                    {isSubmitting ? "Memproses..." : "Ambil Nomor Antrian"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
