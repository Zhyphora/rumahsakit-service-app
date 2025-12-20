import Link from "next/link";
import styles from "./Navbar.module.css";
import { FaHospitalSymbol } from "react-icons/fa";

export default function Navbar() {
  return (
    <nav className={styles.navbar}>
      <div className={styles.navContent}>
        <Link href="/" className={styles.logo}>
          <FaHospitalSymbol className={styles.logoIcon} />
          <span className={styles.logoText}>MediKu</span>
        </Link>

        <div className={styles.navMenu}>
          <Link href="/doctors" className={styles.navLink}>
            Jadwal Dokter
          </Link>
          <Link href="/queue-display" className={styles.navLink}>
            Info Antrian
          </Link>
          <Link href="/login?role=patient" className={styles.navLink}>
            Masuk Pasien
          </Link>
          <Link href="/login" className={styles.navLink}>
            Masuk Staff
          </Link>
        </div>

        <Link href="/take-queue" className={styles.ctaButton}>
          Ambil Antrian
        </Link>
      </div>
    </nav>
  );
}
