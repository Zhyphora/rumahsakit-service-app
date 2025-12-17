"use client";

import { useState, useEffect } from "react";
import styles from "./doctors.module.css";
import { FiClock, FiUser, FiCheckCircle, FiXCircle } from "react-icons/fi";

interface Doctor {
  id: string;
  name: string;
  specialization: string;
  polyclinic: {
    id: string;
    name: string;
    code: string;
  };
  schedule: string;
  isServing: boolean;
  currentPatient: string | null;
  completedToday: number;
}

// Check if doctor is available based on schedule time
const isDoctorAvailable = (
  schedule: string
): { available: boolean; statusText: string } => {
  if (!schedule) return { available: true, statusText: "Tersedia" };

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  // Parse schedule string like "08:00 - 14:00" or "13:00 - 20:00"
  const match = schedule.match(/(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})/);
  if (match) {
    const startTime = parseInt(match[1]) * 60 + parseInt(match[2]);
    const endTime = parseInt(match[3]) * 60 + parseInt(match[4]);

    if (currentTime >= startTime && currentTime <= endTime) {
      return { available: true, statusText: "Siap Melayani" };
    } else if (currentTime < startTime) {
      return { available: false, statusText: `Mulai ${match[1]}:${match[2]}` };
    } else {
      return { available: false, statusText: "Sudah Tutup" };
    }
  }

  return { available: true, statusText: "Tersedia" };
};

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentTime(new Date());
    loadDoctors();

    // Refresh every 10 seconds
    const interval = setInterval(() => {
      loadDoctors();
      setCurrentTime(new Date());
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const loadDoctors = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/doctors/available`
      );
      const data = await res.json();
      setDoctors(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load doctors:", error);
      setDoctors([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Memuat data dokter...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Dokter Bertugas Hari Ini</h1>
          <p className={styles.subtitle}>
            {currentTime?.toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </div>
        <div className={styles.clock}>
          {currentTime?.toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </header>

      {doctors.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Tidak ada dokter yang bertugas hari ini</p>
        </div>
      ) : (
        <div className={styles.doctorGrid}>
          {doctors.map((doctor) => {
            const { available, statusText } = isDoctorAvailable(
              doctor.schedule
            );
            const isActuallyAvailable = available && !doctor.isServing;

            return (
              <div
                key={doctor.id}
                className={`${styles.doctorCard} ${
                  doctor.isServing
                    ? styles.serving
                    : available
                    ? styles.ready
                    : styles.unavailable
                }`}
              >
                <div className={styles.avatar}>
                  <FiUser size={24} />
                </div>
                <div className={styles.doctorInfo}>
                  <h2 className={styles.doctorName}>{doctor.name}</h2>
                  <p className={styles.specialization}>
                    {doctor.specialization}
                  </p>
                  <div className={styles.polyclinic}>
                    <span className={styles.polyBadge}>
                      {doctor.polyclinic.code}
                    </span>
                    <span>{doctor.polyclinic.name}</span>
                  </div>
                  <div className={styles.schedule}>
                    <FiClock size={14} />
                    <span>{doctor.schedule}</span>
                  </div>
                </div>
                <div className={styles.status}>
                  {doctor.isServing ? (
                    <>
                      <span
                        className={
                          styles.statusBadge + " " + styles.servingBadge
                        }
                      >
                        Sedang Melayani
                      </span>
                      <p className={styles.patientName}>
                        {doctor.currentPatient}
                      </p>
                    </>
                  ) : available ? (
                    <span
                      className={styles.statusBadge + " " + styles.readyBadge}
                    >
                      <FiCheckCircle size={12} /> {statusText}
                    </span>
                  ) : (
                    <span
                      className={
                        styles.statusBadge + " " + styles.unavailableBadge
                      }
                    >
                      <FiXCircle size={12} /> {statusText}
                    </span>
                  )}
                </div>
                <div className={styles.stats}>
                  <div className={styles.stat}>
                    <span className={styles.statValue}>
                      {doctor.completedToday}
                    </span>
                    <span className={styles.statLabel}>Pasien Selesai</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <footer className={styles.footer}>
        <p>Rumah Sakit - Jadwal Dokter Bertugas</p>
      </footer>
    </div>
  );
}
