"use client";

import { useState, useEffect } from "react";
import { Polyclinic } from "@/types";
import styles from "./take-queue.module.css";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

interface AvailableDoctor {
  id: string;
  name: string;
  specialization: string;
  schedule: string;
  completedToday: number;
  isServing: boolean;
  polyclinic: {
    id: string;
    name: string;
    code: string;
  };
}

export default function TakeQueuePage() {
  const [polyclinics, setPolyclinics] = useState<Polyclinic[]>([]);
  const [selectedPoly, setSelectedPoly] = useState<string>("");
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [queueResult, setQueueResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [doctors, setDoctors] = useState<AvailableDoctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/queue/polyclinics`)
      .then((res) => res.json())
      .then(setPolyclinics)
      .catch(console.error);

    // Load available doctors
    fetch(`${API_URL}/doctors/available`)
      .then((res) => res.json())
      .then(setDoctors)
      .catch(console.error);
  }, []);

  // Get doctors for selected polyclinic
  const selectedPolyDoctors = doctors.filter(
    (doc) => doc.polyclinic?.id === selectedPoly
  );

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
          patientName,
          patientPhone,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to take queue number");
      }

      const result = await response.json();
      setQueueResult(result);
      setPatientName("");
      setPatientPhone("");
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewQueue = () => {
    setQueueResult(null);
    setSelectedPoly("");
  };

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
            <p>
              <strong>Tanggal:</strong> {new Date().toLocaleDateString("id-ID")}
            </p>
            <p>
              <strong>Waktu:</strong> {new Date().toLocaleTimeString("id-ID")}
            </p>
          </div>
          <div className={styles.ticketNote}>
            Harap menunggu nomor antrian Anda dipanggil
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
                  onClick={() => setSelectedPoly(poly.id)}
                >
                  <span className={styles.polyCode}>{poly.code}</span>
                  <span className={styles.polyName}>{poly.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Show doctors for selected polyclinic */}
          {selectedPoly && (
            <div className={styles.doctorSection}>
              <label>Dokter Bertugas</label>
              {selectedPolyDoctors.length > 0 ? (
                <div className={styles.doctorList}>
                  {selectedPolyDoctors.map((doctor) => (
                    <div key={doctor.id} className={styles.doctorCard}>
                      <div className={styles.doctorAvatar}>
                        {doctor.name.charAt(0)}
                      </div>
                      <div className={styles.doctorInfo}>
                        <span className={styles.doctorName}>{doctor.name}</span>
                        <span className={styles.doctorSpec}>
                          {doctor.specialization}
                        </span>
                        <span className={styles.doctorSchedule}>
                          ⏰ {doctor.schedule}
                        </span>
                      </div>
                      <div className={styles.doctorStatus}>
                        {doctor.isServing ? (
                          <span className={styles.statusServing}>
                            Sedang Melayani
                          </span>
                        ) : (
                          <span className={styles.statusReady}>Tersedia</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={styles.noDoctor}>
                  Tidak ada dokter yang bertugas hari ini untuk poliklinik ini
                </div>
              )}
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="patientName">Nama Lengkap</label>
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
