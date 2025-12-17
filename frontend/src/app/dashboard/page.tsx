"use client";

import { useAuth } from "@/contexts/AuthContext";
import styles from "./page.module.css";
import {
  AdminDashboard,
  DoctorDashboard,
  PharmacyDashboard,
  ReceptionDashboard,
} from "./components";

export default function DashboardPage() {
  const { user } = useAuth();

  // Determine which dashboard to show based on role
  const renderDashboard = () => {
    if (!user) return null;

    switch (user.role) {
      case "admin":
        return <AdminDashboard />;

      case "doctor":
        return <DoctorDashboard />;

      case "staff":
        // Differentiate based on department stored in staff relation
        // Check if user has staff info with department
        const department = user.staff?.department?.toLowerCase() || "";

        if (department.includes("farmasi") || department.includes("apotek")) {
          return <PharmacyDashboard />;
        } else if (
          department.includes("pendaftaran") ||
          department.includes("loket") ||
          department.includes("administrasi")
        ) {
          return <ReceptionDashboard />;
        } else {
          // Default staff view - show reception dashboard
          return <ReceptionDashboard />;
        }

      default:
        return <ReceptionDashboard />;
    }
  };

  return <div className={styles.container}>{renderDashboard()}</div>;
}
