"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";
import styles from "./page.module.css";

interface DashboardStats {
  waiting: number;
  serving: number;
  completed: number;
  doctors: number;
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

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    waiting: 0,
    serving: 0,
    completed: 0,
    doctors: 0,
  });
  const [recentQueue, setRecentQueue] = useState<QueueItem[]>([]);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load queue display data for stats
      const displayRes = await api.get("/queue/display");
      const displayData = displayRes.data;

      let waiting = 0;
      let serving = 0;
      let completed = 0;

      // First get actual queue data from each polyclinic
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

          // Add waiting items to recent queue
          if (queueData.waiting) {
            allQueues.push(
              ...queueData.waiting.map((q: any) => ({
                ...q,
                polyclinic: item.polyclinic,
              }))
            );
          }
        } catch (e) {
          // Fallback to display data
          waiting += item.waitingCount || 0;
          if (item.status === "serving") serving++;
        }
      }

      // Load low stock items
      let lowStockItems: LowStockItem[] = [];
      try {
        const stockRes = await api.get("/stock/items/low-stock");
        lowStockItems = stockRes.data;
      } catch (e) {
        // Ignore if no stock data
      }

      setStats({
        waiting,
        serving,
        completed,
        doctors: displayData.length,
      });
      setLowStock(lowStockItems);
      setRecentQueue(allQueues.slice(0, 5));
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    { label: "Pasien Menunggu", value: stats.waiting, color: "#2563eb" },
    { label: "Sedang Dilayani", value: stats.serving, color: "#059669" },
    { label: "Selesai Hari Ini", value: stats.completed, color: "#7c3aed" },
    { label: "Poli Aktif", value: stats.doctors, color: "#ea580c" },
  ];

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.subtitle}>Selamat datang, {user?.name}!</p>
      </div>

      <div className={styles.statsGrid}>
        {statCards.map((stat, index) => (
          <div
            key={index}
            className={styles.statCard}
            style={{ borderTopColor: stat.color }}
          >
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
    </div>
  );
}
