"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import styles from "./display.module.css";
import Navbar from "@/components/Navbar";
import { FiClock, FiUser, FiActivity } from "react-icons/fi";

interface DoctorQueueData {
  doctor: {
    id: string;
    name: string;
    specialization: string;
  };
  polyclinic: {
    id: string;
    name: string;
    code: string;
  };
  currentNumber: number;
  currentPatient: string | null;
  status: "waiting" | "called" | "serving";
  waitingCount: number;
  schedule: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// Check if doctor is available based on schedule time
const isDoctorAvailable = (schedule: string): boolean => {
  if (!schedule) return true;

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const match = schedule.match(/(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})/);
  if (match) {
    const startTime = parseInt(match[1]) * 60 + parseInt(match[2]);
    const endTime = parseInt(match[3]) * 60 + parseInt(match[4]);
    return currentTime >= startTime && currentTime <= endTime;
  }
  return true;
};

export default function QueueDisplayPage() {
  const [displayData, setDisplayData] = useState<DoctorQueueData[]>([]);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());
    loadDisplayData();

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Refresh data every 5 seconds
    const dataInterval = setInterval(() => {
      loadDisplayData();
    }, 5000);

    return () => {
      clearInterval(timer);
      clearInterval(dataInterval);
    };
  }, []);

  const loadDisplayData = async () => {
    try {
      const res = await fetch(`${API_URL}/doctors/queue-display`);
      const data = await res.json();
      setDisplayData(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load display data:", error);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("id-ID");
  };

  // Add availability status to each doctor
  const doctorsWithAvailability = displayData.map((item) => ({
    ...item,
    isAvailable: isDoctorAvailable(item.schedule),
  }));

  return (
    <div className={styles.container}>
      <Navbar />
      <header className={styles.header}>
        <div
          className={styles.time}
          style={{ width: "100%", textAlign: "right" }}
        >
          {mounted && currentTime ? formatDate(currentTime) : ""}
          <span className={styles.clock}>
            {mounted && currentTime ? formatTime(currentTime) : "--:--:--"}
          </span>
        </div>
      </header>

      <div className={styles.grid}>
        {doctorsWithAvailability.map((item) => (
          <div
            key={item.doctor.id}
            className={`${styles.queueCard} ${
              !item.isAvailable ? styles.unavailable : ""
            } ${item.status === "serving" ? styles.serving : ""} ${
              item.status === "called" ? styles.called : ""
            }`}
          >
            <div className={styles.doctorHeader}>
              <div className={styles.doctorAvatar}>
                <FiUser size={20} />
              </div>
              <div className={styles.doctorInfo}>
                <span className={styles.doctorName}>{item.doctor.name}</span>
                <span className={styles.doctorSpec}>
                  {item.doctor.specialization}
                </span>
              </div>
            </div>

            <div className={styles.polyName}>
              <span className={styles.polyCode}>{item.polyclinic.code}</span>
              {item.polyclinic.name}
            </div>

            <div className={styles.queueNumber}>
              {item.polyclinic.code}-
              {String(item.currentNumber).padStart(3, "0")}
            </div>

            <div className={styles.status}>
              <span className={styles.statusDot}></span>
              {item.status === "serving" && "Sedang Dilayani"}
              {item.status === "called" && "Dipanggil"}
              {item.status === "waiting" && "Menunggu"}
            </div>

            <div className={styles.waitingCount}>
              {item.waitingCount} antrian menunggu
            </div>

            <div className={styles.scheduleInfo}>
              <FiClock size={12} />
              <span>{item.schedule}</span>
            </div>
          </div>
        ))}
      </div>

      {doctorsWithAvailability.length === 0 && (
        <div className={styles.emptyState}>
          <p>Tidak ada dokter yang bertugas hari ini</p>
          <p className={styles.hint}>Silakan kembali pada jam operasional</p>
        </div>
      )}

      <footer className={styles.footer}>
        <div className={styles.marquee}>
          <span>
            Selamat datang di MediKu • Silakan menunggu nomor antrian Anda
            dipanggil • Untuk informasi lebih lanjut, silakan hubungi petugas
            loket •
          </span>
        </div>
      </footer>
    </div>
  );
}
