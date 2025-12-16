"use client";

import { useState, useEffect } from "react";
import api from "@/services/api";
import { Item, StockOpname } from "@/types";
import styles from "./stock.module.css";

export default function StockPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [opnames, setOpnames] = useState<StockOpname[]>([]);
  const [activeTab, setActiveTab] = useState<"items" | "opname">("items");
  const [searchTerm, setSearchTerm] = useState("");
  const [showLowStock, setShowLowStock] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [itemsRes, opnamesRes] = await Promise.all([
        api.get("/stock/items"),
        api.get("/stock/opname"),
      ]);
      setItems(itemsRes.data);
      setOpnames(opnamesRes.data);
    } catch (error) {
      console.error("Failed to load stock data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLowStock = !showLowStock || item.currentStock <= item.minStock;
    return matchesSearch && matchesLowStock;
  });

  const handleCreateOpname = async () => {
    try {
      await api.post("/stock/opname", { notes: "Stock opname harian" });
      loadData();
    } catch (error) {
      alert("Gagal membuat stock opname");
    }
  };

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
        <h1 className={styles.title}>Stock Opname</h1>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${
            activeTab === "items" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("items")}
        >
          📦 Daftar Barang
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === "opname" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("opname")}
        >
          📋 Stock Opname
        </button>
      </div>

      {activeTab === "items" && (
        <div className={styles.content}>
          <div className={styles.toolbar}>
            <input
              type="text"
              placeholder="Cari barang..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={showLowStock}
                onChange={(e) => setShowLowStock(e.target.checked)}
              />
              Tampilkan stok menipis saja
            </label>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Kode</th>
                  <th>Nama</th>
                  <th>Kategori</th>
                  <th>Unit</th>
                  <th>Stok</th>
                  <th>Min. Stok</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id}>
                    <td>{item.code}</td>
                    <td>{item.name}</td>
                    <td>{item.category || "-"}</td>
                    <td>{item.unit || "-"}</td>
                    <td className={styles.stockCell}>{item.currentStock}</td>
                    <td>{item.minStock}</td>
                    <td>
                      {item.currentStock <= item.minStock ? (
                        <span
                          className={`${styles.badge} ${styles.badgeDanger}`}
                        >
                          Stok Menipis
                        </span>
                      ) : (
                        <span
                          className={`${styles.badge} ${styles.badgeSuccess}`}
                        >
                          Normal
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredItems.length === 0 && (
              <div className={styles.emptyState}>
                Tidak ada barang ditemukan
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "opname" && (
        <div className={styles.content}>
          <div className={styles.toolbar}>
            <button onClick={handleCreateOpname} className={styles.createBtn}>
              + Buat Stock Opname Baru
            </button>
          </div>

          <div className={styles.opnameList}>
            {opnames.map((opname) => (
              <div key={opname.id} className={styles.opnameCard}>
                <div className={styles.opnameHeader}>
                  <span className={styles.opnameDate}>
                    {new Date(opname.opnameDate).toLocaleDateString("id-ID")}
                  </span>
                  <span
                    className={`${styles.badge} ${
                      opname.status === "completed"
                        ? styles.badgeSuccess
                        : opname.status === "in_progress"
                        ? styles.badgeWarning
                        : styles.badgeInfo
                    }`}
                  >
                    {opname.status === "completed"
                      ? "Selesai"
                      : opname.status === "in_progress"
                      ? "Dalam Proses"
                      : "Draft"}
                  </span>
                </div>
                <div className={styles.opnameInfo}>
                  <p>Dibuat oleh: {opname.creator?.name || "-"}</p>
                  <p>Jumlah item: {opname.items?.length || 0}</p>
                </div>
              </div>
            ))}

            {opnames.length === 0 && (
              <div className={styles.emptyState}>Belum ada stock opname</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
