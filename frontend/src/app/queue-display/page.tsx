"use client";

import { useQueueDisplay } from "@/hooks/useQueueSocket";
import { useEffect, useState } from "react";
import styles from "./display.module.css";

export default function QueueDisplayPage() {
  const { displayData, connected } = useQueueDisplay();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Rumah Sakit</h1>
        <div className={styles.time}>
          {mounted && currentTime ? formatDate(currentTime) : ""}
          <span className={styles.clock}>
            {mounted && currentTime ? formatTime(currentTime) : "--:--:--"}
          </span>
        </div>
      </header>

      <div className={styles.grid}>
        {displayData.map((item) => (
          <div
            key={item.polyclinic.id}
            className={`${styles.queueCard} ${
              item.status === "serving" ? styles.serving : ""
            } ${item.status === "called" ? styles.called : ""}`}
          >
            <div className={styles.polyName}>{item.polyclinic.name}</div>
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
          </div>
        ))}
      </div>

      {displayData.length === 0 && (
        <div className={styles.emptyState}>
          <p>Belum ada data antrian</p>
          <p className={styles.hint}>
            {connected
              ? "Menunggu data dari server..."
              : "Menghubungkan ke server..."}
          </p>
        </div>
      )}

      <footer className={styles.footer}>
        <div className={styles.marquee}>
          <span>
            Selamat datang di Rumah Sakit • Silakan menunggu nomor antrian Anda
            dipanggil • Untuk informasi lebih lanjut, silakan hubungi petugas
            loket •
          </span>
        </div>
      </footer>
    </div>
  );
}
