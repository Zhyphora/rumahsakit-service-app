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
  FaTimes,
  FaCalendarAlt,
  FaEnvelope,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

import Navbar from "@/components/Navbar";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// Doctor photo mapping based on doctor's name
const doctorPhotoMap: Record<string, string> = {
  "Dr. Budi Santoso": "/doctors/doctor_budi_santoso.png",
  "Dr. Ratna Sari": "/doctors/doctor_ratna_sari.png",
  "Dr. Siti Rahayu": "/doctors/doctor_siti_rahayu.png",
  "Dr. Hendra Wijaya": "/doctors/doctor_hendra_wijaya.png",
  "Dr. Ahmad Prasetyo": "/doctors/doctor_ahmad_prasetyo.png",
  "Dr. Lisa Permata": "/doctors/doctor_lisa_permata.png",
  "Dr. Maria Dewi": "/doctors/doctor_maria_dewi.png",
  "Dr. Agus Setiawan": "/doctors/doctor_agus_setiawan.png",
  "Dr. Yulia Andini": "/doctors/doctor_yulia_andini.png",
  "Dr. Rizky Pratama": "/doctors/doctor_rizky_pratama.png",
  "Dr. Farhan": "/doctors/doctor_farhan.png",
  "Dr. Diana": "/doctors/doctor_diana.png",
  "Dr. Eko": "/doctors/doctor_eko.png",
  "Dr. Fajar": "/doctors/doctor_fajar.png",
  "Dr. Gilang": "/doctors/doctor_gilang.png",
};

// Default photo for doctors not in the map
const defaultDoctorPhoto =
  "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=2070&auto=format&fit=crop";

// Get doctor photo based on name
const getDoctorPhoto = (name: string): string => {
  return doctorPhotoMap[name] || defaultDoctorPhoto;
};

// Interface for Doctor data from API
interface Doctor {
  id: string;
  specialization: string;
  schedule: Record<string, { start: string; end: string }> | null;
  user: {
    id: string;
    name: string;
    email: string;
  };
  polyclinic?: {
    id: string;
    name: string;
    code: string;
  };
}

// Format schedule for display
const formatSchedule = (
  schedule: Record<string, { start: string; end: string }> | null
): string => {
  if (!schedule) return "Jadwal belum tersedia";

  const days = Object.keys(schedule);
  if (days.length === 0) return "Jadwal belum tersedia";

  // Just show first day's schedule for the card
  const firstDay = schedule[days[0]];
  return `${firstDay.start} - ${firstDay.end}`;
};

// Format full schedule for modal
const formatFullSchedule = (
  schedule: Record<string, { start: string; end: string }> | null
): { day: string; time: string }[] => {
  if (!schedule) return [];

  const dayNames: Record<string, string> = {
    monday: "Senin",
    tuesday: "Selasa",
    wednesday: "Rabu",
    thursday: "Kamis",
    friday: "Jumat",
    saturday: "Sabtu",
    sunday: "Minggu",
  };

  return Object.entries(schedule).map(([day, time]) => ({
    day: dayNames[day.toLowerCase()] || day,
    time: `${time.start} - ${time.end}`,
  }));
};

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [polyclinics, setPolyclinics] = useState<
    { id: string; name: string }[]
  >([]);
  const [activeTab, setActiveTab] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  // Search dropdown state
  const [searchResults, setSearchResults] = useState<Doctor[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Doctor detail modal state
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showDoctorModal, setShowDoctorModal] = useState(false);

  // Fetch doctors from API
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await fetch(`${API_URL}/doctors`);
        if (response.ok) {
          const data: Doctor[] = await response.json();
          setDoctors(data);

          // Extract unique polyclinics
          const uniquePolyclinics = data
            .filter((d) => d.polyclinic)
            .map((d) => d.polyclinic!)
            .filter(
              (poly, index, self) =>
                index === self.findIndex((p) => p.id === poly.id)
            );
          setPolyclinics(uniquePolyclinics);
        }
      } catch (error) {
        console.error("Error fetching doctors:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDoctors();
  }, []);

  // Filter doctors by active tab
  const filteredDoctors =
    activeTab === "all"
      ? doctors
      : doctors.filter((d) => d.polyclinic?.id === activeTab);

  // Debounced search function
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const debouncedSearch = useCallback(
    (query: string) => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
      debounceTimeout.current = setTimeout(() => {
        if (!query.trim()) {
          setSearchResults([]);
          setShowSearchDropdown(false);
          return;
        }

        setIsSearching(true);
        const lowerQuery = query.toLowerCase();
        const results = doctors.filter(
          (doc) =>
            doc.user.name.toLowerCase().includes(lowerQuery) ||
            doc.specialization.toLowerCase().includes(lowerQuery) ||
            doc.polyclinic?.name.toLowerCase().includes(lowerQuery)
        );
        setSearchResults(results.slice(0, 5)); // Show max 5 results
        setShowSearchDropdown(true);
        setIsSearching(false);
      }, 300);
    },
    [doctors]
  );

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedSearch(value);
  };

  // Handle clicking on a search result
  const handleDoctorClick = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowDoctorModal(true);
    setShowSearchDropdown(false);
    setSearchQuery("");
  };

  // Close modal
  const closeDoctorModal = () => {
    setShowDoctorModal(false);
    setSelectedDoctor(null);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle form submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/doctors?search=${searchQuery}`);
    }
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
          <div className={styles.searchBox} ref={searchRef}>
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
                    zIndex: 1,
                  }}
                />
                <input
                  type="text"
                  placeholder="Cari nama dokter atau spesialisasi (ex: Mata, Anak)..."
                  className={styles.searchInput}
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => searchQuery && setShowSearchDropdown(true)}
                />

                {/* Live Search Dropdown */}
                {showSearchDropdown && (
                  <div className={styles.searchDropdown}>
                    {isSearching ? (
                      <div className={styles.searchDropdownLoading}>
                        <div className={styles.miniSpinner}></div>
                        Mencari...
                      </div>
                    ) : searchResults.length > 0 ? (
                      <>
                        {searchResults.map((doc) => (
                          <div
                            key={doc.id}
                            className={styles.searchResultItem}
                            onClick={() => handleDoctorClick(doc)}
                          >
                            <div className={styles.searchResultImage}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={getDoctorPhoto(doc.user.name)}
                                alt={doc.user.name}
                              />
                            </div>
                            <div className={styles.searchResultInfo}>
                              <div className={styles.searchResultName}>
                                {doc.user.name}
                              </div>
                              <div className={styles.searchResultSpecialty}>
                                {doc.specialization}
                              </div>
                              {doc.polyclinic && (
                                <div className={styles.searchResultPoli}>
                                  {doc.polyclinic.name}
                                </div>
                              )}
                            </div>
                            <div className={styles.searchResultArrow}>→</div>
                          </div>
                        ))}
                        <div
                          className={styles.searchViewAll}
                          onClick={() => {
                            router.push(`/doctors?search=${searchQuery}`);
                            setShowSearchDropdown(false);
                          }}
                        >
                          Lihat semua hasil untuk "{searchQuery}"
                        </div>
                      </>
                    ) : (
                      <div className={styles.searchNoResults}>
                        <FaUserMd
                          style={{ fontSize: "2rem", color: "#cbd5e1" }}
                        />
                        <p>Tidak ada dokter ditemukan</p>
                        <span>Coba kata kunci lain</span>
                      </div>
                    )}
                  </div>
                )}
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

        {/* Polyclinic Filter Tabs */}
        <div className={styles.filterTabs}>
          <button
            className={`${styles.filterTab} ${
              activeTab === "all" ? styles.filterTabActive : ""
            }`}
            onClick={() => setActiveTab("all")}
          >
            Semua
          </button>
          {polyclinics.map((poly) => (
            <button
              key={poly.id}
              className={`${styles.filterTab} ${
                activeTab === poly.id ? styles.filterTabActive : ""
              }`}
              onClick={() => setActiveTab(poly.id)}
            >
              {poly.name}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p>Memuat data dokter...</p>
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className={styles.emptyState}>
            <FaUserMd
              style={{
                fontSize: "3rem",
                color: "#94a3b8",
                marginBottom: "1rem",
              }}
            />
            <p>Tidak ada dokter ditemukan</p>
          </div>
        ) : (
          <div className={styles.doctorGrid}>
            {filteredDoctors.map((doc) => (
              <div
                key={doc.id}
                className={styles.doctorCard}
                onClick={() => handleDoctorClick(doc)}
                style={{ cursor: "pointer" }}
              >
                <div className={styles.doctorImageContainer}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getDoctorPhoto(doc.user.name)}
                    alt={doc.user.name}
                    className={styles.doctorImage}
                  />
                  {doc.polyclinic && (
                    <div className={styles.doctorPoliBadge}>
                      {doc.polyclinic.name}
                    </div>
                  )}
                </div>
                <div className={styles.doctorInfo}>
                  <h3 className={styles.doctorName}>{doc.user.name}</h3>
                  <div className={styles.doctorSpecialty}>
                    {doc.specialization}
                  </div>
                  <div className={styles.doctorSchedule}>
                    <FaClock /> {formatSchedule(doc.schedule)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
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

      {/* Doctor Detail Modal */}
      {showDoctorModal && selectedDoctor && (
        <div className={styles.modalOverlay} onClick={closeDoctorModal}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button className={styles.modalClose} onClick={closeDoctorModal}>
              <FaTimes />
            </button>

            <div className={styles.modalHeader}>
              <div className={styles.modalImageContainer}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getDoctorPhoto(selectedDoctor.user.name)}
                  alt={selectedDoctor.user.name}
                  className={styles.modalImage}
                />
              </div>
              <div className={styles.modalHeaderInfo}>
                <h2 className={styles.modalDoctorName}>
                  {selectedDoctor.user.name}
                </h2>
                <div className={styles.modalSpecialty}>
                  {selectedDoctor.specialization}
                </div>
                {selectedDoctor.polyclinic && (
                  <div className={styles.modalPoliBadge}>
                    <FaMapMarkerAlt /> {selectedDoctor.polyclinic.name}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.modalSection}>
                <h4>
                  <FaEnvelope /> Kontak
                </h4>
                <p>{selectedDoctor.user.email}</p>
              </div>

              <div className={styles.modalSection}>
                <h4>
                  <FaCalendarAlt /> Jadwal Praktik
                </h4>
                <div className={styles.scheduleList}>
                  {formatFullSchedule(selectedDoctor.schedule).length > 0 ? (
                    formatFullSchedule(selectedDoctor.schedule).map((s, i) => (
                      <div key={i} className={styles.scheduleItem}>
                        <span className={styles.scheduleDay}>{s.day}</span>
                        <span className={styles.scheduleTime}>{s.time}</span>
                      </div>
                    ))
                  ) : (
                    <p className={styles.noSchedule}>Jadwal belum tersedia</p>
                  )}
                </div>
              </div>
            </div>

            <div className={styles.modalActions}>
              <Link
                href="/take-queue"
                className={styles.modalPrimaryButton}
                onClick={closeDoctorModal}
              >
                <FaTicketAlt /> Daftar Konsultasi
              </Link>
              <Link
                href={`/doctors?search=${selectedDoctor.user.name}`}
                className={styles.modalSecondaryButton}
                onClick={closeDoctorModal}
              >
                Lihat Profil Lengkap
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Icon wrapper for FaHp unavailable
function FaHp(props: any) {
  return <FaHospitalSymbol {...props} />;
}
