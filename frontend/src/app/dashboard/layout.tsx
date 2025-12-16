"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect } from "react";
import styles from "./layout.module.css";

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

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: "" },
    { href: "/dashboard/queue", label: "Antrian", icon: "" },
    { href: "/dashboard/patients", label: "Pasien", icon: "" },
    { href: "/dashboard/stock", label: "Stock Opname", icon: "" },
    { href: "/dashboard/documents", label: "Dokumen", icon: "" },
    { href: "/dashboard/attendance", label: "Absensi", icon: "" },
  ];

  return (
    <div className={styles.container}>
      <nav className={styles.navbar}>
        <div className={styles.navbarContent}>
          <Link href="/dashboard" className={styles.brand}>
            🏥 Rumah Sakit
          </Link>
          <div className={styles.navRight}>
            <span className={styles.userName}>
              {user.name} ({user.role})
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
                  <span className={styles.navIcon}>{item.icon}</span>
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
