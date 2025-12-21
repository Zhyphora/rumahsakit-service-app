"use client";

import { useEffect, useState } from "react";
import api from "@/services/api";
import styles from "../page.module.css";
import toast from "react-hot-toast";
import {
  FiClock,
  FiActivity,
  FiCheckCircle,
  FiHome,
  FiUsers,
  FiAlertTriangle,
} from "react-icons/fi";

interface DashboardStats {
  waiting: number;
  serving: number;
  completed: number;
  totalPatients: number;
  totalDoctors: number;
  lowStockCount: number;
}

interface QueueItem {
  polyclinic: { name: string; code: string };
  queueNumber: number;
  patient?: { name: string };
  status: string;
}

interface LowStockItem {
  name: string;
  currentStock: number;
  minStock: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    waiting: 0,
    serving: 0,
    completed: 0,
    totalPatients: 0,
    totalDoctors: 0,
    lowStockCount: 0,
  });
  const [recentQueue, setRecentQueue] = useState<QueueItem[]>([]);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setError(null);
    try {
      const displayRes = await api.get("/queue/display");
      const displayData = displayRes.data;

      let waiting = 0;
      let serving = 0;
      let completed = 0;
      const allQueues: QueueItem[] = [];

      for (const item of displayData) {
        try {
          const queueRes = await api.get(
            `/queue/polyclinic/${item.polyclinic.id}`
          );
          const queueData = queueRes.data;
          waiting += queueData.waiting?.length || 0;
          serving += queueData.currentlyServing ? 1 : 0;
          completed += queueData.completed?.length || 0;

          if (queueData.waiting) {
            allQueues.push(
              ...queueData.waiting.map((q: any) => ({
                ...q,
                polyclinic: item.polyclinic,
              }))
            );
          }
        } catch (e) {
          waiting += item.waitingCount || 0;
          if (item.status === "serving") serving++;
        }
      }

      let lowStockItems: LowStockItem[] = [];
      try {
        const stockRes = await api.get("/stock/items/low-stock");
        lowStockItems = stockRes.data;
      } catch (e) {}

      let totalPatients = 0;
      try {
        const patientsRes = await api.get("/patients");
        totalPatients =
          patientsRes.data.data?.length || patientsRes.data.length || 0;
      } catch (e) {}

      setStats({
        waiting,
        serving,
        completed,
        totalPatients,
        totalDoctors: displayData.length,
        lowStockCount: lowStockItems.length,
      });
      setLowStock(lowStockItems);
      setRecentQueue(allQueues.slice(0, 5));
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Gagal memuat data dashboard";
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
      label: "Sedang Dilayani",
      value: stats.serving,
      color: "#059669",
      Icon: FiActivity,
    },
    {
      label: "Selesai Hari Ini",
      value: stats.completed,
      color: "#7c3aed",
      Icon: FiCheckCircle,
    },
    {
      label: "Poli Aktif",
      value: stats.totalDoctors,
      color: "#ea580c",
      Icon: FiHome,
    },
    {
      label: "Total Pasien",
      value: stats.totalPatients,
      color: "#0891b2",
      Icon: FiUsers,
    },
    {
      label: "Stok Menipis",
      value: stats.lowStockCount,
      color: "#dc2626",
      Icon: FiAlertTriangle,
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
        <button onClick={loadDashboardData} className={styles.retryBtn}>
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <>
      <div className={styles.header}>
        <h1 className={styles.title}>Dashboard Admin</h1>
        <p className={styles.subtitle}>Overview semua aktivitas rumah sakit</p>
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
          <h2 className={styles.cardTitle}>Antrian Terkini</h2>
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
              <p className={styles.placeholder}>Tidak ada antrian saat ini</p>
            )}
          </div>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Stok Menipis</h2>
          <div className={styles.cardContent}>
            {lowStock.length > 0 ? (
              <ul className={styles.stockList}>
                {lowStock.slice(0, 5).map((item, i) => (
                  <li key={i} className={styles.stockItem}>
                    <span className={styles.stockName}>{item.name}</span>
                    <span className={styles.stockQty}>
                      {item.currentStock} / {item.minStock}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.placeholder}>
                Semua stok dalam kondisi baik
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
