"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/services/api";
import { Attendance } from "@/types";
import styles from "./attendance.module.css";

export default function AttendancePage() {
  const [todayStatus, setTodayStatus] = useState<Attendance | null>(null);
  const [history, setHistory] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraMode, setCameraMode] = useState<"checkin" | "checkout">(
    "checkin"
  );
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    loadData();
    return () => {
      stopCamera();
    };
  }, []);

  const loadData = async () => {
    try {
      const [todayRes, historyRes] = await Promise.all([
        api.get("/attendance/today"),
        api.get("/attendance/history"),
      ]);
      setTodayStatus(todayRes.data.id ? todayRes.data : null);
      setHistory(historyRes.data);
    } catch (error) {
      console.error("Failed to load attendance:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const startCamera = async (mode: "checkin" | "checkout") => {
    setCameraMode(mode);
    setCapturedPhoto(null);
    setShowCamera(true);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Failed to access camera:", error);
      alert(
        "Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan."
      );
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const photoData = canvas.toDataURL("image/jpeg", 0.8);
        setCapturedPhoto(photoData);
        stopCamera();
      }
    }
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    startCamera(cameraMode);
  };

  const cancelCamera = () => {
    stopCamera();
    setCapturedPhoto(null);
    setShowCamera(false);
  };

  const submitAttendance = async () => {
    if (!capturedPhoto) return;

    setActionLoading(true);
    try {
      // Get current location
      let location;
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>(
            (resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 5000,
              });
            }
          );
          location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
        } catch (e) {
          // Location optional
        }
      }

      const endpoint =
        cameraMode === "checkin"
          ? "/attendance/check-in"
          : "/attendance/check-out";
      await api.post(endpoint, {
        location,
        photo: capturedPhoto,
      });

      setShowCamera(false);
      setCapturedPhoto(null);
      loadData();
    } catch (error: any) {
      alert(
        error.response?.data?.message ||
          `Gagal ${cameraMode === "checkin" ? "check-in" : "check-out"}`
      );
    } finally {
      setActionLoading(false);
    }
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; class: string }> = {
      present: { label: "Hadir", class: styles.badgeSuccess },
      late: { label: "Terlambat", class: styles.badgeWarning },
      absent: { label: "Tidak Hadir", class: styles.badgeDanger },
      leave: { label: "Cuti", class: styles.badgeInfo },
      sick: { label: "Sakit", class: styles.badgeInfo },
    };
    const { label, class: className } = statusMap[status] || {
      label: status,
      class: "",
    };
    return <span className={`${styles.badge} ${className}`}>{label}</span>;
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
      {/* Camera Modal */}
      {showCamera && (
        <div className={styles.cameraModal}>
          <div className={styles.cameraContainer}>
            <div className={styles.cameraHeader}>
              <h3>
                {cameraMode === "checkin" ? "Check In" : "Check Out"} - Ambil
                Foto
              </h3>
              <button onClick={cancelCamera} className={styles.closeBtn}>
                ×
              </button>
            </div>

            <div className={styles.cameraPreview}>
              {!capturedPhoto ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className={styles.video}
                />
              ) : (
                <img
                  src={capturedPhoto}
                  alt="Captured"
                  className={styles.capturedPhoto}
                />
              )}
              <canvas ref={canvasRef} style={{ display: "none" }} />
            </div>

            <div className={styles.cameraActions}>
              {!capturedPhoto ? (
                <button onClick={capturePhoto} className={styles.captureBtn}>
                  Ambil Foto
                </button>
              ) : (
                <>
                  <button
                    onClick={retakePhoto}
                    className={`${styles.btn} ${styles.btnSecondary}`}
                  >
                    Ulangi
                  </button>
                  <button
                    onClick={submitAttendance}
                    disabled={actionLoading}
                    className={`${styles.btn} ${styles.btnPrimary}`}
                  >
                    {actionLoading ? "Mengirim..." : "Kirim"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <div className={styles.header}>
        <h1 className={styles.title}>Absensi</h1>
        <p className={styles.date}>
          {new Date().toLocaleDateString("id-ID", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <div className={styles.todayCard}>
        <h2>Status Hari Ini</h2>
        <div className={styles.todayContent}>
          <div className={styles.timeBlock}>
            <span className={styles.timeLabel}>Check In</span>
            <span className={styles.timeValue}>
              {formatTime(todayStatus?.checkIn)}
            </span>
          </div>
          <div className={styles.timeBlock}>
            <span className={styles.timeLabel}>Check Out</span>
            <span className={styles.timeValue}>
              {formatTime(todayStatus?.checkOut)}
            </span>
          </div>
          <div className={styles.timeBlock}>
            <span className={styles.timeLabel}>Status</span>
            {todayStatus ? getStatusBadge(todayStatus.status) : <span>-</span>}
          </div>
        </div>
        <div className={styles.actions}>
          {!todayStatus?.checkIn && (
            <button
              onClick={() => startCamera("checkin")}
              disabled={actionLoading}
              className={`${styles.btn} ${styles.btnPrimary}`}
            >
              Check In
            </button>
          )}
          {todayStatus?.checkIn && !todayStatus?.checkOut && (
            <button
              onClick={() => startCamera("checkout")}
              disabled={actionLoading}
              className={`${styles.btn} ${styles.btnDanger}`}
            >
              Check Out
            </button>
          )}
          {todayStatus?.checkIn && todayStatus?.checkOut && (
            <p className={styles.completedText}>Absensi hari ini selesai</p>
          )}
        </div>
      </div>

      <div className={styles.historySection}>
        <h2>Riwayat Absensi</h2>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((record) => (
                <tr key={record.id}>
                  <td>
                    {new Date(record.attendanceDate).toLocaleDateString(
                      "id-ID",
                      {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      }
                    )}
                  </td>
                  <td>{formatTime(record.checkIn)}</td>
                  <td>{formatTime(record.checkOut)}</td>
                  <td>{getStatusBadge(record.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {history.length === 0 && (
            <div className={styles.emptyState}>Belum ada riwayat absensi</div>
          )}
        </div>
      </div>
    </div>
  );
}
