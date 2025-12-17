"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/services/api";
import styles from "../page.module.css";
import toast from "react-hot-toast";
import { FiFileText, FiCheckCircle, FiAlertTriangle } from "react-icons/fi";

interface Prescription {
  id: string;
  patient: { name: string };
  doctor: { user: { name: string } };
  status: string;
  createdAt: string;
}

interface LowStockItem {
  name: string;
  currentStock: number;
  minStock: number;
}

export default function PharmacyDashboard() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [lowStock, setLowStock] = useState<LowStockItem[]>([]);
  const [stats, setStats] = useState({
    pending: 0,
    completed: 0,
    lowStockCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPharmacyData();
  }, []);

  const loadPharmacyData = async () => {
    setError(null);
    try {
      let pending = 0;
      let completed = 0;
      let prescriptionList: Prescription[] = [];

      try {
        const prescRes = await api.get("/prescriptions");
        prescriptionList = prescRes.data;
        pending = prescriptionList.filter(
          (p) => p.status === "pending" || p.status === "processing"
        ).length;
        completed = prescriptionList.filter(
          (p) => p.status === "completed"
        ).length;
      } catch (e) {}

      let lowStockItems: LowStockItem[] = [];
      try {
        const stockRes = await api.get("/stock/items/low-stock");
        lowStockItems = stockRes.data;
      } catch (e) {}

      setStats({
        pending,
        completed,
        lowStockCount: lowStockItems.length,
      });
      setLowStock(lowStockItems);
      setPrescriptions(
        prescriptionList
          .filter((p) => p.status === "pending" || p.status === "processing")
          .slice(0, 10)
      );
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Gagal memuat data farmasi";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      label: "Resep Pending",
      value: stats.pending,
      color: "#ea580c",
      Icon: FiFileText,
    },
    {
      label: "Selesai Hari Ini",
      value: stats.completed,
      color: "#059669",
      Icon: FiCheckCircle,
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
        <button onClick={loadPharmacyData} className={styles.retryBtn}>
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <>
      <div className={styles.header}>
        <h1 className={styles.title}>Dashboard Farmasi</h1>
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
          <h2 className={styles.cardTitle}>Resep Menunggu</h2>
          <div className={styles.cardContent}>
            {prescriptions.length > 0 ? (
              <ul className={styles.queueList}>
                {prescriptions.map((p, i) => (
                  <li key={i} className={styles.queueItem}>
                    <span className={styles.queueNumber}>
                      {p.patient?.name}
                    </span>
                    <span className={styles.queueName}>
                      Dr. {p.doctor?.user?.name}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.placeholder}>Tidak ada resep pending</p>
            )}
          </div>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Stok Obat Menipis</h2>
          <div className={styles.cardContent}>
            {lowStock.length > 0 ? (
              <ul className={styles.stockList}>
                {lowStock.slice(0, 8).map((item, i) => (
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
