"use client";

import Link from "next/link";
import styles from "./home.module.css";
import {
  FaTv,
  FaUserMd,
  FaTicketAlt,
  FaSignInAlt,
  FaLock,
  FaHospitalSymbol,
  FaUserInjured,
  FaFingerprint,
  FaPhoneAlt,
  FaSearch,
  FaAmbulance,
  FaNotesMedical,
  FaStethoscope,
  FaClock,
} from "react-icons/fa";
import { useState } from "react";
import { useRouter } from "next/navigation";

import Navbar from "@/components/Navbar";

// Static Doctor Data (matching seed data)
const doctors = [
  {
    name: "Dr. Budi",
    specialization: "Dokter Umum",
    image:
      "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=2070&auto=format&fit=crop",
    schedule: "08:00 - 16:00",
  },
  {
    name: "Dr. Siti",
    specialization: "Dokter Anak",
    image:
      "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=2070&auto=format&fit=crop",
    schedule: "09:00 - 15:00",
  },
  {
    name: "Dr. Andi",
    specialization: "Dokter Gigi",
    image:
      "https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=1964&auto=format&fit=crop",
    schedule: "08:00 - 14:00",
  },
  {
    name: "Dr. Rina",
    specialization: "Dokter Mata",
    image:
      "https://images.unsplash.com/photo-1594824476967-48c8b964273f?q=80&w=1974&auto=format&fit=crop",
    schedule: "10:00 - 18:00",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/doctors?search=${searchQuery}`);
  };

  return (
    <div className={styles.container}>
      {/* Top Bar */}
      <div className={styles.topBar}>
        <div className={styles.topBarContent}>
          <div className={styles.contactInfo}>
            <div className={styles.contactItem}>
              <FaPhoneAlt /> (021) 50829292
            </div>
            <div className={styles.contactItem}>
              <FaAmbulance /> Gawat Darurat: 119
            </div>
          </div>
          {/* <Link href="/login" className={styles.staffLink}>
            <FaSignInAlt /> Login Staff
          </Link> */}
        </div>
      </div>

      {/* Navbar */}
      <Navbar />

      {/* Hero Section */}
      <header className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroLeft}>
            <div className={styles.heroTagline}>
              <h1 className={styles.heroTitle}>
                Layanan Kesehatan <br />
                <span style={{ color: "#0284c7" }}>Terpercaya</span> & Modern
              </h1>
              <p className={styles.heroSubtitle}>
                MediKu hadir memberikan pelayanan medis terbaik dengan teknologi
                terintegrasi untuk kenyamanan Anda dan keluarga.
              </p>
            </div>
          </div>

          <div className={styles.heroRight}>
            {/* Using a high quality Unsplash image of a doctor/medical team */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=1964&auto=format&fit=crop"
              alt="Medical Team"
              className={styles.heroImage}
            />
          </div>

          {/* Floating Search Box */}
          <div className={styles.searchBox}>
            <div className={styles.searchLabel}>
              <FaStethoscope /> Cari Dokter Spesialis
            </div>
            <form onSubmit={handleSearch} className={styles.searchForm}>
              <div className={styles.searchInputWrapper}>
                <FaSearch
                  style={{
                    position: "absolute",
                    left: "1rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8",
                  }}
                />
                <input
                  type="text"
                  placeholder="Cari nama dokter atau spesialisasi (ex: Mata, Anak)..."
                  className={styles.searchInput}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <button type="submit" className={styles.searchButton}>
                Telusuri
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Features / Layanan Section */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Layanan Unggulan</h2>
          <p className={styles.sectionSubtitle}>
            Akses cepat fitur utama MediKu untuk kebutuhan kesehatan Anda
          </p>
        </div>

        <div className={styles.featuresGrid}>
          <Link href="/take-queue" className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <FaTicketAlt />
            </div>
            <h3>Ambil Antrian Online</h3>
            <p>
              Daftar antrian poliklinik dari mana saja tanpa perlu antre lama di
              loket pendaftaran.
            </p>
          </Link>

          <Link href="/login?role=patient" className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <FaUserInjured />
            </div>
            <h3>Portal Pasien</h3>
            <p>
              Akses riwayat medis, jadwal kontrol, dan resep obat digital Anda
              melalui akun pasien.
            </p>
          </Link>

          <Link href="/doctors" className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <FaUserMd />
            </div>
            <h3>Jadwal Dokter</h3>
            <p>
              Lihat profil dan jadwal praktik dokter spesialis kami yang siap
              melayani Anda.
            </p>
          </Link>

          <Link href="/queue-display" className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <FaTv />
            </div>
            <h3>Monitor Antrian</h3>
            <p>
              Pantau panggilan nomor antrian secara real-time di layar lobby
              maupun gadget Anda.
            </p>
          </Link>
        </div>
      </section>

      {/* Tim Dokter Section */}
      <section className={styles.section} style={{ marginTop: 0 }}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Tim Dokter Spesialis</h2>
          <p className={styles.sectionSubtitle}>
            Ditangani langsung oleh dokter ahli yang berpengalaman di bidangnya
          </p>
        </div>

        <div className={styles.doctorGrid}>
          {doctors.map((doc, index) => (
            <Link href="/doctors" key={index} className={styles.doctorCard}>
              <div className={styles.doctorImageContainer}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={doc.image}
                  alt={doc.name}
                  className={styles.doctorImage}
                />
              </div>
              <div className={styles.doctorInfo}>
                <h3 className={styles.doctorName}>{doc.name}</h3>
                <div className={styles.doctorSpecialty}>
                  {doc.specialization}
                </div>
                <div className={styles.doctorSchedule}>
                  <FaClock /> {doc.schedule}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Mengapa Kami */}
      <section
        className={styles.section}
        style={{ background: "white", borderRadius: "2rem", padding: "4rem" }}
      >
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Mengapa MediKu?</h2>
        </div>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard} style={{ border: "none" }}>
            <div
              className={styles.featureIcon}
              style={{ background: "#ecfdf5", color: "#059669" }}
            >
              <FaNotesMedical />
            </div>
            <h3>Terintegrasi</h3>
            <p>Data medis terpusat memudahkan diagnosis yang akurat.</p>
          </div>
          <div className={styles.featureCard} style={{ border: "none" }}>
            <div
              className={styles.featureIcon}
              style={{ background: "#eff6ff", color: "#2563eb" }}
            >
              <FaHp />
            </div>
            <h3>Teknologi Modern</h3>
            <p>Sistem antrian dan rekam medis digital yang efisien.</p>
          </div>
          <div className={styles.featureCard} style={{ border: "none" }}>
            <div
              className={styles.featureIcon}
              style={{ background: "#fff7ed", color: "#ea580c" }}
            >
              <FaFingerprint />
            </div>
            <h3>Keamanan Data</h3>
            <p>Privasi pasien terjaga dengan sistem enkripsi tingkat tinggi.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerCol}>
            <div
              className={styles.logo}
              style={{ color: "white", marginBottom: "1rem" }}
            >
              <FaHospitalSymbol />{" "}
              <span style={{ fontWeight: 800 }}>MediKu</span>
            </div>
            <p style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
              Kami berdedikasi untuk memberikan layanan kesehatan terbaik dengan
              sentuhan kemanusiaan dan teknologi.
            </p>
          </div>
          <div className={styles.footerCol}>
            <h4>Layanan Pasien</h4>
            <ul className={styles.footerLinks}>
              <li>
                <Link href="/take-queue">Ambil Antrian</Link>
              </li>
              <li>
                <Link href="/doctors">Jadwal Dokter</Link>
              </li>
              <li>
                <Link href="/login?role=patient">Portal Pasien</Link>
              </li>
            </ul>
          </div>
          <div className={styles.footerCol}>
            <h4>Hubungi Kami</h4>
            <ul className={styles.footerLinks}>
              <li>(021) 50829292</li>
              <li>info@mediku-hospital.com</li>
              <li>Jl. Kesehatan No. 1, Jakarta</li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Icon wrapper for FaHp unavailable
function FaHp(props: any) {
  return <FaHospitalSymbol {...props} />;
}
