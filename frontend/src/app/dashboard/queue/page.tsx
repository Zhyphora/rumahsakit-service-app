"use client";

import { useState, useEffect } from "react";
import api from "@/services/api";
import { useQueueSocket } from "@/hooks/useQueueSocket";
import { Polyclinic, QueueState } from "@/types";
import styles from "./queue.module.css";

interface PolyclinicQueue {
  polyclinic: Polyclinic;
  data: QueueState | null;
}

export default function QueuePage() {
  const [allQueues, setAllQueues] = useState<PolyclinicQueue[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { connected } = useQueueSocket("");

  useEffect(() => {
    loadAllQueues();
    // Refresh every 5 seconds
    const interval = setInterval(loadAllQueues, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadAllQueues = async () => {
    try {
      const polysRes = await api.get("/queue/polyclinics");
      const polyclinics = polysRes.data;

      const queuesData: PolyclinicQueue[] = await Promise.all(
        polyclinics.map(async (poly: Polyclinic) => {
          try {
            const queueRes = await api.get(`/queue/polyclinic/${poly.id}`);
            return { polyclinic: poly, data: queueRes.data };
          } catch (e) {
            return { polyclinic: poly, data: null };
          }
        })
      );

      setAllQueues(queuesData);
    } catch (error) {
      console.error("Failed to load queues:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCall = async (queueId: string) => {
    try {
      await api.post(`/queue/call/${queueId}`);
      loadAllQueues();
    } catch (error: any) {
      console.error("Call error:", error);
      alert(error.response?.data?.message || "Gagal memanggil antrian");
    }
  };

  const handleServe = async (queueId: string) => {
    try {
      await api.post(`/queue/serve/${queueId}`);
      loadAllQueues();
    } catch (error: any) {
      console.error("Serve error:", error);
      alert(error.response?.data?.message || "Gagal memulai layanan");
    }
  };

  const handleComplete = async (queueId: string) => {
    try {
      await api.post(`/queue/complete/${queueId}`);
      loadAllQueues();
    } catch (error: any) {
      console.error("Complete error:", error);
      alert(error.response?.data?.message || "Gagal menyelesaikan layanan");
    }
  };

  const handleSkip = async (queueId: string) => {
    try {
      await api.post(`/queue/skip/${queueId}`);
      loadAllQueues();
    } catch (error: any) {
      console.error("Skip error:", error);
      alert(error.response?.data?.message || "Gagal melewati antrian");
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
        <h1 className={styles.title}>Manajemen Antrian</h1>
        <div className={styles.connectionStatus}>
          <span
            className={`${styles.dot} ${
              connected ? styles.connected : styles.disconnected
            }`}
          ></span>
          {connected ? "Terhubung" : "Tidak Terhubung"}
        </div>
      </div>

      <div className={styles.allPolysGrid}>
        {allQueues.map(({ polyclinic, data }) => (
          <div key={polyclinic.id} className={styles.polyCard}>
            <div className={styles.polyHeader}>
              <h2 className={styles.polyTitle}>{polyclinic.name}</h2>
              <span className={styles.polyCode}>{polyclinic.code}</span>
            </div>

            {/* Currently Serving or Called */}
            {data?.currentlyServing ? (
              <div className={`${styles.currentCard} ${styles.serving}`}>
                <span className={styles.queueNumber}>
                  {polyclinic.code}-
                  {String(data.currentlyServing.queueNumber).padStart(3, "0")}
                </span>
                <span className={styles.patientName}>
                  {data.currentlyServing.patient?.name}
                </span>
                <button
                  onClick={() => handleComplete(data.currentlyServing!.id)}
                  className={`${styles.btn} ${styles.btnSuccess}`}
                >
                  Selesai
                </button>
              </div>
            ) : data?.lastCalled ? (
              <div className={`${styles.currentCard} ${styles.called}`}>
                <span className={styles.queueNumber}>
                  {polyclinic.code}-
                  {String(data.lastCalled.queueNumber).padStart(3, "0")}
                </span>
                <span className={styles.patientName}>
                  {data.lastCalled.patient?.name}
                </span>
                <div className={styles.btnGroup}>
                  <button
                    onClick={() => handleServe(data.lastCalled!.id)}
                    className={`${styles.btn} ${styles.btnPrimary}`}
                  >
                    Mulai Layani
                  </button>
                  <button
                    onClick={() => handleSkip(data.lastCalled!.id)}
                    className={`${styles.btn} ${styles.btnDanger}`}
                  >
                    Skip
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.noServing}>Tidak ada yang dilayani</div>
            )}

            {/* Waiting Queue */}
            <div className={styles.waitingSection}>
              <h3>Menunggu ({data?.waiting?.length || 0})</h3>
              {data?.waiting && data.waiting.length > 0 ? (
                <div className={styles.waitingList}>
                  {data.waiting.slice(0, 3).map((queue, index) => (
                    <div key={queue.id} className={styles.waitingCard}>
                      <div className={styles.queueInfo}>
                        <span className={styles.waitingNumber}>
                          {polyclinic.code}-
                          {String(queue.queueNumber).padStart(3, "0")}
                        </span>
                        <span className={styles.waitingName}>
                          {queue.patient?.name}
                        </span>
                      </div>
                      {index === 0 &&
                        !data.currentlyServing &&
                        !data.lastCalled && (
                          <button
                            onClick={() => handleCall(queue.id)}
                            className={`${styles.btn} ${styles.btnPrimary} ${styles.btnSm}`}
                          >
                            Panggil
                          </button>
                        )}
                    </div>
                  ))}
                  {data.waiting.length > 3 && (
                    <div className={styles.moreWaiting}>
                      +{data.waiting.length - 3} lainnya
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.noWaiting}>Tidak ada antrian</div>
              )}
            </div>

            {/* Stats */}
            <div className={styles.polyStats}>
              <div className={styles.polyStat}>
                <span className={styles.polyStatValue}>{data?.total || 0}</span>
                <span className={styles.polyStatLabel}>Total</span>
              </div>
              <div className={styles.polyStat}>
                <span className={styles.polyStatValue}>
                  {data?.completed?.length || 0}
                </span>
                <span className={styles.polyStatLabel}>Selesai</span>
              </div>
              <div className={styles.polyStat}>
                <span className={styles.polyStatValue}>
                  {data?.skipped?.length || 0}
                </span>
                <span className={styles.polyStatLabel}>Skip</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
