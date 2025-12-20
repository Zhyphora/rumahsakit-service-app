"use client";

import { useState, useEffect } from "react";
import { Polyclinic } from "@/types";
import styles from "./take-queue.module.css";
import Navbar from "@/components/Navbar";
import {
  FiClock,
  FiUser,
  FiActivity,
  FiCheckCircle,
  FiAlertCircle,
  FiPlus,
  FiCalendar,
} from "react-icons/fi";
import {
  FaTooth,
  FaStethoscope,
  FaChild,
  FaEye,
  FaHeadSideCough,
} from "react-icons/fa";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface AvailableDoctor {
  id: string;
  name: string;
  user?: {
    name: string;
  };
  specialization: string;
  schedule: any;
  completedToday: number;
  isServing: boolean;
  polyclinic: {
    id: string;
    name: string;
    code: string;
  };
}

// Icon mapper for polyclinics based on code or name
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

// Helper to check if doctor is available on specific date
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

  if (!daySchedule) {
    return { available: false, text: "Tidak Praktik" };
  }

  return {
    available: true,
    text: `${daySchedule.start} - ${daySchedule.end}`,
  };
};

export default function TakeQueuePage() {
  const [polyclinics, setPolyclinics] = useState<Polyclinic[]>([]);
  const [selectedPoly, setSelectedPoly] = useState<string>("");
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");

  // Tab State
  const [patientType, setPatientType] = useState<"existing" | "new">(
    "existing"
  );

  // Form State
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [bpjsNumber, setBpjsNumber] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [queueResult, setQueueResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [doctors, setDoctors] = useState<AvailableDoctor[]>([]);

  // State for date
  const [customQueueDate, setCustomQueueDate] = useState<Date>(new Date());

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = new Date(e.target.value);
    setCustomQueueDate(date);
    setSelectedDoctor("");
  };

  const handleSelectDoctor = (doctorId: string) => {
    setSelectedDoctor(doctorId);
  };

  useEffect(() => {
    fetch(`${API_URL}/queue/polyclinics`)
      .then((res) => res.json())
      .then(setPolyclinics)
      .catch(console.error);

    // Fetch ALL doctors to allow future booking
    fetch(`${API_URL}/doctors`)
      .then((res) => res.json())
      .then(setDoctors)
      .catch(console.error);
  }, []);

  // Filter doctors based on Poly AND Day of Week of selected date
  const selectedPolyDoctors = doctors
    .filter((doc) => doc.polyclinic?.id === selectedPoly)
    .map((doc) => ({
      ...doc,
      availability: isDoctorAvailableOnDate(doc.schedule, customQueueDate),
    }))
    .filter((doc) => doc.availability.available); // Only show doctors available on that day? Or show all with status? User asked to show list if available.

  const handleSelectPoly = (polyId: string) => {
    setSelectedPoly(polyId);
    setSelectedDoctor("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const dateStr = customQueueDate.toISOString().split("T")[0];

      const response = await fetch(`${API_URL}/queue/take`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          polyclinicId: selectedPoly,
          doctorId: selectedDoctor || undefined,
          patientName: patientType === "new" ? patientName : undefined,
          patientPhone: patientType === "new" ? patientPhone : undefined,
          bpjsNumber: bpjsNumber || undefined,
          // No password sent, backend will handle defaults
          queueDate: dateStr,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to take queue number");
      }

      const result = await response.json();
      setQueueResult(result);
      // Reset form
      setPatientName("");
      setPatientPhone("");
      setBpjsNumber("");
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewQueue = () => {
    setQueueResult(null);
    setSelectedPoly("");
    setSelectedDoctor("");
  };

  if (queueResult) {
    return (
      <div className={styles.container}>
        <div className={styles.ticketContainer}>
          <div className={styles.ticket}>
            <div className={styles.ticketHeader}>
              <div className={styles.brandName}>
                <FiActivity /> MediKu
              </div>
              <div className={styles.ticketLabel}>Nomor Antrian Anda</div>
            </div>

            <div className={styles.ticketNumberWrapper}>
              <div className={styles.queueNumber}>
                {queueResult.polyclinic?.code}-
                {String(queueResult.queueNumber).padStart(3, "0")}
              </div>
              <div className={styles.polyNameDisplay}>
                {queueResult.polyclinic?.name}
              </div>
            </div>

            <div className={styles.ticketInfo}>
              <div className={styles.infoRow}>
                <span className={styles.label}>Nama Pasien</span>
                <span className={styles.value}>
                  {queueResult.patient?.name}
                </span>
              </div>
              {queueResult.doctor && (
                <div className={styles.infoRow}>
                  <span className={styles.label}>Dokter</span>
                  <span className={styles.value}>
                    {queueResult.doctor?.user?.name || queueResult.doctor?.name}
                  </span>
                </div>
              )}
              <div className={styles.infoRow}>
                <span className={styles.label}>Waktu Daftar</span>
                <span className={styles.value}>
                  {new Date().toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.label}>Tanggal Periksa</span>
                <span className={styles.value}>
                  {new Date(
                    queueResult.queueDate || new Date()
                  ).toLocaleDateString("id-ID", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className={styles.infoRow} style={{ border: "none" }}>
                <span className={styles.label}>Estimasi Tunggu</span>
                <span className={styles.value}>
                  ~{Math.max(0, (queueResult.queueNumber - 1) * 15)} Menit
                </span>
              </div>

              <button onClick={handleNewQueue} className={styles.newQueueBtn}>
                <FiPlus /> Ambil Antrian Lain
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div style={{ paddingTop: "80px", paddingBottom: "40px" }}>
        <div className={styles.container}>
          <div className={styles.card}>
            <div className={styles.header}>
              <h1>Ambil Antrian</h1>
              <p>Pilih jadwal dan layanan medis</p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              {error && <div className={styles.error}>{error}</div>}

              {/* Date Selection - Native Picker */}
              <div className={styles.formGroup}>
                <label>
                  <FiCalendar /> Pilih Tanggal Kunjungan
                </label>
                <input
                  type="date"
                  className={styles.input}
                  value={customQueueDate.toISOString().split("T")[0]}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={handleDateChange}
                  required
                />
                <div
                  style={{
                    fontSize: "0.875rem",
                    color: "#64748b",
                    marginTop: "4px",
                  }}
                >
                  Terjadwal untuk:{" "}
                  <strong>
                    {customQueueDate?.toLocaleDateString("id-ID", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </strong>
                </div>
              </div>

              {/* Polyclinic Grid */}
              <div className={styles.formGroup}>
                <label>Pilih Poliklinik</label>
                <div className={styles.polyGrid}>
                  {polyclinics.map((poly) => (
                    <div
                      key={poly.id}
                      className={`${styles.polyBtn} ${
                        selectedPoly === poly.id ? styles.selected : ""
                      }`}
                      onClick={() => handleSelectPoly(poly.id)}
                    >
                      <div className={styles.polyIconWrapper}>
                        {getPolyIcon(poly.code)}
                      </div>
                      <span className={styles.polyName}>{poly.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Doctor Selection */}
              {selectedPoly && (
                <div className={styles.formGroup}>
                  <label>
                    Pilih Dokter
                    <span className={styles.subLabel}>
                      ({selectedPolyDoctors.length} Dokter Tersedia pada{" "}
                      {customQueueDate.toLocaleDateString("id-ID", {
                        weekday: "long",
                      })}
                      )
                    </span>
                  </label>

                  <div className={styles.doctorList}>
                    {selectedPolyDoctors.length > 0 ? (
                      selectedPolyDoctors.map((doctor) => (
                        <div
                          key={doctor.id}
                          className={`${styles.doctorCard} ${
                            selectedDoctor === doctor.id
                              ? styles.doctorSelected
                              : ""
                          }`}
                          onClick={() => handleSelectDoctor(doctor.id)}
                        >
                          <div className={styles.doctorAvatar}>
                            <FiUser />
                          </div>
                          <div className={styles.doctorInfo}>
                            <span className={styles.doctorName}>
                              {doctor.user?.name || doctor.name}
                            </span>
                            <span className={styles.doctorSpec}>
                              {doctor.specialization}
                            </span>
                            <div className={styles.scheduleBadge}>
                              <FiClock /> {doctor.availability.text}
                            </div>
                          </div>
                          <div className={styles.checkIcon}>
                            {selectedDoctor === doctor.id && <FiCheckCircle />}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className={styles.emptyState}>
                        Dokter tidak jadwal praktik pada hari ini.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Patient Form Tabs */}
              <div className={styles.formGroup}>
                <label>
                  <FiUser /> Data Pasien
                </label>
                <div className={styles.tabs}>
                  <button
                    type="button"
                    className={`${styles.tab} ${
                      patientType === "existing" ? styles.activeTab : ""
                    }`}
                    onClick={() => setPatientType("existing")}
                  >
                    Pasien Lama (BPJS)
                  </button>
                  <button
                    type="button"
                    className={`${styles.tab} ${
                      patientType === "new" ? styles.activeTab : ""
                    }`}
                    onClick={() => setPatientType("new")}
                  >
                    Pasien Baru
                  </button>
                </div>

                <div className={styles.tabContent}>
                  {patientType === "existing" ? (
                    <div className={styles.inputGroup}>
                      <label>
                        Nomor BPJS <span className={styles.required}>*</span>
                      </label>
                      <input
                        type="text"
                        value={bpjsNumber}
                        onChange={(e) => setBpjsNumber(e.target.value)}
                        className={styles.input}
                        placeholder="Masukkan Nomor BPJS"
                        required
                      />
                      <span className={styles.hint}>
                        Pastikan nomor BPJS sudah terdaftar di sistem.
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className={styles.inputGroup}>
                        <label>
                          Nama Lengkap{" "}
                          <span className={styles.required}>*</span>
                        </label>
                        <input
                          type="text"
                          value={patientName}
                          onChange={(e) => setPatientName(e.target.value)}
                          className={styles.input}
                          placeholder="Sesuai KTP"
                          required
                        />
                      </div>
                      <div className={styles.inputGroup}>
                        <label>
                          Nomor Telepon{" "}
                          <span className={styles.required}>*</span>
                        </label>
                        <input
                          type="tel"
                          value={patientPhone}
                          onChange={(e) => setPatientPhone(e.target.value)}
                          className={styles.input}
                          placeholder="08xx-xxxx-xxxx"
                          required
                        />
                      </div>
                      <div className={styles.inputGroup}>
                        <label>Nomor BPJS (Opsional)</label>
                        <input
                          type="text"
                          value={bpjsNumber}
                          onChange={(e) => setBpjsNumber(e.target.value)}
                          className={styles.input}
                          placeholder="Jika ada"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={
                  isLoading ||
                  !selectedPoly ||
                  !selectedDoctor ||
                  (patientType === "existing" && !bpjsNumber) ||
                  (patientType === "new" && (!patientName || !patientPhone))
                }
              >
                {isLoading ? "Memproses..." : "Ambil Nomor Antrian"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
