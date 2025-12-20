"use client";

import { useAuth } from "@/contexts/AuthContext";
import styles from "./page.module.css";
import {
  AdminDashboard,
  DoctorDashboard,
  PharmacyDashboard,
  ReceptionDashboard,
  PatientDashboard,
} from "./components";

export default function DashboardPage() {
  const { user } = useAuth();

  // Determine which dashboard to show based on role
  const renderDashboard = () => {
    if (!user) return null;

    const roleName =
      typeof user.role === "string" ? user.role : user.role?.name;

    switch (roleName) {
      case "admin":
        return <AdminDashboard />;

      case "doctor":
        return <DoctorDashboard />;

      case "pharmacist":
        return <PharmacyDashboard />;

      case "registration_staff":
        return <ReceptionDashboard />;

      case "nurse":
        // Using ReceptionDashboard as placeholder or creating new NurseDashboard?
        // Reusing ReceptionDashboard for now as it probably has queue etc.
        return <ReceptionDashboard />;

      case "inventory_staff":
        // Maybe PharmacyDashboard has stock? or we need general stock dashboard.
        // PharmacyDashboard usually has stock items.
        return <PharmacyDashboard />;

      case "patient":
        return <PatientDashboard />;

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
