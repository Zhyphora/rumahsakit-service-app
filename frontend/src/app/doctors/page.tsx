"use client";

import { useState, useEffect } from "react";
import styles from "./doctors.module.css";

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
      setDoctors(data);
    } catch (error) {
      console.error("Failed to load doctors:", error);
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
          {doctors.map((doctor) => (
            <div
              key={doctor.id}
              className={`${styles.doctorCard} ${
                doctor.isServing ? styles.serving : styles.ready
              }`}
            >
              <div className={styles.avatar}>{doctor.name.charAt(0)}</div>
              <div className={styles.doctorInfo}>
                <h2 className={styles.doctorName}>{doctor.name}</h2>
                <p className={styles.specialization}>{doctor.specialization}</p>
                <div className={styles.polyclinic}>
                  <span className={styles.polyBadge}>
                    {doctor.polyclinic.code}
                  </span>
                  <span>{doctor.polyclinic.name}</span>
                </div>
              </div>
              <div className={styles.status}>
                {doctor.isServing ? (
                  <>
                    <span
                      className={styles.statusBadge + " " + styles.servingBadge}
                    >
                      Sedang Melayani
                    </span>
                    <p className={styles.patientName}>
                      {doctor.currentPatient}
                    </p>
                  </>
                ) : (
                  <span
                    className={styles.statusBadge + " " + styles.readyBadge}
                  >
                    Siap Melayani
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
          ))}
        </div>
      )}

      <footer className={styles.footer}>
        <p>Rumah Sakit - Jadwal Dokter Bertugas</p>
      </footer>
    </div>
  );
}
