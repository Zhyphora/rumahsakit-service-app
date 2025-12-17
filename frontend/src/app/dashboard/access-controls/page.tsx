"use client";

import { useState, useEffect, useMemo } from "react";
import api from "@/services/api";
import toast from "react-hot-toast";
import styles from "./access.module.css";
import {
  FiLock,
  FiTrash2,
  FiPlus,
  FiUser,
  FiUsers,
  FiEdit2,
} from "react-icons/fi";

interface User {
  id: string;
  name: string;
  role: string;
  email: string;
}

interface AccessControl {
  id: string;
  role?: string;
  userId?: string;
  user?: User;
  feature: string;
}

interface GroupedAccess {
  key: string; // unique key for the group (e.g. "role:admin" or "user:uuid")
  targetName: string;
  targetRole?: string; // for user specific display
  type: "role" | "user";
  id: string; // role name or user id
  features: string[];
}

export default function AccessControlPage() {
  const [accessControls, setAccessControls] = useState<AccessControl[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [targetType, setTargetType] = useState<"role" | "user">("role");
  const [role, setRole] = useState("staff");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  const [initialFeatures, setInitialFeatures] = useState<string[]>([]); // To track removed features

  useEffect(() => {
    loadData();
    loadUsers();
  }, []);

  const loadData = async () => {
    try {
      const res = await api.get("/admin/access-controls");
      setAccessControls(res.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal memuat data akses");
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await api.get("/admin/users-list");
      setUsers(res.data);
    } catch (error) {
      console.error("Failed to load users");
    }
  };

  // Group the flat access list into User/Role buckets
  const groupedAccess = useMemo(() => {
    const groups: Record<string, GroupedAccess> = {};

    accessControls.forEach((ac) => {
      if (ac.userId && ac.user) {
        // User Specific Group
        const key = `user:${ac.userId}`;
        if (!groups[key]) {
          groups[key] = {
            key,
            targetName: ac.user.name,
            targetRole: ac.user.role,
            type: "user",
            id: ac.userId,
            features: [],
          };
        }
        groups[key].features.push(ac.feature);
      } else if (ac.role) {
        // Role Group
        const key = `role:${ac.role}`;
        if (!groups[key]) {
          groups[key] = {
            key,
            targetName: ac.role, // role name itself
            type: "role",
            id: ac.role,
            features: [],
          };
        }
        groups[key].features.push(ac.feature);
      }
    });

    return Object.values(groups);
  }, [accessControls]);

  const handleEdit = (group: GroupedAccess) => {
    setIsEditing(true);
    setTargetType(group.type);
    if (group.type === "role") {
      setRole(group.id);
    } else {
      setSelectedUserId(group.id);
    }
    setFeatures([...group.features]);
    setInitialFeatures([...group.features]); // Snapshot for diffing
    setShowModal(true);
  };

  const handleAddStart = () => {
    setIsEditing(false);
    setTargetType("role");
    setRole("staff");
    setSelectedUserId("");
    setFeatures([]);
    setInitialFeatures([]);
    setShowModal(true);
  };

  const handleDeleteGroup = async (group: GroupedAccess) => {
    if (!confirm(`Hapus semua akses untuk ${group.targetName}?`)) return;

    // We need to delete permission one by one or create a bulk delete endpoint (not checking).
    // We'll iterate delete for now as existing DELETE endpoint is by ID, but we only have grouped data here.
    // Wait, we need the IDs of the AccessControl entries to delete them.
    // Efficiency check: filtering accessControls to find IDs.

    const entriesToDelete = accessControls.filter((ac) => {
      if (group.type === "user") return ac.userId === group.id;
      return ac.role === group.id && !ac.userId;
    });

    try {
      // Parallel delete
      await Promise.all(
        entriesToDelete.map((ac) =>
          api.delete(`/admin/access-controls/${ac.id}`)
        )
      );
      toast.success("Akses berhasil dihapus");
      loadData();
    } catch (e) {
      toast.error("Gagal menghapus beberapa akses");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (features.length === 0) {
      toast.error("Pilih minimal satu fitur access");
      // Actually, if editing, 0 features might mean "remove all". But let's keep it safe.
      // If user unchecks all, maybe they should use delete.
      return;
    }
    if (targetType === "user" && !selectedUserId) {
      toast.error("Pilih user terlebih dahulu");
      return;
    }

    try {
      // 1. Handle Additions (Features present in 'features' but not in 'initialFeatures')
      // Note: If NOT editing (New), initialFeatures is empty, so all are additions.
      const toAdd = features.filter((f) => !initialFeatures.includes(f));

      // 2. Handle Removals (Features present in 'initialFeatures' but not in 'features')
      const toRemove = initialFeatures.filter((f) => !features.includes(f));

      const payloadBase: any = {};
      if (targetType === "role") payloadBase.role = role;
      else payloadBase.userId = selectedUserId;

      // Execute Additions
      if (toAdd.length > 0) {
        await api.post("/admin/access-controls", {
          ...payloadBase,
          features: toAdd,
          allowed: true,
        });
      }

      // Execute Removals
      if (toRemove.length > 0) {
        await api.post("/admin/access-controls", {
          ...payloadBase,
          features: toRemove,
          allowed: false,
        });
      }

      toast.success(
        isEditing ? "Akses berhasil diperbarui" : "Akses berhasil ditambahkan"
      );
      setShowModal(false);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal menyimpan akses");
    }
  };

  if (isLoading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  // Define feature groups outside functionality constant
  const FEATURE_GROUPS = [
    {
      label: "Stock & Inventory",
      options: [
        { val: "stock:read", label: "Lihat Stok" },
        { val: "stock:manage", label: "Kelola Barang" },
        { val: "stock:opname", label: "Stock Opname" },
        { val: "stock:adjust", label: "Stok Adjustment" },
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
      ],
    },
  ];

  const ALL_FEATURE_VALUES = FEATURE_GROUPS.flatMap((g) =>
    g.options.map((o) => o.val)
  );

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setFeatures(ALL_FEATURE_VALUES);
    } else {
      setFeatures([]);
    }
  };

  const isAllSelected = ALL_FEATURE_VALUES.every((f) => features.includes(f));
  const isIndeterminate =
    features.length > 0 && features.length < ALL_FEATURE_VALUES.length;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Access Control</h1>
        <button className={styles.addBtn} onClick={handleAddStart}>
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
                        ({group.targetRole})
                      </small>
                    </div>
                  ) : (
                    <span className={styles.roleBadge}>{group.targetName}</span>
                  )}
                </td>
                <td>
                  {group.type === "user" ? (
                    <span className={styles.typeBadgeUser}>User Specific</span>
                  ) : (
                    <span className={styles.typeBadgeRole}>Role Based</span>
                  )}
                </td>
                <td>
                  <span style={{ fontWeight: 500, color: "#4b5563" }}>
                    {group.features.length} Features
                  </span>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "#9ca3af",
                      maxWidth: "300px",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {group.features.join(", ")}
                  </div>
                </td>
                <td>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      className={styles.editBtn}
                      onClick={() => handleEdit(group)}
                      title="Edit Permissions"
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDeleteGroup(group)}
                      title="Delete All Access"
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
          <div className={styles.emptyState}>Belum ada data akses</div>
        )}
      </div>

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2>
              {isEditing
                ? `Edit Akses: ${
                    targetType === "role"
                      ? role
                      : users.find((u) => u.id === selectedUserId)?.name
                  }`
                : "Tambah Akses Baru"}
            </h2>
            <form onSubmit={handleSubmit}>
              {/* Target Type Switcher - Disable if editing */}
              <div className={styles.targetTypeSwitcher}>
                <button
                  type="button"
                  disabled={isEditing}
                  className={`${styles.switchBtn} ${
                    targetType === "role" ? styles.active : ""
                  }`}
                  onClick={() => setTargetType("role")}
                >
                  <FiUsers /> Role Group
                </button>
                <button
                  type="button"
                  disabled={isEditing}
                  className={`${styles.switchBtn} ${
                    targetType === "user" ? styles.active : ""
                  }`}
                  onClick={() => setTargetType("user")}
                >
                  <FiUser /> Specific User
                </button>
              </div>

              {targetType === "role" ? (
                <div className={styles.formGroup}>
                  <label>Pilih Role</label>
                  <select
                    value={role}
                    disabled={isEditing} // Cannot change target while editing permissions
                    onChange={(e) => setRole(e.target.value)}
                    className={styles.input}
                  >
                    <option value="admin">Admin</option>
                    <option value="doctor">Doctor</option>
                    <option value="staff">Staff</option>
                    <option value="patient">Patient</option>
                  </select>
                </div>
              ) : (
                <div className={styles.formGroup}>
                  <label>Pilih User</label>
                  <select
                    value={selectedUserId}
                    disabled={isEditing}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className={styles.input}
                    required
                  >
                    <option value="">-- Pilih User --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className={styles.formGroup}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "0.5rem",
                  }}
                >
                  <label style={{ marginBottom: 0 }}>Pilih Feature</label>
                  <label
                    className={styles.checkboxLabel}
                    style={{
                      padding: "0.25rem 0.5rem",
                      fontSize: "0.875rem",
                      border: "none",
                      background: "transparent",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(input) => {
                        if (input) input.indeterminate = isIndeterminate;
                      }}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                    Pilih Semua
                  </label>
                </div>

                <div className={styles.featureList}>
                  {FEATURE_GROUPS.map((group) => (
                    <div key={group.label} className={styles.featureGroup}>
                      <strong>{group.label}</strong>
                      <div className={styles.checkboxGrid}>
                        {group.options.map((opt) => (
                          <label key={opt.val} className={styles.checkboxLabel}>
                            <input
                              type="checkbox"
                              value={opt.val}
                              checked={features.includes(opt.val)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFeatures([...features, opt.val]);
                                } else {
                                  setFeatures(
                                    features.filter((f) => f !== opt.val)
                                  );
                                }
                              }}
                            />
                            {opt.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <small className={styles.hint}>
                  Centang fitur yang ingin diberikan aksesnya
                </small>
              </div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setFeatures([]);
                    setSelectedUserId("");
                    setIsEditing(false); // Reset edit mode
                  }}
                  className={styles.cancelBtn}
                >
                  Batal
                </button>
                <button type="submit" className={styles.submitBtn}>
                  {isEditing
                    ? "Simpan Perubahan"
                    : `Simpan Akses (${features.length})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
