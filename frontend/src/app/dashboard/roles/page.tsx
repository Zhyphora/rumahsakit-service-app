"use client";

import { useState, useEffect, useMemo } from "react";
import api from "@/services/api";
import toast from "react-hot-toast";
import styles from "./roles.module.css";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiUsers,
  FiUser,
  FiMoreHorizontal,
} from "react-icons/fi";

// --- Interfaces ---

interface Role {
  id: string;
  name: string;
  description: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  doctor?: {
    specialization: string;
    licenseNumber?: string;
    polyclinic?: { name: string };
    schedule?: Record<string, { start: string; end: string }>;
  };
  staff?: {
    department?: string;
    position?: string;
  };
}

interface AccessControl {
  id: string;
  role?: Role;
  roleId?: string;
  userId?: string;
  user?: User;
  feature: string;
}

interface GroupedAccess {
  key: string;
  targetName: string;
  targetRole?: string;
  type: "role" | "user";
  id: string;
  features: string[];
}

// --- Constants ---

const FEATURE_GROUPS = [
  {
    label: "Stock & Inventory",
    options: [
      { val: "stock:read", label: "Lihat Stok" },
      { val: "stock:manage", label: "Kelola Barang" },
      { val: "stock:opname", label: "Stock Opname" },
      { val: "stock:adjust", label: "Stok Adjustment" },
      { val: "stock:correction", label: "Stok Correction" },
      { val: "stock:adjust_in", label: "Stok Masuk" },
      { val: "stock:adjust_out", label: "Stok Keluar" },
    ],
  },
  {
    label: "Layanan Medis",
    options: [
      { val: "queue:manage", label: "Kelola Antrian" },
      { val: "patient:read", label: "Lihat Pasien" },
      { val: "patient:manage", label: "Kelola Pasien" },
      { val: "pharmacy:manage", label: "Kelola Farmasi" },
    ],
  },
  {
    label: "Administrasi",
    options: [
      { val: "document:verify", label: "Verifikasi Dokumen" },
      { val: "attendance:manage", label: "Kelola Absensi" },
      { val: "admin:access-control", label: "Akses Kontrol" },
      { val: "user:manage", label: "Manajemen User" },
    ],
  },
];

const ALL_FEATURE_VALUES = FEATURE_GROUPS.flatMap((g) =>
  g.options.map((o) => o.val)
);

// --- Component ---

export default function RolesPage() {
  const [activeTab, setActiveTab] = useState<"users" | "access">("users");
  const [isLoading, setIsLoading] = useState(true);

  // Data State
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [accessControls, setAccessControls] = useState<AccessControl[]>([]);

  // User Tab State
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("all");
  const [selectedPositionFilter, setSelectedPositionFilter] = useState("all"); // New Filter
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [isEditingRole, setIsEditingRole] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState("");
  const [roleName, setRoleName] = useState("");
  const [roleDesc, setRoleDesc] = useState("");

  // Create User State
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [newUserRole, setNewUserRole] = useState("");
  // Conditional
  const [doctorSpec, setDoctorSpec] = useState("");
  const [doctorLicense, setDoctorLicense] = useState("");
  const [doctorScheduleType, setDoctorScheduleType] = useState("");
  const [staffDept, setStaffDept] = useState("");
  const [staffPos, setStaffPos] = useState("");

  // Access Control Tab State
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [isEditingAccess, setIsEditingAccess] = useState(false);
  const [accessTargetType, setAccessTargetType] = useState<"role" | "user">(
    "role"
  );
  const [selectedAccessRoleId, setSelectedAccessRoleId] = useState("");
  const [selectedAccessUserId, setSelectedAccessUserId] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  const [initialFeatures, setInitialFeatures] = useState<string[]>([]);

  // Helper to get detail string
  const getUserDetailString = (user: User) => {
    if (user.role?.name === "doctor" && user.doctor) {
      return user.doctor.specialization;
    }
    if (user.staff) {
      return `${user.staff.department} - ${user.staff.position}`;
    }
    if (user.role?.name === "patient") {
      return "Pasien";
    }
    return "-";
  };

  // Get unique positions for filter
  const uniquePositions = useMemo(() => {
    const positions = new Set<string>();
    users.forEach((u) => {
      const detail = getUserDetailString(u);
      if (detail !== "-" && detail !== "Pasien") {
        positions.add(detail);
      }
    });
    return Array.from(positions).sort();
  }, [users]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    let res = users;
    // Server side already filters by role if active, but we can double check or just do position here
    if (selectedPositionFilter !== "all") {
      res = res.filter(
        (u) => getUserDetailString(u) === selectedPositionFilter
      );
    }
    return res;
  }, [users, selectedPositionFilter]);

  // --- Initial Load ---

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (activeTab === "users") {
      loadUsers();
    } else {
      loadAccessData();
    }
  }, [activeTab, page, selectedRoleFilter]);

  const loadInitialData = async () => {
    try {
      const rolesRes = await api.get("/roles");
      setRoles(rolesRes.data);
    } catch (e) {
      console.error("Failed to load roles");
    }
  };

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(
        `/users?page=${page}&limit=${limit}&role=${selectedRoleFilter}`
      );
      if (res.data.meta) {
        setUsers(res.data.data);
        setTotalPages(res.data.meta.totalPages);
      } else {
        setUsers(res.data);
      }
    } catch (e) {
      toast.error("Gagal memuat data user");
    } finally {
      setIsLoading(false);
    }
  };

  const loadAccessData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/admin/access-controls");
      setAccessControls(res.data);
      // Load all users for dropdown
      const usersRes = await api.get("/admin/users-list");
      setUsers(usersRes.data); // Note: reusing setUsers here, fine as long as structure matches
    } catch (e: any) {
      // Silent fail or toast
    } finally {
      setIsLoading(false);
    }
  };

  // --- Handlers: Roles ---

  const handleCreateRole = () => {
    setIsEditingRole(false);
    setRoleName("");
    setRoleDesc("");
    setShowRoleModal(true);
  };

  const handleEditRole = (role: Role) => {
    setIsEditingRole(true);
    setEditingRoleId(role.id);
    setRoleName(role.name);
    setRoleDesc(role.description);
    setShowRoleModal(true);
  };

  const handleDeleteRole = async (id: string) => {
    if (!confirm("Hapus role ini?")) return;
    try {
      await api.delete(`/roles/${id}`);
      toast.success("Role dihapus");
      loadInitialData(); // Reload roles
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Gagal hapus role");
    }
  };

  const handleRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isEditingRole) {
        await api.put(`/roles/${editingRoleId}`, {
          name: roleName,
          description: roleDesc,
        });
        toast.success("Role diupdate");
      } else {
        await api.post("/roles", { name: roleName, description: roleDesc });
        toast.success("Role dibuat");
      }
      setShowRoleModal(false);
      loadInitialData();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Gagal simpan role");
    }
  };

  const handleUserRoleChange = async (userId: string, newRoleName: string) => {
    try {
      await api.put(`/users/${userId}/role`, { role: newRoleName });
      toast.success("Role user diupdate");
      loadUsers();
    } catch (e) {
      toast.error("Gagal update role");
    }
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        roleName: newUserRole,
      };
      if (newUserRole === "doctor") {
        payload.doctorData = {
          specialization: doctorSpec,
          licenseNumber: doctorLicense,
          scheduleType: doctorScheduleType,
        };
      } else if (newUserRole !== "patient") {
        payload.staffData = {
          department: staffDept,
          position: staffPos,
        };
      }

      await api.post("/users", payload);
      toast.success("User berhasil dibuat");
      setShowCreateUserModal(false);
      // Reset form
      setNewUserName("");
      setNewUserEmail("");
      setNewUserPassword("");
      setNewUserRole("");
      setDoctorSpec("");
      setDoctorLicense("");
      setDoctorScheduleType("");
      setStaffDept("");
      setStaffPos("");

      loadUsers();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Gagal membuat user");
    }
  };

  // --- Handlers: Access Control ---

  const groupedAccess = useMemo(() => {
    const groups: Record<string, GroupedAccess> = {};
    accessControls.forEach((ac) => {
      const roleRef = ac.role;
      if (ac.userId && ac.user) {
        // User group
        const key = `user:${ac.userId}`;
        if (!groups[key]) {
          const userRoleName =
            typeof ac.user.role === "object"
              ? ac.user.role?.name
              : ac.user.role;
          groups[key] = {
            key,
            targetName: ac.user.name,
            targetRole: userRoleName,
            type: "user",
            id: ac.userId,
            features: [],
          };
        }
        groups[key].features.push(ac.feature);
      } else if (roleRef) {
        // Role group
        const roleId =
          typeof roleRef === "object" ? roleRef.id : ac.roleId || roleRef;
        const roleName =
          typeof roleRef === "object" ? roleRef.name : String(roleRef);
        const key = `role:${roleId}`;
        if (!groups[key]) {
          groups[key] = {
            key,
            targetName: roleName,
            type: "role",
            id: String(roleId),
            features: [],
          };
        }
        groups[key].features.push(ac.feature);
      }
    });
    return Object.values(groups);
  }, [accessControls]);

  const handleEditAccess = (group: GroupedAccess) => {
    setIsEditingAccess(true);
    setAccessTargetType(group.type);
    if (group.type === "role") setSelectedAccessRoleId(group.id);
    else setSelectedAccessUserId(group.id);
    setFeatures([...group.features]);
    setInitialFeatures([...group.features]);
    setShowAccessModal(true);
  };

  const handleAddAccess = () => {
    setIsEditingAccess(false);
    setAccessTargetType("role");
    if (roles.length > 0) setSelectedAccessRoleId(roles[0].id);
    setSelectedAccessUserId("");
    setFeatures([]);
    setInitialFeatures([]);
    setShowAccessModal(true);
  };

  const handleDeleteAccessGroup = async (group: GroupedAccess) => {
    if (!confirm(`Hapus semua akses untuk ${group.targetName}?`)) return;
    // Find IDs to delete
    const entries = accessControls.filter((ac) => {
      if (group.type === "user") return ac.userId === group.id;
      const rId =
        ac.roleId || (typeof ac.role === "object" ? ac.role.id : ac.role);
      return rId === group.id && !ac.userId;
    });

    try {
      await Promise.all(
        entries.map((ac) => api.delete(`/admin/access-controls/${ac.id}`))
      );
      toast.success("Akses dihapus");
      loadAccessData();
    } catch (e) {
      toast.error("Gagal hapus akses");
    }
  };

  const handleAccessSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (features.length === 0) return toast.error("Pilih minimal satu fitur");
    if (accessTargetType === "user" && !selectedAccessUserId)
      return toast.error("Pilih user");
    if (accessTargetType === "role" && !selectedAccessRoleId)
      return toast.error("Pilih role");

    try {
      const toAdd = features.filter((f) => !initialFeatures.includes(f));
      const toRemove = initialFeatures.filter((f) => !features.includes(f));
      const payloadBase: any = {};
      if (accessTargetType === "role")
        payloadBase.roleId = selectedAccessRoleId;
      else payloadBase.userId = selectedAccessUserId;

      if (toAdd.length > 0)
        await api.post("/admin/access-controls", {
          ...payloadBase,
          features: toAdd,
          allowed: true,
        });
      if (toRemove.length > 0)
        await api.post("/admin/access-controls", {
          ...payloadBase,
          features: toRemove,
          allowed: false,
        });

      toast.success("Akses diperbarui");
      setShowAccessModal(false);
      loadAccessData();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Gagal simpan akses");
    }
  };

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  const formatRoleName = (roleName: string) => {
    return roleName
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // --- Render ---

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Manajemen User & Akses</h1>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${
            activeTab === "users" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("users")}
        >
          Data User
        </button>
        <button
          className={`${styles.tab} ${
            activeTab === "access" ? styles.active : ""
          }`}
          onClick={() => setActiveTab("access")}
        >
          Kontrol Akses & Role
        </button>
      </div>

      {activeTab === "users" && (
        <>
          {/* Users Table Only */}
          <div className={styles.section}>
            <div className={styles.header}>
              <h2 className={styles.title} style={{ fontSize: "1.25rem" }}>
                Daftar User
              </h2>
              <button
                className={styles.addBtn}
                onClick={() => setShowCreateUserModal(true)}
                style={{ fontSize: "0.9rem", padding: "0.5rem 1rem" }}
              >
                <FiPlus /> Tambah User
              </button>
            </div>
            <div
              className={styles.targetTypeSwitcher}
              style={{
                background: "transparent",
                padding: 0,
                justifyContent: "flex-start",
                margin: "0 0 20px 0",
                gap: "1rem",
              }}
            >
              <div>
                <label
                  style={{
                    marginRight: "10px",
                    alignSelf: "center",
                    fontWeight: 500,
                  }}
                >
                  Filter Role:
                </label>
                <select
                  value={selectedRoleFilter}
                  onChange={(e) => setSelectedRoleFilter(e.target.value)}
                  style={{
                    padding: "8px",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                  }}
                >
                  <option value="all">Semua Role</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.name}>
                      {formatRoleName(r.name)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  style={{
                    marginRight: "10px",
                    alignSelf: "center",
                    fontWeight: 500,
                  }}
                >
                  Filter Posisi:
                </label>
                <select
                  value={selectedPositionFilter}
                  onChange={(e) => setSelectedPositionFilter(e.target.value)}
                  style={{
                    padding: "8px",
                    borderRadius: "6px",
                    border: "1px solid #d1d5db",
                    minWidth: "150px",
                  }}
                >
                  <option value="all">Semua Posisi</option>
                  {uniquePositions.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Detail Info</th>
                    <th>Ubah Role</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(
                    (
                      user // Use filteredUsers
                    ) => (
                      <tr key={user.id}>
                        <td>
                          <div className={styles.userInfo}>
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                background: "#e0e7ff",
                                borderRadius: "50%",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#4f46e5",
                              }}
                            >
                              <FiUser />
                            </div>
                            {user.name}
                          </div>
                        </td>
                        <td>{user.email}</td>
                        <td>
                          <span
                            className={styles.roleBadge}
                            style={{ background: "#ecfdf5", color: "#059669" }}
                          >
                            {user.role?.name
                              ? formatRoleName(user.role.name)
                              : "-"}
                          </span>
                        </td>
                        <td>
                          <span
                            style={{ fontSize: "0.9rem", color: "#374151" }}
                          >
                            {getUserDetailString(user)}
                          </span>
                        </td>
                        <td>
                          <select
                            value={user.role?.name || ""}
                            onChange={(e) =>
                              handleUserRoleChange(user.id, e.target.value)
                            }
                            style={{
                              padding: "6px",
                              borderRadius: "4px",
                              border: "1px solid #d1d5db",
                              fontSize: "0.875rem",
                            }}
                          >
                            {roles.map((r) => (
                              <option key={r.id} value={r.name}>
                                {formatRoleName(r.name)}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setShowDetailModal(true);
                            }}
                            className={styles.addBtn}
                            style={{
                              padding: "0.25rem 0.75rem",
                              fontSize: "0.875rem",
                            }}
                          >
                            Detail
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
              {/* Pagination */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "1rem",
                }}
              >
                <span style={{ color: "#6b7280", fontSize: "0.9rem" }}>
                  Halaman {page} dari {totalPages}
                </span>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className={styles.switchBtn}
                    style={{ border: "1px solid #d1d5db" }}
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className={styles.switchBtn}
                    style={{ border: "1px solid #d1d5db" }}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === "access" && (
        <>
          {/* ROLES MANAGEMENT SECTION (Moved here) */}
          <div className={styles.section} style={{ marginBottom: "40px" }}>
            <h2
              className={styles.title}
              style={{ fontSize: "1.25rem", marginBottom: "1rem" }}
            >
              Manajemen Role
            </h2>
            <div className={styles.grid}>
              <div
                style={{
                  gridColumn: "1 / -1",
                  display: "flex",
                  justifyContent: "flex-start",
                  marginBottom: "10px",
                }}
              >
                <button className={styles.addBtn} onClick={handleCreateRole}>
                  <FiPlus /> Tambah Role Baru
                </button>
              </div>
              {roles.map((role) => (
                <div key={role.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div className={styles.iconWrapper}>
                      <FiUsers />
                    </div>
                    <div className={styles.cardActions}>
                      <button
                        onClick={() => handleEditRole(role)}
                        className={styles.actionBtn}
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        onClick={() => handleDeleteRole(role.id)}
                        className={`${styles.actionBtn} ${styles.delete}`}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                  <h3 className={styles.roleName}>
                    {formatRoleName(role.name)}
                  </h3>
                  <p className={styles.roleDesc}>{role.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ACCESS CONTROL SECTION */}
          <div className={styles.section}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "1rem",
                alignItems: "center",
              }}
            >
              <h2 className={styles.title} style={{ fontSize: "1.25rem" }}>
                Matriks Kontrol Akses
              </h2>
              <button className={styles.addBtn} onClick={handleAddAccess}>
                <FiPlus /> Tambah Akses
              </button>
            </div>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Target</th>
                    <th>Type</th>
                    <th>Permissions</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedAccess.map((group) => (
                    <tr key={group.key}>
                      <td>
                        {group.type === "user" ? (
                          <div className={styles.userInfo}>
                            <FiUser className={styles.iconSmall} />
                            <span>{group.targetName}</span>
                            <small className={styles.userRole}>
                              (
                              {typeof group.targetRole === "string"
                                ? formatRoleName(group.targetRole)
                                : "Unknown Roles"}
                              )
                            </small>
                          </div>
                        ) : (
                          <span className={styles.roleBadge}>
                            {formatRoleName(group.targetName)}
                          </span>
                        )}
                      </td>
                      <td>
                        {group.type === "user" ? (
                          <span className={styles.typeBadgeUser}>
                            User Specific
                          </span>
                        ) : (
                          <span className={styles.typeBadgeRole}>
                            Role Based
                          </span>
                        )}
                      </td>
                      <td>
                        <div className={styles.featureTagsList}>
                          {group.features.slice(0, 3).map((f) => (
                            <span key={f} className={styles.featureTag}>
                              {f}
                            </span>
                          ))}
                          {group.features.length > 3 && (
                            <span className={styles.moreTag}>
                              +{group.features.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button
                            className={styles.actionBtn}
                            onClick={() => handleEditAccess(group)}
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            className={`${styles.actionBtn} ${styles.delete}`}
                            onClick={() => handleDeleteAccessGroup(group)}
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {groupedAccess.length === 0 && (
                <div
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                    color: "#6b7280",
                  }}
                >
                  Belum ada data akses
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* --- MODALS --- */}

      {/* Role Modal */}
      {showRoleModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>
              {isEditingRole ? "Edit Role" : "Tambah Role"}
            </h2>
            <form onSubmit={handleRoleSubmit}>
              <div className={styles.formGroup}>
                <label>Nama Role</label>
                <input
                  type="text"
                  value={roleName}
                  onChange={(e) => setRoleName(e.target.value)}
                  required
                  placeholder="nurse, admin_stock"
                />
              </div>
              <div className={styles.formGroup}>
                <label>Deskripsi</label>
                <textarea
                  value={roleDesc}
                  onChange={(e) => setRoleDesc(e.target.value)}
                  rows={3}
                />
              </div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setShowRoleModal(false)}
                  className={styles.cancelBtn}
                >
                  Batal
                </button>
                <button type="submit" className={styles.submitBtn}>
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE USER MODAL */}
      {showCreateUserModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal} style={{ maxWidth: "550px" }}>
            <h2 className={styles.modalTitle}>Tambah User Baru</h2>
            <form onSubmit={handleCreateUserSubmit}>
              <div className={styles.formGroup}>
                <label>Nama Lengkap</label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  required
                  placeholder="Nama Lengkap"
                />
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "15px",
                }}
              >
                <div className={styles.formGroup}>
                  <label>Email</label>
                  <input
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    required
                    placeholder="email@rumahsakit.com"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Password</label>
                  <input
                    type="password"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    required
                    placeholder="******"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Role</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  required
                  className={styles.input}
                >
                  <option value="">-- Pilih Role --</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.name}>
                      {formatRoleName(r.name)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Conditional Fields */}
              {newUserRole === "doctor" && (
                <div
                  style={{
                    background: "#f9fafb",
                    padding: "15px",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                    marginBottom: "15px",
                  }}
                >
                  <h4 style={{ margin: "0 0 10px 0", fontSize: "0.9rem" }}>
                    Informasi Dokter
                  </h4>
                  <div className={styles.formGroup}>
                    <label>Spesialisasi</label>
                    <input
                      type="text"
                      value={doctorSpec}
                      onChange={(e) => setDoctorSpec(e.target.value)}
                      required
                      placeholder="Bedah, Mata, Anak..."
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Jadwal Praktik</label>
                    <select
                      value={doctorScheduleType}
                      onChange={(e) => setDoctorScheduleType(e.target.value)}
                      required
                      className={styles.input}
                      style={{
                        padding: "8px",
                        border: "1px solid #d1d5db",
                        borderRadius: "4px",
                        width: "100%",
                      }}
                    >
                      <option value="">-- Pilih Jadwal --</option>
                      <option value="pagi">Pagi (08:00 - 14:00)</option>
                      <option value="siang">Siang (13:00 - 20:00)</option>
                      <option value="weekend">Weekend (Sabtu & Minggu)</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label>No. SIP (Opsional)</label>
                    <input
                      type="text"
                      value={doctorLicense}
                      onChange={(e) => setDoctorLicense(e.target.value)}
                      placeholder="SIP-XXXXXX"
                    />
                  </div>
                </div>
              )}

              {newUserRole &&
                newUserRole !== "doctor" &&
                newUserRole !== "patient" && (
                  <div
                    style={{
                      background: "#f9fafb",
                      padding: "15px",
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      marginBottom: "15px",
                    }}
                  >
                    <h4 style={{ margin: "0 0 10px 0", fontSize: "0.9rem" }}>
                      Informasi Pegawai (Staff)
                    </h4>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "10px",
                      }}
                    >
                      <div className={styles.formGroup}>
                        <label>Departemen</label>
                        <input
                          type="text"
                          value={staffDept}
                          onChange={(e) => setStaffDept(e.target.value)}
                          required
                          placeholder="IT, HRD, Farmasi..."
                        />
                      </div>
                      <div className={styles.formGroup}>
                        <label>Jabatan (Posisi)</label>
                        <input
                          type="text"
                          value={staffPos}
                          onChange={(e) => setStaffPos(e.target.value)}
                          required
                          placeholder="Manager, Staff, Kepala Bagian..."
                        />
                      </div>
                    </div>
                  </div>
                )}

              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setShowCreateUserModal(false)}
                  className={styles.cancelBtn}
                >
                  Batal
                </button>
                <button type="submit" className={styles.submitBtn}>
                  Simpan User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {showDetailModal && selectedUser && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal} style={{ maxWidth: "500px" }}>
            <h2
              className={styles.modalTitle}
              style={{
                borderBottom: "1px solid #e5e7eb",
                paddingBottom: "10px",
                marginBottom: "20px",
              }}
            >
              Detail User
            </h2>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "15px" }}
            >
              <div>
                <label
                  style={{
                    fontWeight: 600,
                    color: "#374151",
                    fontSize: "0.9rem",
                  }}
                >
                  Nama Lengkap
                </label>
                <p style={{ margin: "4px 0", fontSize: "1rem" }}>
                  {selectedUser.name}
                </p>
              </div>
              <div>
                <label
                  style={{
                    fontWeight: 600,
                    color: "#374151",
                    fontSize: "0.9rem",
                  }}
                >
                  Email
                </label>
                <p style={{ margin: "4px 0", fontSize: "1rem" }}>
                  {selectedUser.email}
                </p>
              </div>
              <div>
                <label
                  style={{
                    fontWeight: 600,
                    color: "#374151",
                    fontSize: "0.9rem",
                  }}
                >
                  Role
                </label>
                <div>
                  <span
                    className={styles.roleBadge}
                    style={{ background: "#ecfdf5", color: "#059669" }}
                  >
                    {selectedUser.role?.name
                      ? formatRoleName(selectedUser.role.name)
                      : "-"}
                  </span>
                </div>
              </div>
              <div>
                <label
                  style={{
                    fontWeight: 600,
                    color: "#374151",
                    fontSize: "0.9rem",
                  }}
                >
                  User ID
                </label>
                <p
                  style={{
                    margin: "4px 0",
                    fontSize: "0.875rem",
                    color: "#6b7280",
                    fontFamily: "monospace",
                  }}
                >
                  {selectedUser.id}
                </p>
              </div>

              {/* Doctor Specific Details */}
              {selectedUser.doctor && (
                <div
                  style={{
                    marginTop: "10px",
                    padding: "15px",
                    background: "#f9fafb",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "1rem",
                      fontWeight: 600,
                      marginBottom: "10px",
                      color: "#1f2937",
                    }}
                  >
                    Informasi Dokter
                  </h3>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "10px",
                    }}
                  >
                    <div>
                      <label style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                        Spesialisasi
                      </label>
                      <p style={{ fontWeight: 500 }}>
                        {selectedUser.doctor.specialization}
                      </p>
                    </div>
                    <div>
                      <label style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                        Poli
                      </label>
                      <p style={{ fontWeight: 500 }}>
                        {selectedUser.doctor.polyclinic?.name || "-"}
                      </p>
                    </div>
                    <div>
                      <label style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                        No. SIP
                      </label>
                      <p style={{ fontWeight: 500 }}>
                        {selectedUser.doctor.licenseNumber || "-"}
                      </p>
                    </div>
                  </div>

                  {selectedUser.doctor.schedule && (
                    <div style={{ marginTop: "12px" }}>
                      <label
                        style={{
                          fontSize: "0.85rem",
                          color: "#6b7280",
                          display: "block",
                          marginBottom: "4px",
                        }}
                      >
                        Jadwal Praktik
                      </label>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: "8px",
                        }}
                      >
                        {Object.entries(selectedUser.doctor.schedule).map(
                          ([day, time]: [string, any]) => (
                            <div
                              key={day}
                              style={{
                                background: "white",
                                padding: "4px 8px",
                                borderRadius: "4px",
                                border: "1px solid #d1d5db",
                                fontSize: "0.85rem",
                              }}
                            >
                              <span style={{ fontWeight: 600 }}>
                                {capitalize(day)}:
                              </span>{" "}
                              {time.start} - {time.end}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Staff Specific Details */}
              {selectedUser.staff && (
                <div
                  style={{
                    marginTop: "10px",
                    padding: "15px",
                    background: "#f9fafb",
                    borderRadius: "8px",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "1rem",
                      fontWeight: 600,
                      marginBottom: "10px",
                      color: "#1f2937",
                    }}
                  >
                    Informasi Staff
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "10px",
                    }}
                  >
                    <div>
                      <label style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                        Departemen
                      </label>
                      <p style={{ fontWeight: 500 }}>
                        {selectedUser.staff.department || "-"}
                      </p>
                    </div>
                    <div>
                      <label style={{ fontSize: "0.85rem", color: "#6b7280" }}>
                        Posisi
                      </label>
                      <p style={{ fontWeight: 500 }}>
                        {selectedUser.staff.position || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className={styles.modalActions} style={{ marginTop: "24px" }}>
              <button
                onClick={() => setShowDetailModal(false)}
                className={styles.submitBtn}
                style={{ width: "100%" }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Access Control Modal */}
      {showAccessModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>{isEditingAccess ? "Edit Akses" : "Tambah Akses Baru"}</h2>
            <form onSubmit={handleAccessSubmit}>
              <div className={styles.targetTypeSwitcher}>
                <button
                  type="button"
                  disabled={isEditingAccess}
                  className={`${styles.switchBtn} ${
                    accessTargetType === "role" ? styles.active : ""
                  }`}
                  onClick={() => setAccessTargetType("role")}
                >
                  Role Group
                </button>
                <button
                  type="button"
                  disabled={isEditingAccess}
                  className={`${styles.switchBtn} ${
                    accessTargetType === "user" ? styles.active : ""
                  }`}
                  onClick={() => setAccessTargetType("user")}
                >
                  Specific User
                </button>
              </div>

              {accessTargetType === "role" ? (
                <div className={styles.formGroup}>
                  <label>Pilih Role</label>
                  <select
                    value={selectedAccessRoleId}
                    disabled={isEditingAccess}
                    onChange={(e) => setSelectedAccessRoleId(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #d1d5db",
                    }}
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {formatRoleName(r.name)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className={styles.formGroup}>
                  <label>Pilih User</label>
                  <select
                    value={selectedAccessUserId}
                    disabled={isEditingAccess}
                    onChange={(e) => setSelectedAccessUserId(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: "4px",
                      border: "1px solid #d1d5db",
                    }}
                  >
                    <option value="">-- Pilih User --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} (
                        {typeof u.role === "object"
                          ? formatRoleName(u.role?.name)
                          : u.role}
                        )
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className={styles.formGroup}>
                <label>Pilih Fitur</label>
                <div className={styles.featureList}>
                  {FEATURE_GROUPS.map((g) => (
                    <div key={g.label}>
                      <strong
                        style={{
                          display: "block",
                          margin: "10px 0 5px",
                          fontSize: "0.85rem",
                          color: "#6b7280",
                        }}
                      >
                        {g.label}
                      </strong>
                      <div className={styles.checkboxGrid}>
                        {g.options.map((opt) => (
                          <label key={opt.val} className={styles.checkboxLabel}>
                            <input
                              type="checkbox"
                              checked={features.includes(opt.val)}
                              onChange={(e) => {
                                if (e.target.checked)
                                  setFeatures([...features, opt.val]);
                                else
                                  setFeatures(
                                    features.filter((f) => f !== opt.val)
                                  );
                              }}
                            />
                            {opt.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setShowAccessModal(false)}
                  className={styles.cancelBtn}
                >
                  Batal
                </button>
                <button type="submit" className={styles.submitBtn}>
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
