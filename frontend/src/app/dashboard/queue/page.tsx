"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import api from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { useQueueSocket } from "@/hooks/useQueueSocket";
import { Polyclinic, QueueState, QueueNumber, Item } from "@/types";
import styles from "./queue.module.css";

interface PolyclinicQueue {
  polyclinic: Polyclinic;
  data: QueueState | null;
}

interface PrescriptionItem {
  itemId: string;
  itemName: string;
  quantity: number;
  dosage: string;
  instructions: string;
}

export default function QueuePage() {
  const { user } = useAuth();
  const [allQueues, setAllQueues] = useState<PolyclinicQueue[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Prescription modal state
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [currentQueue, setCurrentQueue] = useState<QueueNumber | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [diagnosis, setDiagnosis] = useState("");
  const [notes, setNotes] = useState("");
  const [prescriptionItems, setPrescriptionItems] = useState<
    PrescriptionItem[]
  >([]);
  const [submitting, setSubmitting] = useState(false);

  const { connected } = useQueueSocket("");

  useEffect(() => {
    loadAllQueues();
    loadItems();
    const interval = setInterval(loadAllQueues, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const loadAllQueues = async () => {
    try {
      // For doctors, only show their assigned polyclinic
      if (user?.role === "doctor" && user?.doctor?.polyclinicId) {
        const polyclinicId = user.doctor.polyclinicId;
        const polyclinicName = user.doctor.polyclinic?.name || "Poliklinik";
        const polyclinicCode = user.doctor.polyclinic?.code || "POLI";

        try {
          const queueRes = await api.get(`/queue/polyclinic/${polyclinicId}`);
          setAllQueues([
            {
              polyclinic: {
                id: polyclinicId,
                name: polyclinicName,
                code: polyclinicCode,
                isActive: true,
              },
              data: queueRes.data,
            },
          ]);
        } catch (e) {
          setAllQueues([]);
        }
      } else {
        // For admin/staff, show all polyclinics
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
      }
    } catch (error) {
      console.error("Failed to load queues:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadItems = async () => {
    try {
      const res = await api.get("/stock/items");
      setItems(res.data);
    } catch (error) {
      console.error("Failed to load items:", error);
    }
  };

  const handleCall = async (queueId: string) => {
    try {
      await api.post(`/queue/call/${queueId}`);
      loadAllQueues();
    } catch (error: any) {
      alert(error.response?.data?.message || "Gagal memanggil antrian");
    }
  };

  const handleServe = async (queueId: string) => {
    try {
      await api.post(`/queue/serve/${queueId}`);
      loadAllQueues();
    } catch (error: any) {
      alert(error.response?.data?.message || "Gagal memulai layanan");
    }
  };

  const handleSkip = async (queueId: string) => {
    try {
      await api.post(`/queue/skip/${queueId}`);
      loadAllQueues();
    } catch (error: any) {
      alert(error.response?.data?.message || "Gagal melewati antrian");
    }
  };

  // Open prescription modal
  const openPrescriptionModal = (queue: QueueNumber) => {
    setCurrentQueue(queue);
    setDiagnosis("");
    setNotes("");
    setPrescriptionItems([]);
    setShowPrescriptionModal(true);
  };

  // Add prescription item
  const addPrescriptionItem = () => {
    setPrescriptionItems([
      ...prescriptionItems,
      {
        itemId: "",
        itemName: "",
        quantity: 1,
        dosage: "",
        instructions: "",
      },
    ]);
  };

  // Update prescription item
  const updatePrescriptionItem = (index: number, field: string, value: any) => {
    const updated = [...prescriptionItems];
    if (field === "itemId") {
      const item = items.find((i) => i.id === value);
      updated[index].itemId = value;
      updated[index].itemName = item?.name || "";
    } else {
      (updated[index] as any)[field] = value;
    }
    setPrescriptionItems(updated);
  };

  // Remove prescription item
  const removePrescriptionItem = (index: number) => {
    setPrescriptionItems(prescriptionItems.filter((_, i) => i !== index));
  };

  // Submit prescription and complete
  const handleCompleteWithPrescription = async () => {
    if (!currentQueue) return;

    setSubmitting(true);
    try {
      // Create prescription if there are items
      if (prescriptionItems.length > 0) {
        await api.post("/prescriptions", {
          queueNumberId: currentQueue.id,
          patientId: currentQueue.patientId,
          doctorId: currentQueue.doctorId,
          diagnosis,
          notes,
          items: prescriptionItems
            .filter((item) => item.itemId)
            .map((item) => ({
              itemId: item.itemId,
              quantity: item.quantity,
              dosage: item.dosage,
              instructions: item.instructions,
            })),
        });
      }

      // Complete the queue
      await api.post(`/queue/complete/${currentQueue.id}`);

      setShowPrescriptionModal(false);
      setCurrentQueue(null);
      loadAllQueues();
    } catch (error: any) {
      alert(error.response?.data?.message || "Gagal menyelesaikan layanan");
    } finally {
      setSubmitting(false);
    }
  };

  // Quick complete without prescription
  const handleQuickComplete = async () => {
    if (!currentQueue) return;
    setSubmitting(true);
    try {
      await api.post(`/queue/complete/${currentQueue.id}`);
      setShowPrescriptionModal(false);
      loadAllQueues();
    } catch (error: any) {
      alert(error.response?.data?.message || "Gagal menyelesaikan layanan");
    } finally {
      setSubmitting(false);
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
      {/* Prescription Modal - using Portal to render outside parent */}
      {showPrescriptionModal &&
        currentQueue &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: "100vw",
              height: "100vh",
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 99999,
              padding: "1rem",
            }}
          >
            <div
              style={{
                backgroundColor: "white",
                borderRadius: "1rem",
                width: "100%",
                maxWidth: "700px",
                maxHeight: "85vh",
                overflowY: "auto",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              }}
            >
              {/* Modal Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "1.25rem 1.5rem",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <h2
                  style={{ margin: 0, fontSize: "1.25rem", color: "#1f2937" }}
                >
                  Selesaikan Layanan
                </h2>
                <button
                  onClick={() => setShowPrescriptionModal(false)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "1.5rem",
                    color: "#6b7280",
                    cursor: "pointer",
                    width: "32px",
                    height: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "50%",
                  }}
                >
                  ×
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: "1.5rem" }}>
                <div
                  style={{
                    background:
                      "linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)",
                    padding: "1.25rem",
                    borderRadius: "0.75rem",
                    marginBottom: "1.5rem",
                    borderLeft: "4px solid #2563eb",
                  }}
                >
                  <p style={{ margin: 0, color: "#1e40af", fontSize: "1rem" }}>
                    <strong style={{ color: "#1e3a8a" }}>Pasien:</strong>{" "}
                    {currentQueue.patient?.name}
                  </p>
                </div>

                <div style={{ marginBottom: "1rem" }}>
                  <label
                    style={{
                      display: "block",
                      fontWeight: 500,
                      color: "#374151",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Diagnosis
                  </label>
                  <textarea
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="Masukkan diagnosis..."
                    rows={2}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                    }}
                  />
                </div>

                <div
                  style={{
                    margin: "1.5rem 0",
                    padding: "1rem",
                    background: "#fafafa",
                    borderRadius: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "1rem",
                    }}
                  >
                    <h3
                      style={{ margin: 0, fontSize: "1rem", color: "#374151" }}
                    >
                      Resep Obat
                    </h3>
                    <button
                      type="button"
                      onClick={addPrescriptionItem}
                      style={{
                        background: "#2563eb",
                        color: "white",
                        border: "none",
                        padding: "0.5rem 0.75rem",
                        borderRadius: "0.375rem",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      + Tambah Obat
                    </button>
                  </div>

                  {prescriptionItems.map((item, index) => (
                    <div
                      key={index}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "2fr 60px 1fr 1fr auto",
                        gap: "0.5rem",
                        marginBottom: "0.5rem",
                        alignItems: "center",
                      }}
                    >
                      <select
                        value={item.itemId}
                        onChange={(e) =>
                          updatePrescriptionItem(
                            index,
                            "itemId",
                            e.target.value
                          )
                        }
                        style={{
                          padding: "0.5rem",
                          border: "1px solid #d1d5db",
                          borderRadius: "0.375rem",
                          fontSize: "0.75rem",
                        }}
                      >
                        <option value="">Pilih Obat</option>
                        {items
                          .filter((i) => i.category === "obat")
                          .map((i) => (
                            <option key={i.id} value={i.id}>
                              {i.name} (Stok: {i.currentStock})
                            </option>
                          ))}
                      </select>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          updatePrescriptionItem(
                            index,
                            "quantity",
                            parseInt(e.target.value) || 1
                          )
                        }
                        min={1}
                        placeholder="Jml"
                        style={{
                          padding: "0.5rem",
                          border: "1px solid #d1d5db",
                          borderRadius: "0.375rem",
                          fontSize: "0.75rem",
                          textAlign: "center",
                        }}
                      />
                      <input
                        type="text"
                        value={item.dosage}
                        onChange={(e) =>
                          updatePrescriptionItem(
                            index,
                            "dosage",
                            e.target.value
                          )
                        }
                        placeholder="3x1"
                        style={{
                          padding: "0.5rem",
                          border: "1px solid #d1d5db",
                          borderRadius: "0.375rem",
                          fontSize: "0.75rem",
                        }}
                      />
                      <input
                        type="text"
                        value={item.instructions}
                        onChange={(e) =>
                          updatePrescriptionItem(
                            index,
                            "instructions",
                            e.target.value
                          )
                        }
                        placeholder="Setelah makan"
                        style={{
                          padding: "0.5rem",
                          border: "1px solid #d1d5db",
                          borderRadius: "0.375rem",
                          fontSize: "0.75rem",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removePrescriptionItem(index)}
                        style={{
                          background: "#ef4444",
                          color: "white",
                          border: "none",
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          fontSize: "1rem",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  {prescriptionItems.length === 0 && (
                    <p
                      style={{
                        textAlign: "center",
                        color: "#6b7280",
                        fontSize: "0.875rem",
                        padding: "1rem",
                      }}
                    >
                      Klik "+ Tambah Obat" untuk menambahkan resep
                    </p>
                  )}
                </div>

                <div style={{ marginBottom: "1rem" }}>
                  <label
                    style={{
                      display: "block",
                      fontWeight: 500,
                      color: "#374151",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Catatan Tambahan
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Catatan untuk apoteker atau pasien..."
                    rows={2}
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      border: "1px solid #d1d5db",
                      borderRadius: "0.5rem",
                      fontSize: "0.875rem",
                    }}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "0.75rem",
                  padding: "1.25rem 1.5rem",
                  borderTop: "1px solid #e5e7eb",
                }}
              >
                <button
                  onClick={handleQuickComplete}
                  disabled={submitting}
                  style={{
                    padding: "0.75rem 1.5rem",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    border: "none",
                    borderRadius: "0.5rem",
                    cursor: "pointer",
                    background: "#e5e7eb",
                    color: "#374151",
                  }}
                >
                  Selesai Tanpa Resep
                </button>
                <button
                  onClick={handleCompleteWithPrescription}
                  disabled={submitting}
                  style={{
                    padding: "0.75rem 1.5rem",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    border: "none",
                    borderRadius: "0.5rem",
                    cursor: "pointer",
                    background: "#2563eb",
                    color: "white",
                    opacity: submitting ? 0.6 : 1,
                  }}
                >
                  {submitting ? "Memproses..." : "Selesai & Kirim Resep"}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

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
                  onClick={() => openPrescriptionModal(data.currentlyServing!)}
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
