"use client";

import { useState, useEffect, useMemo } from "react";
import api from "@/services/api";
import toast from "react-hot-toast";
import styles from "./access.module.css";
import { FiTrash2, FiPlus, FiUser, FiUsers, FiEdit2 } from "react-icons/fi";

interface User {
  id: string;
  name: string;
  role: any; // Role object or string depending on backend response, assumed object now
  email: string;
}

interface Role {
  id: string;
  name: string;
  description: string;
}

interface AccessControl {
  id: string;
  role?: Role; // Updated to be object if possible, or handle string
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
  id: string; // roleId or userId
  features: string[];
}

export default function AccessControlPage() {
  const [accessControls, setAccessControls] = useState<AccessControl[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [targetType, setTargetType] = useState<"role" | "user">("role");
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  const [initialFeatures, setInitialFeatures] = useState<string[]>([]);

  useEffect(() => {
    loadData();
    loadUsers();
    loadRoles();
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

  const loadRoles = async () => {
    try {
      const res = await api.get("/roles");
      setRoles(res.data);
      if (res.data.length > 0) {
        setSelectedRoleId(res.data[0].id);
      }
    } catch (error) {
      console.error("Failed to load roles");
    }
  };

  // Group the flat access list
  const groupedAccess = useMemo(() => {
    const groups: Record<string, GroupedAccess> = {};

    accessControls.forEach((ac) => {
      // Prioritize roleId check, fallback to legacy role string if any
      const roleRef = ac.role;

      if (ac.userId && ac.user) {
        // User Specific Group
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
        // Role Group
        // Handle if roleRef is object or string (it should be object now)
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

  const handleEdit = (group: GroupedAccess) => {
    setIsEditing(true);
    setTargetType(group.type);
    if (group.type === "role") {
      setSelectedRoleId(group.id);
    } else {
      setSelectedUserId(group.id);
    }
    setFeatures([...group.features]);
    setInitialFeatures([...group.features]);
    setShowModal(true);
  };

  const handleAddStart = () => {
    setIsEditing(false);
    setTargetType("role");
    // select first role by default
    if (roles.length > 0) setSelectedRoleId(roles[0].id);
    setSelectedUserId("");
    setFeatures([]);
    setInitialFeatures([]);
    setShowModal(true);
  };

  const handleDeleteGroup = async (group: GroupedAccess) => {
    if (!confirm(`Hapus semua akses untuk ${group.targetName}?`)) return;

    const entriesToDelete = accessControls.filter((ac) => {
      if (group.type === "user") return ac.userId === group.id;
      // check roleId equality
      const rId =
        ac.roleId || (typeof ac.role === "object" ? ac.role.id : ac.role);
      return rId === group.id && !ac.userId;
    });

    try {
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
      return;
    }
    if (targetType === "user" && !selectedUserId) {
      toast.error("Pilih user terlebih dahulu");
      return;
    }
    if (targetType === "role" && !selectedRoleId) {
      toast.error("Pilih role terlebih dahulu");
      return;
    }

    try {
      const toAdd = features.filter((f) => !initialFeatures.includes(f));
      const toRemove = initialFeatures.filter((f) => !features.includes(f));

      const payloadBase: any = {};
      if (targetType === "role") payloadBase.roleId = selectedRoleId;
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
                        ({group.targetRole || "Unknown"})
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
                      ? roles.find((r) => r.id === selectedRoleId)?.name ||
                        "Role"
                      : users.find((u) => u.id === selectedUserId)?.name ||
                        "User"
                  }`
                : "Tambah Akses Baru"}
            </h2>
            <form onSubmit={handleSubmit}>
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
                    value={selectedRoleId}
                    disabled={isEditing}
                    onChange={(e) => setSelectedRoleId(e.target.value)}
                    className={styles.input}
                  >
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
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
                        {u.name} (
                        {typeof u.role === "object" ? u.role.name : u.role})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className={styles.formGroup}>
                <div className={styles.flexBetween}>
                  <label style={{ marginBottom: 0 }}>Pilih Feature</label>
                  <label className={styles.itemCenter}>
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(input) => {
                        if (input) input.indeterminate = isIndeterminate;
                      }}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      style={{ marginRight: "0.5rem" }}
                    />
                    <span style={{ fontSize: "0.875rem" }}>Pilih Semua</span>
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
              </div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setIsEditing(false);
                  }}
                  className={styles.cancelBtn}
                >
                  Batal
                </button>
                <button type="submit" className={styles.submitBtn}>
                  {isEditing ? "Simpan Perubahan" : "Simpan Akses"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
