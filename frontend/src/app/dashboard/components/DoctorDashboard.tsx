"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";
import styles from "../page.module.css";
import toast from "react-hot-toast";
import {
  FiClock,
  FiCheckCircle,
  FiAlertTriangle,
  FiUser,
} from "react-icons/fi";

interface PatientQueue {
  id: string;
  queueNumber: number;
  patient: { name: string; medicalRecordNumber: string };
  status: string;
}

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [todayPatients, setTodayPatients] = useState<PatientQueue[]>([]);
  const [stats, setStats] = useState({
    waiting: 0,
    completed: 0,
    currentPatient: null as PatientQueue | null,
  });
  const [polyclinicName, setPolyclinicName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDoctorData();
  }, [user]);

  const loadDoctorData = async () => {
    setError(null);
    try {
      const doctorPolyclinicId = user?.doctor?.polyclinicId;
      const doctorPolyclinicName = user?.doctor?.polyclinic?.name || "";

      setPolyclinicName(doctorPolyclinicName);

      if (!doctorPolyclinicId) {
        setIsLoading(false);
        return;
      }

      const queueRes = await api.get(`/queue/polyclinic/${doctorPolyclinicId}`);
      const queueData = queueRes.data;

      const waiting = queueData.waiting?.length || 0;
      const completed = queueData.completed?.length || 0;
      const currentPatient = queueData.currentlyServing || null;

      setStats({ waiting, completed, currentPatient });
      setTodayPatients(queueData.waiting?.slice(0, 10) || []);
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Gagal memuat data antrian";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      label: "Pasien Menunggu",
      value: stats.waiting,
      color: "#2563eb",
      Icon: FiClock,
    },
    {
      label: "Selesai Hari Ini",
      value: stats.completed,
      color: "#059669",
      Icon: FiCheckCircle,
    },
  ];

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
        <button onClick={loadDoctorData} className={styles.retryBtn}>
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <>
      <div className={styles.header}>
        <h1 className={styles.title}>Dashboard Dokter</h1>
        <p className={styles.subtitle}>
          {user?.name} • {polyclinicName || "Belum ada poliklinik"}
        </p>
      </div>

      <div className={styles.statsGrid}>
        {statCards.map((stat, index) => (
          <div
            key={index}
            className={styles.statCard}
            style={{ borderTopColor: stat.color }}
          >
            <stat.Icon size={28} color={stat.color} />
            <div className={styles.statInfo}>
              <span className={styles.statValue}>{stat.value}</span>
              <span className={styles.statLabel}>{stat.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Current Patient */}
      {stats.currentPatient && (
        <div className={styles.card} style={{ marginBottom: "1rem" }}>
          <h2 className={styles.cardTitle}>
            <FiUser size={18} style={{ marginRight: "0.5rem" }} />
            Sedang Dilayani
          </h2>
          <div className={styles.cardContent}>
            <div className={styles.queueItem} style={{ background: "#dcfce7" }}>
              <span className={styles.queueNumber}>
                No. {String(stats.currentPatient.queueNumber).padStart(3, "0")}
              </span>
              <span className={styles.queueName}>
                {stats.currentPatient.patient?.name}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className={styles.grid}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>
            Antrian {polyclinicName || "Poliklinik"}
          </h2>
          <div className={styles.cardContent}>
            {todayPatients.length > 0 ? (
              <ul className={styles.queueList}>
                {todayPatients.map((q, i) => (
                  <li key={i} className={styles.queueItem}>
                    <span className={styles.queueNumber}>
                      No. {String(q.queueNumber).padStart(3, "0")}
                    </span>
                    <span className={styles.queueName}>
                      {q.patient?.name} ({q.patient?.medicalRecordNumber})
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.placeholder}>Tidak ada pasien menunggu</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
