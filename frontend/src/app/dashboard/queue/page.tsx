"use client";

import { useState, useEffect } from "react";
import api from "@/services/api";
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
      {/* Prescription Modal */}
      {showPrescriptionModal && currentQueue && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Selesaikan Layanan</h2>
              <button
                onClick={() => setShowPrescriptionModal(false)}
                className={styles.closeBtn}
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.patientInfo}>
                <p>
                  <strong>Pasien:</strong> {currentQueue.patient?.name}
                </p>
              </div>

              <div className={styles.formGroup}>
                <label>Diagnosis</label>
                <textarea
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="Masukkan diagnosis..."
                  rows={2}
                />
              </div>

              <div className={styles.prescriptionSection}>
                <div className={styles.sectionHeader}>
                  <h3>Resep Obat</h3>
                  <button
                    type="button"
                    onClick={addPrescriptionItem}
                    className={styles.addBtn}
                  >
                    + Tambah Obat
                  </button>
                </div>

                {prescriptionItems.map((item, index) => (
                  <div key={index} className={styles.prescriptionRow}>
                    <select
                      value={item.itemId}
                      onChange={(e) =>
                        updatePrescriptionItem(index, "itemId", e.target.value)
                      }
                      className={styles.selectItem}
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
                      className={styles.inputQty}
                      placeholder="Jml"
                    />
                    <input
                      type="text"
                      value={item.dosage}
                      onChange={(e) =>
                        updatePrescriptionItem(index, "dosage", e.target.value)
                      }
                      className={styles.inputDosage}
                      placeholder="Dosis (cth: 3x1)"
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
                      className={styles.inputInstructions}
                      placeholder="Aturan (cth: Setelah makan)"
                    />
                    <button
                      type="button"
                      onClick={() => removePrescriptionItem(index)}
                      className={styles.removeBtn}
                    >
                      ×
                    </button>
                  </div>
                ))}

                {prescriptionItems.length === 0 && (
                  <p className={styles.noItems}>
                    Klik "+ Tambah Obat" untuk menambahkan resep
                  </p>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>Catatan Tambahan</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Catatan untuk apoteker atau pasien..."
                  rows={2}
                />
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                onClick={handleQuickComplete}
                disabled={submitting}
                className={`${styles.btn} ${styles.btnSecondary}`}
              >
                Selesai Tanpa Resep
              </button>
              <button
                onClick={handleCompleteWithPrescription}
                disabled={submitting}
                className={`${styles.btn} ${styles.btnPrimary}`}
              >
                {submitting ? "Memproses..." : "Selesai & Kirim Resep"}
              </button>
            </div>
          </div>
        </div>
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
