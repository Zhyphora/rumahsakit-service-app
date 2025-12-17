"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";
import styles from "./layout.module.css";
import {
  FiHome,
  FiUsers,
  FiPackage,
  FiFileText,
  FiClock,
  FiList,
  FiActivity,
} from "react-icons/fi";
import { MdLocalPharmacy } from "react-icons/md";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Define nav items based on role
  const getNavItems = () => {
    const baseItems = [
      { href: "/dashboard", label: "Dashboard", icon: FiHome },
    ];

    switch (user.role) {
      case "admin":
        return [
          ...baseItems,
          { href: "/dashboard/queue", label: "Antrian", icon: FiList },
          { href: "/dashboard/patients", label: "Pasien", icon: FiUsers },
          {
            href: "/dashboard/pharmacy",
            label: "Farmasi",
            icon: MdLocalPharmacy,
          },
          { href: "/dashboard/stock", label: "Stock Opname", icon: FiPackage },
          { href: "/dashboard/documents", label: "Dokumen", icon: FiFileText },
          { href: "/dashboard/attendance", label: "Absensi", icon: FiClock },
        ];

      case "doctor":
        return [
          ...baseItems,
          { href: "/dashboard/queue", label: "Antrian", icon: FiList },
          { href: "/dashboard/patients", label: "Pasien", icon: FiUsers },
          {
            href: "/dashboard/pharmacy",
            label: "Resep",
            icon: MdLocalPharmacy,
          },
        ];

      case "staff":
        const department = user.staff?.department?.toLowerCase() || "";

        // Pharmacy staff (Apoteker)
        if (department.includes("farmasi") || department.includes("apotek")) {
          return [
            ...baseItems,
            {
              href: "/dashboard/pharmacy",
              label: "Farmasi",
              icon: MdLocalPharmacy,
            },
            {
              href: "/dashboard/stock",
              label: "Stock Opname",
              icon: FiPackage,
            },
          ];
        }

        // Reception staff (Petugas Loket/Pendaftaran)
        if (
          department.includes("pendaftaran") ||
          department.includes("loket") ||
          department.includes("administrasi")
        ) {
          return [
            ...baseItems,
            { href: "/dashboard/queue", label: "Antrian", icon: FiList },
            { href: "/dashboard/patients", label: "Pasien", icon: FiUsers },
          ];
        }

        // Default staff
        return [
          ...baseItems,
          { href: "/dashboard/queue", label: "Antrian", icon: FiList },
          { href: "/dashboard/patients", label: "Pasien", icon: FiUsers },
        ];

      default:
        return baseItems;
    }
  };

  const navItems = getNavItems();

  // Get role display name
  const getRoleDisplay = () => {
    switch (user.role) {
      case "admin":
        return "Admin";
      case "doctor":
        return "Dokter";
      case "staff":
        const dept = user.staff?.department || "";
        if (dept.toLowerCase().includes("farmasi")) return "Apoteker";
        if (dept.toLowerCase().includes("pendaftaran")) return "Petugas Loket";
        return dept || "Staff";
      default:
        return user.role;
    }
  };

  return (
    <div className={styles.container}>
      <nav className={styles.navbar}>
        <div className={styles.navbarContent}>
          <Link href="/dashboard" className={styles.brand}>
            <FiActivity size={24} />
            <span>Rumah Sakit</span>
          </Link>
          <div className={styles.navRight}>
            <span className={styles.userName}>
              {user.name} ({getRoleDisplay()})
            </span>
            <button onClick={logout} className={styles.logoutBtn}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className={styles.main}>
        <aside className={styles.sidebar}>
          <ul className={styles.sidebarNav}>
            {navItems.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={styles.navLink}>
                  <item.icon className={styles.navIcon} size={18} />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </aside>

        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
