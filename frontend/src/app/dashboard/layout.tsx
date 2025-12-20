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
  FiLock,
} from "react-icons/fi";
import { MdLocalPharmacy } from "react-icons/md";
import { IconType } from "react-icons";

interface SubNavItem {
  href: string;
  label: string;
}

interface NavItem {
  href?: string;
  label: string;
  icon: IconType;
  subItems?: SubNavItem[];
}

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
  const getNavItems = (): NavItem[] => {
    const baseItems: NavItem[] = [
      { href: "/dashboard", label: "Dashboard", icon: FiHome },
    ];

    // Helper to get role name
    const roleName =
      typeof user.role === "string" ? user.role : user.role?.name;

    switch (roleName) {
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
          {
            label: "Manajemen User",
            icon: FiLock,
            href: "/dashboard/roles",
          },
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
      case "pharmacist": // New specific roles
      case "registration_staff":
      case "nurse":
      case "inventory_staff":
        const department = user.staff?.department?.toLowerCase() || "";
        const rName = roleName; // alias for clarity inside switch

        // Pharmacy staff (Apoteker)
        if (
          rName === "pharmacist" ||
          department.includes("farmasi") ||
          department.includes("apotek")
        ) {
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
          rName === "registration_staff" ||
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

        // Inventory Staff
        if (rName === "inventory_staff") {
          return [
            ...baseItems,
            {
              href: "/dashboard/stock",
              label: "Stock Opname",
              icon: FiPackage,
            },
          ];
        }

        // Nurse
        if (rName === "nurse") {
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
    const roleName =
      typeof user.role === "string" ? user.role : user.role?.name;

    switch (roleName) {
      case "admin":
        return "Admin";
      case "doctor":
        return "Dokter";
      case "pharmacist":
        return "Apoteker";
      case "registration_staff":
        return "Pendaftaran";
      case "nurse":
        return "Perawat";
      case "inventory_staff":
        return "Staf Gudang";
      case "staff":
        const dept = user.staff?.department || "";
        if (dept.toLowerCase().includes("farmasi")) return "Apoteker";
        if (dept.toLowerCase().includes("pendaftaran")) return "Petugas Loket";
        return dept || "Staff";
      default:
        return roleName;
    }
  };

  return (
    <div className={styles.container}>
      <nav className={styles.navbar}>
        <div className={styles.navbarContent}>
          <Link href="/dashboard" className={styles.brand}>
            <FiActivity size={24} />
            <span>MediKu</span>
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
            <ul className={styles.sidebarNav}>
              {navItems.map((item: any) => {
                if (item.subItems) {
                  return (
                    <li key={item.label} className={styles.navGroup}>
                      <div
                        className={styles.navLink}
                        onClick={() => {
                          const el = document.getElementById(
                            `sub-${item.label}`
                          );
                          if (el)
                            el.style.display =
                              el.style.display === "none" ? "block" : "none";
                        }}
                        style={{
                          cursor: "pointer",
                          justifyContent: "space-between",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.75rem",
                          }}
                        >
                          <item.icon className={styles.navIcon} size={18} />
                          {item.label}
                        </div>
                        <span style={{ fontSize: "10px" }}>▼</span>
                      </div>
                      <ul
                        id={`sub-${item.label}`}
                        className={styles.subNav}
                        style={{
                          display: "none",
                          paddingLeft: "2rem",
                          listStyle: "none",
                        }}
                      >
                        {item.subItems.map((sub) => (
                          <li key={sub.href}>
                            <Link href={sub.href} className={styles.subNavLink}>
                              {sub.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </li>
                  );
                }

                return (
                  <li key={item.href}>
                    <Link href={item.href} className={styles.navLink}>
                      <item.icon className={styles.navIcon} size={18} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </ul>
        </aside>

        <main className={styles.content}>{children}</main>
      </div>
    </div>
  );
}
