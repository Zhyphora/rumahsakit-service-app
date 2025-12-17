"use client";

import Link from "next/link";
import styles from "./home.module.css";
import {
  FaTv,
  FaUserMd,
  FaTicketAlt,
  FaSignInAlt,
  FaLock,
} from "react-icons/fa";

export default function HomePage() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Rumah Sakit</h1>
        <p className={styles.subtitle}>
          Sistem Manajemen Rumah Sakit Terintegrasi
        </p>
      </header>

      <div className={styles.grid}>
        <Link href="/queue-display" className={styles.card}>
          <div className={styles.cardIcon}>
            <FaTv />
          </div>
          <h2>Display Antrian</h2>
          <p>Tampilan antrian untuk layar TV di lobby</p>
        </Link>

        <Link href="/doctors" className={styles.card}>
          <div className={styles.cardIcon}>
            <FaUserMd />
          </div>
          <h2>Dokter Bertugas</h2>
          <p>Lihat dokter yang bertugas hari ini</p>
        </Link>

        <Link href="/take-queue" className={styles.card}>
          <div className={styles.cardIcon}>
            <FaTicketAlt />
          </div>
          <h2>Ambil Antrian</h2>
          <p>Ambil nomor antrian baru</p>
        </Link>

        <Link href="/login" className={styles.card}>
          <div className={styles.cardIcon}>
            <FaSignInAlt />
          </div>
          <h2>Login Staff</h2>
          <p>Masuk untuk akses dashboard</p>
        </Link>

        <Link href="/admin/access-controls" className={styles.card}>
          <div className={styles.cardIcon}>
            <FaLock />
          </div>
          <h2>Access Control</h2>
          <p>Kelola izin fitur per peran</p>
        </Link>
      </div>

      <section className={styles.features}>
        <h2>Fitur Sistem</h2>
        <div className={styles.featureGrid}>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>1</span>
            <h3>Antrian Real-time</h3>
            <p>Sistem antrian dengan WebSocket untuk update otomatis</p>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>2</span>
            <h3>Stock Opname</h3>
            <p>Manajemen inventaris obat dan alat medis</p>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>3</span>
            <h3>Dokumen</h3>
            <p>Penyimpanan dokumen dengan akses kontrol</p>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>4</span>
            <h3>Absensi</h3>
            <p>Sistem absensi untuk dokter dan staff</p>
          </div>
        </div>
      </section>
    </div>
  );
}
