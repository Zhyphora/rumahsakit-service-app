"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";
import styles from "../page.module.css";
import toast from "react-hot-toast";
import { FiClock, FiEdit, FiHome, FiAlertTriangle } from "react-icons/fi";

interface QueueItem {
  polyclinic: { name: string; code: string; id: string };
  queueNumber: number;
  patient?: { name: string; medicalRecordNumber: string };
  status: string;
}

interface PolyclinicQueue {
  polyclinic: { name: string; code: string };
  waiting: number;
  serving: number;
}

export default function ReceptionDashboard() {
  const { user } = useAuth();
  const [recentQueue, setRecentQueue] = useState<QueueItem[]>([]);
  const [polyclinicQueues, setPolyclinicQueues] = useState<PolyclinicQueue[]>(
    []
  );
  const [stats, setStats] = useState({
    totalWaiting: 0,
    todayRegistrations: 0,
    activePoli: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReceptionData();
  }, []);

  const loadReceptionData = async () => {
    setError(null);
    try {
      const displayRes = await api.get("/queue/display");
      const displayData = displayRes.data;

      let totalWaiting = 0;
      let todayRegistrations = 0;
      const allQueues: QueueItem[] = [];
      const polyQueues: PolyclinicQueue[] = [];

      for (const item of displayData) {
        try {
          const queueRes = await api.get(
            `/queue/polyclinic/${item.polyclinic.id}`
          );
          const queueData = queueRes.data;
          const waitingCount = queueData.waiting?.length || 0;
          const completedCount = queueData.completed?.length || 0;

          totalWaiting += waitingCount;
          todayRegistrations += waitingCount + completedCount;

          polyQueues.push({
            polyclinic: item.polyclinic,
            waiting: waitingCount,
            serving: queueData.currentlyServing ? 1 : 0,
          });

          if (queueData.waiting) {
            allQueues.push(
              ...queueData.waiting.map((q: any) => ({
                ...q,
                polyclinic: item.polyclinic,
              }))
            );
          }
        } catch (e) {
          totalWaiting += item.waitingCount || 0;
          polyQueues.push({
            polyclinic: item.polyclinic,
            waiting: item.waitingCount || 0,
            serving: item.status === "serving" ? 1 : 0,
          });
        }
      }

      setStats({
        totalWaiting,
        todayRegistrations,
        activePoli: displayData.length,
      });
      setPolyclinicQueues(polyQueues);
      setRecentQueue(allQueues.slice(0, 5));
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Gagal memuat data pendaftaran";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      label: "Total Menunggu",
      value: stats.totalWaiting,
      color: "#2563eb",
      Icon: FiClock,
    },
    {
      label: "Pendaftaran Hari Ini",
      value: stats.todayRegistrations,
      color: "#059669",
      Icon: FiEdit,
    },
    {
      label: "Poli Aktif",
      value: stats.activePoli,
      color: "#7c3aed",
      Icon: FiHome,
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
        <button onClick={loadReceptionData} className={styles.retryBtn}>
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <>
      <div className={styles.header}>
        <h1 className={styles.title}>Dashboard Pendaftaran</h1>
        <p className={styles.subtitle}>Selamat datang, {user?.name}</p>
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

      <div className={styles.grid}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Antrian per Poliklinik</h2>
          <div className={styles.cardContent}>
            {polyclinicQueues.length > 0 ? (
              <ul className={styles.queueList}>
                {polyclinicQueues.map((pq, i) => (
                  <li key={i} className={styles.queueItem}>
                    <span className={styles.queueNumber}>
                      {pq.polyclinic.name}
                    </span>
                    <span className={styles.queueName}>
                      {pq.waiting} menunggu {pq.serving > 0 && "• 1 dilayani"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.placeholder}>Tidak ada poli aktif</p>
            )}
          </div>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Pendaftaran Terbaru</h2>
          <div className={styles.cardContent}>
            {recentQueue.length > 0 ? (
              <ul className={styles.queueList}>
                {recentQueue.map((q, i) => (
                  <li key={i} className={styles.queueItem}>
                    <span className={styles.queueNumber}>
                      {q.polyclinic?.code}-
                      {String(q.queueNumber).padStart(3, "0")}
                    </span>
                    <span className={styles.queueName}>{q.patient?.name}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.placeholder}>
                Belum ada pendaftaran hari ini
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
