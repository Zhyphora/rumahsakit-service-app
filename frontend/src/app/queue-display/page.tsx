"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import styles from "./display.module.css";
import Navbar from "@/components/Navbar";
import {
  FiClock,
  FiUser,
  FiActivity,
  FiVolume2,
  FiWifi,
  FiWifiOff,
} from "react-icons/fi";  

interface DoctorQueueData {
  doctor: {
    id: string;
    name: string;
    specialization: string;
  };
  polyclinic: {
    id: string;
    name: string;
    code: string;
  };
  currentNumber: number;
  currentPatient: string | null;
  status: "waiting" | "called" | "serving";
  waitingCount: number;
  schedule: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001";

// Check if doctor is available based on schedule time
const isDoctorAvailable = (schedule: string): boolean => {
  if (!schedule) return true;

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const match = schedule.match(/(\d{2}):(\d{2})\s*-\s*(\d{2}):(\d{2})/);
  if (match) {
    const startTime = parseInt(match[1]) * 60 + parseInt(match[2]);
    const endTime = parseInt(match[3]) * 60 + parseInt(match[4]);
    return currentTime >= startTime && currentTime <= endTime;
  }
  return true;
};

// Convert number to Indonesian words
const numberToWords = (num: number): string => {
  const ones = [
    "",
    "satu",
    "dua",
    "tiga",
    "empat",
    "lima",
    "enam",
    "tujuh",
    "delapan",
    "sembilan",
  ];
  const tens = [
    "",
    "sepuluh",
    "dua puluh",
    "tiga puluh",
    "empat puluh",
    "lima puluh",
    "enam puluh",
    "tujuh puluh",
    "delapan puluh",
    "sembilan puluh",
  ];
  const teens = [
    "sepuluh",
    "sebelas",
    "dua belas",
    "tiga belas",
    "empat belas",
    "lima belas",
    "enam belas",
    "tujuh belas",
    "delapan belas",
    "sembilan belas",
  ];

  if (num === 0) return "nol";
  if (num < 10) return ones[num];
  if (num >= 10 && num < 20) return teens[num - 10];
  if (num < 100) {
    return (
      tens[Math.floor(num / 10)] + (num % 10 !== 0 ? " " + ones[num % 10] : "")
    );
  }
  if (num < 1000) {
    const hundreds = Math.floor(num / 100);
    const remainder = num % 100;
    const hundredWord = hundreds === 1 ? "seratus" : ones[hundreds] + " ratus";
    return (
      hundredWord + (remainder !== 0 ? " " + numberToWords(remainder) : "")
    );
  }
  return String(num);
};

export default function QueueDisplayPage() {
  const [displayData, setDisplayData] = useState<DoctorQueueData[]>([]);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Track which queue numbers have been announced to avoid repeating
  const announcedQueues = useRef<Set<string>>(new Set());

  // Speech queue to prevent overlapping announcements
  const speechQueue = useRef<
    Array<{
      text: string;
      repeatCount: number;
    }>
  >([]);
  const isSpeaking = useRef(false);

  // Cache the selected voice for consistency
  const cachedVoice = useRef<SpeechSynthesisVoice | null>(null);

  // Initialize and cache the voice
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const loadVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0 && !cachedVoice.current) {
        // Priority: Indonesian voice > English voice > first available
        const indonesianVoice = voices.find(
          (v) => v.lang.includes("id") || v.lang.includes("ID")
        );
        const englishVoice = voices.find((v) => v.lang.includes("en"));

        cachedVoice.current = indonesianVoice || englishVoice || voices[0];
        console.log("Selected voice:", cachedVoice.current?.name);
      }
    };

    // Load voices immediately
    loadVoice();

    // Also listen for voiceschanged event (needed for some browsers)
    window.speechSynthesis.onvoiceschanged = loadVoice;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Process the speech queue
  const processSpeechQueue = useCallback(() => {
    if (
      isSpeaking.current ||
      speechQueue.current.length === 0 ||
      typeof window === "undefined"
    )
      return;
    if (!("speechSynthesis" in window)) return;

    isSpeaking.current = true;
    const item = speechQueue.current[0];

    const utterance = new SpeechSynthesisUtterance(item.text);
    utterance.lang = "id-ID";
    utterance.rate = 0.85;
    utterance.pitch = 1;
    utterance.volume = 1;

    // Use cached voice for consistency
    if (cachedVoice.current) {
      utterance.voice = cachedVoice.current;
    }

    utterance.onend = () => {
      item.repeatCount--;

      if (item.repeatCount > 0) {
        // Still need to repeat - wait 1.5 seconds before next repeat
        setTimeout(() => {
          isSpeaking.current = false;
          processSpeechQueue();
        }, 1500);
      } else {
        // Done with this item, remove and process next after 2 seconds
        speechQueue.current.shift();
        setTimeout(() => {
          isSpeaking.current = false;
          processSpeechQueue();
        }, 2000);
      }
    };

    utterance.onerror = () => {
      // On error, skip to next
      speechQueue.current.shift();
      isSpeaking.current = false;
      processSpeechQueue();
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  // Add announcement to queue (repeat 3 times)
  const queueAnnouncement = useCallback(
    (
      queueCode: string,
      queueNumber: number,
      polyclinicName: string,
      patientName?: string | null
    ) => {
      if (!soundEnabled || typeof window === "undefined") return;
      if (!("speechSynthesis" in window)) {
        console.warn("Speech synthesis not supported");
        return;
      }

      const numberFormatted = String(queueNumber).padStart(3, "0");
      const uniqueKey = `${queueCode}-${numberFormatted}`;

      // Don't announce if already announced
      if (announcedQueues.current.has(uniqueKey)) return;
      announcedQueues.current.add(uniqueKey);

      // Build announcement text with patient name
      const queueNumberWords = numberToWords(queueNumber);
      let announcement = `Nomor antrian ${queueCode} ${queueNumberWords}`;

      if (patientName) {
        announcement += `, atas nama ${patientName}`;
      }

      announcement += `, silakan menuju ${polyclinicName}`;

      // Add to queue with 3 repeats
      speechQueue.current.push({
        text: announcement,
        repeatCount: 3,
      });

      // Start processing if not already
      processSpeechQueue();
    },
    [soundEnabled, processSpeechQueue]
  );

  // Detect when a queue is called and announce it
  useEffect(() => {
    displayData.forEach((item) => {
      if (item.status === "called" && item.currentNumber > 0) {
        queueAnnouncement(
          item.polyclinic.code,
          item.currentNumber,
          item.polyclinic.name,
          item.currentPatient
        );
      }
    });
  }, [displayData, queueAnnouncement]);

  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());
    loadDisplayData();

    // Load voices (needed for some browsers)
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
    }

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Setup WebSocket connection
    const socket = io(WS_URL);
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("WebSocket connected");
      setWsConnected(true);
      socket.emit("join:display");
    });

    socket.on("disconnect", () => {
      console.log("WebSocket disconnected");
      setWsConnected(false);
    });

    // Real-time queue update
    socket.on("queue:update", () => {
      loadDisplayData();
    });

    // Instant notification when queue is called
    socket.on("queue:called", (data: any) => {
      console.log("Queue called via WebSocket:", data);
      // Immediately refresh to get latest data
      loadDisplayData();
    });

    // Fallback polling every 10 seconds (in case WebSocket fails)
    const dataInterval = setInterval(() => {
      if (!wsConnected) {
        loadDisplayData();
      }
    }, 10000);

    return () => {
      clearInterval(timer);
      clearInterval(dataInterval);
      socket.close();
    };
  }, []);

  const loadDisplayData = async () => {
    try {
      const res = await fetch(`${API_URL}/doctors/queue-display`);
      const data = await res.json();
      setDisplayData(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load display data:", error);
    }
  };

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

  // Toggle sound on/off
  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };

  // Add availability status to each doctor
  const doctorsWithAvailability = displayData.map((item) => ({
    ...item,
    isAvailable: isDoctorAvailable(item.schedule),
  }));

  return (
    <div className={styles.container}>
      <Navbar />
      <header className={styles.header}>
        <div className={styles.headerControls}>
          <button
            onClick={toggleSound}
            className={`${styles.soundToggle} ${
              soundEnabled ? styles.soundOn : styles.soundOff
            }`}
            title={soundEnabled ? "Matikan suara" : "Nyalakan suara"}
          >
            <FiVolume2 size={20} />
            {soundEnabled ? "Suara Aktif" : "Suara Mati"}
          </button>
          <div
            className={`${styles.wsStatus} ${
              wsConnected ? styles.wsConnected : styles.wsDisconnected
            }`}
          >
            {wsConnected ? <FiWifi size={16} /> : <FiWifiOff size={16} />}
            {wsConnected ? "Live" : "Offline"}
          </div>
        </div>
        <div
          className={styles.time}
          style={{ width: "100%", textAlign: "right" }}
        >
          {mounted && currentTime ? formatDate(currentTime) : ""}
          <span className={styles.clock}>
            {mounted && currentTime ? formatTime(currentTime) : "--:--:--"}
          </span>
        </div>
      </header>

      <div className={styles.grid}>
        {doctorsWithAvailability.map((item) => (
          <div
            key={item.doctor.id}
            className={`${styles.queueCard} ${
              !item.isAvailable ? styles.unavailable : ""
            } ${item.status === "serving" ? styles.serving : ""} ${
              item.status === "called" ? styles.called : ""
            }`}
          >
            <div className={styles.doctorHeader}>
              <div className={styles.doctorAvatar}>
                <FiUser size={20} />
              </div>
              <div className={styles.doctorInfo}>
                <span className={styles.doctorName}>{item.doctor.name}</span>
                <span className={styles.doctorSpec}>
                  {item.doctor.specialization}
                </span>
              </div>
            </div>

            <div className={styles.polyName}>
              <span className={styles.polyCode}>{item.polyclinic.code}</span>
              {item.polyclinic.name}
            </div>

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

            <div className={styles.scheduleInfo}>
              <FiClock size={12} />
              <span>{item.schedule}</span>
            </div>
          </div>
        ))}
      </div>

      {doctorsWithAvailability.length === 0 && (
        <div className={styles.emptyState}>
          <p>Tidak ada dokter yang bertugas hari ini</p>
          <p className={styles.hint}>Silakan kembali pada jam operasional</p>
        </div>
      )}

      <footer className={styles.footer}>
        <div className={styles.marquee}>
          <span>
            Selamat datang di MediKu • Silakan menunggu nomor antrian Anda
            dipanggil • Untuk informasi lebih lanjut, silakan hubungi petugas
            loket •
          </span>
        </div>
      </footer>
    </div>
  );
}
