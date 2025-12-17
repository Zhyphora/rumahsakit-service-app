"use client";

import { useState, useEffect } from "react";
import { Polyclinic } from "@/types";
import styles from "./take-queue.module.css";
import {
  FiClock,
  FiUser,
  FiAlertCircle,
  FiCheckCircle,
  FiMonitor,
} from "react-icons/fi";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface AvailableDoctor {
  id: string;
  name: string;
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

// Helper to check if doctor is available now based on schedule
const isDoctorAvailable = (
  schedule: any
): { available: boolean; scheduleText: string } => {
  if (!schedule) return { available: true, scheduleText: "Tersedia" };

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();
  const currentTime = currentHour * 60 + currentMinutes;

  // If schedule is a string like "08:00 - 14:00" or "13:00 - 20:00"
  if (typeof schedule === "string") {
    const match = schedule.match(/(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})/);
    if (match) {
      const startTime = parseInt(match[1]) * 60 + parseInt(match[2]);
      const endTime = parseInt(match[3]) * 60 + parseInt(match[4]);

      if (currentTime >= startTime && currentTime <= endTime) {
        return { available: true, scheduleText: schedule };
      } else if (currentTime < startTime) {
        return {
          available: true,
          scheduleText: `Mulai ${match[1]}:${match[2]}`,
        };
      } else {
        return { available: false, scheduleText: `Sudah tutup (${schedule})` };
      }
    }
    return { available: true, scheduleText: schedule };
  }

  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const today = days[now.getDay()];

  const todaySchedule = schedule[today];
  if (!todaySchedule)
    return { available: false, scheduleText: "Tidak bertugas hari ini" };

  const [startHour, startMin] = todaySchedule.start.split(":").map(Number);
  const [endHour, endMin] = todaySchedule.end.split(":").map(Number);
  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;

  const scheduleText = `${todaySchedule.start} - ${todaySchedule.end}`;

  if (currentTime >= startTime && currentTime <= endTime) {
    return { available: true, scheduleText };
  } else if (currentTime < startTime) {
    return { available: true, scheduleText: `Mulai ${todaySchedule.start}` };
  } else {
    return { available: false, scheduleText: `Sudah tutup (${scheduleText})` };
  }
};

export default function TakeQueuePage() {
  const [polyclinics, setPolyclinics] = useState<Polyclinic[]>([]);
  const [selectedPoly, setSelectedPoly] = useState<string>("");
  const [selectedDoctor, setSelectedDoctor] = useState<string>("");
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [bpjsNumber, setBpjsNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [queueResult, setQueueResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [doctors, setDoctors] = useState<AvailableDoctor[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/queue/polyclinics`)
      .then((res) => res.json())
      .then(setPolyclinics)
      .catch(console.error);

    fetch(`${API_URL}/doctors/available`)
      .then((res) => res.json())
      .then(setDoctors)
      .catch(console.error);
  }, []);

  // Get doctors for selected polyclinic with availability check
  const selectedPolyDoctors = doctors
    .filter((doc) => doc.polyclinic?.id === selectedPoly)
    .map((doc) => ({
      ...doc,
      ...isDoctorAvailable(doc.schedule),
    }));

  // Get available doctors count
  const availableDoctorsCount = selectedPolyDoctors.filter(
    (d) => d.available
  ).length;

  const handleSelectPoly = (polyId: string) => {
    setSelectedPoly(polyId);
    setSelectedDoctor(""); // Reset doctor when changing polyclinic
  };

  const handleSelectDoctor = (doctorId: string, available: boolean) => {
    if (available) {
      setSelectedDoctor(doctorId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/queue/take`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          polyclinicId: selectedPoly,
          doctorId: selectedDoctor || undefined,
          patientName,
          patientPhone,
          bpjsNumber: bpjsNumber || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to take queue number");
      }

      const result = await response.json();
      setQueueResult(result);
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

  // Estimate wait time based on queue position (15 min per patient)
  const estimatedWaitMinutes = queueResult
    ? Math.max(0, (queueResult.queueNumber - 1) * 15)
    : 0;

  if (queueResult) {
    return (
      <div className={styles.container}>
        <div className={styles.ticket}>
          <div className={styles.ticketHeader}>
            <h1>Rumah Sakit</h1>
            <p>Nomor Antrian Anda</p>
          </div>
          <div className={styles.ticketNumber}>
            {queueResult.polyclinic?.code}-
            {String(queueResult.queueNumber).padStart(3, "0")}
          </div>
          <div className={styles.ticketInfo}>
            <p>
              <strong>Poliklinik:</strong> {queueResult.polyclinic?.name}
            </p>
            <p>
              <strong>Nama:</strong> {queueResult.patient?.name}
            </p>
            {queueResult.doctor && (
              <p>
                <strong>Dokter:</strong>{" "}
                {queueResult.doctor?.user?.name || queueResult.doctor?.name}
              </p>
            )}
            <p>
              <strong>Tanggal:</strong> {new Date().toLocaleDateString("id-ID")}
            </p>
            <p>
              <strong>Waktu:</strong> {new Date().toLocaleTimeString("id-ID")}
            </p>
          </div>

          {/* Monitor Guidance */}
          <div className={styles.monitorGuidance}>
            <FiMonitor size={32} />
            <div className={styles.monitorText}>
              <strong>Perhatikan Monitor</strong>
              <span>
                Silakan pantau layar monitor untuk mengetahui kapan nomor
                antrian Anda dipanggil
              </span>
              {estimatedWaitMinutes > 0 && (
                <span className={styles.estimatedTime}>
                  <FiClock size={14} /> Perkiraan tunggu: ~
                  {estimatedWaitMinutes} menit
                </span>
              )}
            </div>
          </div>

          <div className={styles.ticketNote}>
            Harap datang tepat waktu dan tunjukkan nomor antrian ini
          </div>
          <button onClick={handleNewQueue} className={styles.newBtn}>
            Ambil Antrian Baru
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1>Ambil Nomor Antrian</h1>
          <p>Silakan isi data berikut untuk mengambil nomor antrian</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.formGroup}>
            <label>Pilih Poliklinik</label>
            <div className={styles.polyGrid}>
              {polyclinics.map((poly) => (
                <button
                  key={poly.id}
                  type="button"
                  className={`${styles.polyBtn} ${
                    selectedPoly === poly.id ? styles.selected : ""
                  }`}
                  onClick={() => handleSelectPoly(poly.id)}
                >
                  <span className={styles.polyCode}>{poly.code}</span>
                  <span className={styles.polyName}>{poly.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Doctor Selection */}
          {selectedPoly && (
            <div className={styles.doctorSection}>
              <label>
                Pilih Dokter
                {availableDoctorsCount > 0 && (
                  <span className={styles.availableCount}>
                    ({availableDoctorsCount} tersedia)
                  </span>
                )}
              </label>
              {selectedPolyDoctors.length > 0 ? (
                <div className={styles.doctorList}>
                  {selectedPolyDoctors.map((doctor) => (
                    <div
                      key={doctor.id}
                      className={`${styles.doctorCard} ${
                        selectedDoctor === doctor.id
                          ? styles.doctorSelected
                          : ""
                      } ${!doctor.available ? styles.doctorUnavailable : ""}`}
                      onClick={() =>
                        handleSelectDoctor(doctor.id, doctor.available)
                      }
                    >
                      <div className={styles.doctorAvatar}>
                        <FiUser size={20} />
                      </div>
                      <div className={styles.doctorInfo}>
                        <span className={styles.doctorName}>{doctor.name}</span>
                        <span className={styles.doctorSpec}>
                          {doctor.specialization}
                        </span>
                        <span className={styles.doctorSchedule}>
                          <FiClock size={12} /> {doctor.scheduleText}
                        </span>
                      </div>
                      <div className={styles.doctorStatus}>
                        {doctor.available ? (
                          <span className={styles.statusReady}>
                            <FiCheckCircle size={14} /> Tersedia
                          </span>
                        ) : (
                          <span className={styles.statusUnavailable}>
                            <FiAlertCircle size={14} /> Tidak Tersedia
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.noDoctor}>
                  Tidak ada dokter untuk poliklinik ini
                </div>
              )}
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="patientName">Nama Lengkap *</label>
            <input
              id="patientName"
              type="text"
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className={styles.input}
              placeholder="Masukkan nama lengkap"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="patientPhone">Nomor Telepon</label>
            <input
              id="patientPhone"
              type="tel"
              value={patientPhone}
              onChange={(e) => setPatientPhone(e.target.value)}
              className={styles.input}
              placeholder="08xxxxxxxxxx"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="bpjsNumber">Nomor BPJS (Opsional)</label>
            <input
              id="bpjsNumber"
              type="text"
              value={bpjsNumber}
              onChange={(e) => setBpjsNumber(e.target.value)}
              className={styles.input}
              placeholder="Masukkan nomor BPJS jika ada"
              maxLength={13}
            />
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isLoading || !selectedPoly || !patientName}
          >
            {isLoading ? "Memproses..." : "Ambil Nomor Antrian"}
          </button>
        </form>
      </div>
    </div>
  );
}
