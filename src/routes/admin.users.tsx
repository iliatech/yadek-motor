import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Crown,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  User,
  UserCog,
  Users,
  X,
} from "lucide-react";

export const Route = createFileRoute("/admin/users")({
  component: AdminUsersPage,
});

/* =========================================================
 * Types
 * ========================================================= */

type UserRole = "user" | "admin";

type AdminUser = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
  orderCount: number;
};

type UsersResponse = {
  success: boolean;
  users: AdminUser[];
  count: number;
  message?: string;
};

type ApiResponse = {
  success: boolean;
  message?: string;
  user?: AdminUser;
  deletedUser?: {
    id: string;
    firstName: string;
    lastName: string;
    orderCount: number;
  };
};

/* =========================================================
 * Helpers
 * ========================================================= */

function toPersianDigits(value: string | number): string {
  const digits = "۰۱۲۳۴۵۶۷۸۹";

  return String(value).replace(/\d/g, (digit) => {
    return digits.charAt(Number(digit));
  });
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("fa-IR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function getInitials(user: AdminUser): string {
  const first = user.firstName?.charAt(0) ?? "";
  const last = user.lastName?.charAt(0) ?? "";

  return `${first}${last}` || "؟";
}

function getRoleLabel(role: UserRole): string {
  return role === "admin" ? "مدیر" : "کاربر";
}

/* =========================================================
 * Main Page
 * ========================================================= */

function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [changingRoleId, setChangingRoleId] = useState<string | null>(
    null,
  );

  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  const [passwordTarget, setPasswordTarget] =
    useState<AdminUser | null>(null);

  const [changingPasswordId, setChangingPasswordId] =
    useState<string | null>(null);

  /* =======================================================
   * Fetch Users
   * ======================================================= */

  async function loadUsers(showRefreshLoader = false) {
    try {
      if (showRefreshLoader) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const params = new URLSearchParams();

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (roleFilter !== "all") {
        params.set("role", roleFilter);
      }

      const queryString = params.toString();

      const response = await fetch(
        `/api/admin/users${queryString ? `?${queryString}` : ""}`,
        {
          method: "GET",
          credentials: "include",
          headers: {
            Accept: "application/json",
          },
        },
      );

      const data = (await response.json()) as UsersResponse;

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "دریافت کاربران با خطا مواجه شد.",
        );
      }

      setUsers(data.users ?? []);
    } catch (err) {
      console.error("Admin users load error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "خطا در دریافت کاربران.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  /* =======================================================
   * Initial Load
   * ======================================================= */

  useEffect(() => {
    void loadUsers();
  }, [search, roleFilter]);

  /* =======================================================
   * Change Role
   * ======================================================= */

  async function handleRoleChange(
    user: AdminUser,
    newRole: UserRole,
  ) {
    if (user.role === newRole) {
      return;
    }

    const confirmed = window.confirm(
      `آیا مطمئن هستید که نقش «${user.firstName} ${user.lastName}» به «${getRoleLabel(
        newRole,
      )}» تغییر کند؟`,
    );

    if (!confirmed) {
      return;
    }

    try {
      setChangingRoleId(user.id);
      setError("");
      setSuccess("");

      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          role: newRole,
        }),
      });

      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "تغییر نقش کاربر انجام نشد.",
        );
      }

      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.id === user.id
            ? {
                ...currentUser,
                role: newRole,
                updatedAt: new Date().toISOString(),
              }
            : currentUser,
        ),
      );

      setSuccess(
        `نقش ${user.firstName} ${user.lastName} با موفقیت تغییر کرد.`,
      );
    } catch (err) {
      console.error("Change user role error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "خطا در تغییر نقش کاربر.",
      );
    } finally {
      setChangingRoleId(null);
    }
  }

  /* =======================================================
   * Change Password
   * ======================================================= */

  async function handleChangePassword(
    user: AdminUser,
    newPassword: string,
  ) {
    try {
      setChangingPasswordId(user.id);
      setError("");
      setSuccess("");

      const response = await fetch(
        "/api/admin/users/password",
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            userId: user.id,
            newPassword,
          }),
        },
      );

      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "تغییر رمز عبور انجام نشد.",
        );
      }

      setPasswordTarget(null);

      setSuccess(
        `رمز عبور ${user.firstName} ${user.lastName} با موفقیت تغییر کرد.`,
      );
    } catch (err) {
      console.error("Change user password error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "خطا در تغییر رمز عبور.",
      );
    } finally {
      setChangingPasswordId(null);
    }
  }

  /* =======================================================
   * Delete User
   * ======================================================= */

  async function handleDeleteUser() {
    if (!deleteTarget) {
      return;
    }

    const user = deleteTarget;

    try {
      setDeletingUserId(user.id);
      setError("");
      setSuccess("");

      const response = await fetch("/api/admin/users", {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
        }),
      });

      const data = (await response.json()) as ApiResponse;

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "حذف کاربر انجام نشد.",
        );
      }

      setUsers((currentUsers) =>
        currentUsers.filter(
          (currentUser) => currentUser.id !== user.id,
        ),
      );

      setDeleteTarget(null);

      setSuccess(
        `کاربر ${user.firstName} ${user.lastName} با موفقیت حذف شد.`,
      );
    } catch (err) {
      console.error("Delete user error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "خطا در حذف کاربر.",
      );
    } finally {
      setDeletingUserId(null);
    }
  }

  /* =======================================================
   * Statistics
   * ======================================================= */

  const statistics = useMemo(() => {
    const adminCount = users.filter(
      (user) => user.role === "admin",
    ).length;

    const normalUserCount = users.filter(
      (user) => user.role === "user",
    ).length;

    const orderCount = users.reduce(
      (total, user) => total + user.orderCount,
      0,
    );

    return {
      total: users.length,
      admins: adminCount,
      users: normalUserCount,
      orders: orderCount,
    };
  }, [users]);

  /* =======================================================
   * Render
   * ======================================================= */

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#09090b] text-white"
    >
      {/* ===================================================
       * Header
       * =================================================== */}

      <header className="border-b border-white/10 bg-[#0d0d0f]">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Link
                to="/admin"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-zinc-400 transition hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
                title="بازگشت به پنل مدیریت"
              >
                <ArrowRight className="h-5 w-5" />
              </Link>

              <div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-zinc-300" />

                  <h1 className="text-xl font-bold">
                    مدیریت کاربران
                  </h1>
                </div>

                <p className="mt-1 text-sm text-zinc-500">
                  مدیریت حساب‌ها، نقش‌ها و سفارش‌های کاربران
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => void loadUsers(true)}
              disabled={loading || refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  refreshing ? "animate-spin" : ""
                }`}
              />

              بروزرسانی
            </button>
          </div>
        </div>
      </header>

      {/* ===================================================
       * Main
       * =================================================== */}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* =================================================
         * Statistics
         * ================================================= */}

        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            icon={<Users className="h-5 w-5" />}
            title="کل کاربران"
            value={statistics.total}
          />

          <StatCard
            icon={<User className="h-5 w-5" />}
            title="کاربران عادی"
            value={statistics.users}
          />

          <StatCard
            icon={<Crown className="h-5 w-5" />}
            title="مدیران"
            value={statistics.admins}
          />

          <StatCard
            icon={<ShoppingBag className="h-5 w-5" />}
            title="سفارش‌ها"
            value={statistics.orders}
          />
        </div>

        {/* =================================================
         * Alerts
         * ================================================= */}

        {error && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
            <X className="mt-0.5 h-5 w-5 shrink-0" />

            <div className="flex-1">
              {error}
            </div>

            <button
              type="button"
              onClick={() => setError("")}
              className="text-red-300/70 transition hover:text-red-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-5 flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />

            <div className="flex-1">
              {success}
            </div>

            <button
              type="button"
              onClick={() => setSuccess("")}
              className="text-emerald-300/70 transition hover:text-emerald-200"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* =================================================
         * Filters
         * ================================================= */}

        <section className="mb-5 rounded-2xl border border-white/10 bg-[#0d0d0f] p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            {/* Search */}

            <div className="relative flex-1">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="جستجو با نام، شماره تلفن یا ایمیل..."
                className="h-11 w-full rounded-xl border border-white/10 bg-black/20 pr-10 pl-4 text-sm text-white outline-none placeholder:text-zinc-600 transition focus:border-white/20 focus:bg-black/30"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 transition hover:text-white"
                  title="پاک کردن جستجو"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Role Filter */}

            <div className="flex rounded-xl border border-white/10 bg-black/20 p-1">
              <FilterButton
                active={roleFilter === "all"}
                onClick={() => setRoleFilter("all")}
              >
                همه
              </FilterButton>

              <FilterButton
                active={roleFilter === "user"}
                onClick={() => setRoleFilter("user")}
              >
                کاربران
              </FilterButton>

              <FilterButton
                active={roleFilter === "admin"}
                onClick={() => setRoleFilter("admin")}
              >
                مدیران
              </FilterButton>
            </div>
          </div>
        </section>

        {/* =================================================
         * Users Table
         * ================================================= */}

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d0d0f]">
          {loading ? (
            <LoadingState />
          ) : users.length === 0 ? (
            <EmptyState
              search={search}
              roleFilter={roleFilter}
              onClear={() => {
                setSearch("");
                setRoleFilter("all");
              }}
            />
          ) : (
            <>
              {/* Desktop Table */}

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[980px]">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.02] text-right text-xs font-medium text-zinc-500">
                      <th className="px-5 py-4">
                        کاربر
                      </th>

                      <th className="px-5 py-4">
                        تماس
                      </th>

                      <th className="px-5 py-4">
                        نقش
                      </th>

                      <th className="px-5 py-4">
                        سفارش‌ها
                      </th>

                      <th className="px-5 py-4">
                        تاریخ عضویت
                      </th>

                      <th className="px-5 py-4 text-left">
                        عملیات
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {users.map((user) => (
                      <UserTableRow
                        key={user.id}
                        user={user}
                        changingRoleId={changingRoleId}
                        deletingUserId={deletingUserId}
                        onRoleChange={handleRoleChange}
                        onDelete={() =>
                          setDeleteTarget(user)
                        }
                        onChangePassword={(target) =>
                          setPasswordTarget(target)
                        }
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}

              <div className="divide-y divide-white/10 md:hidden">
                {users.map((user) => (
                  <UserMobileCard
                    key={user.id}
                    user={user}
                    changingRoleId={changingRoleId}
                    deletingUserId={deletingUserId}
                    onRoleChange={handleRoleChange}
                    onDelete={() =>
                      setDeleteTarget(user)
                    }
                    onChangePassword={(target) =>
                      setPasswordTarget(target)
                    }
                  />
                ))}
              </div>
            </>
          )}
        </section>
      </main>

      {/* ===================================================
       * Delete Modal
       * =================================================== */}

      {deleteTarget && (
        <DeleteModal
          user={deleteTarget}
          loading={deletingUserId === deleteTarget.id}
          onCancel={() => {
            if (!deletingUserId) {
              setDeleteTarget(null);
            }
          }}
          onConfirm={() => void handleDeleteUser()}
        />
      )}

      {/* ===================================================
       * Change Password Modal
       * =================================================== */}

      {passwordTarget && (
        <ChangePasswordModal
          user={passwordTarget}
          loading={
            changingPasswordId === passwordTarget.id
          }
          onCancel={() => {
            if (!changingPasswordId) {
              setPasswordTarget(null);
            }
          }}
          onConfirm={(newPassword) =>
            void handleChangePassword(
              passwordTarget,
              newPassword,
            )
          }
        />
      )}
    </div>
  );
}

/* =========================================================
 * Stat Card
 * ========================================================= */

function StatCard({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0d0d0f] p-4">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.05] text-zinc-300">
        {icon}
      </div>

      <p className="text-xs text-zinc-500">
        {title}
      </p>

      <p className="mt-1 text-xl font-bold text-white">
        {toPersianDigits(value)}
      </p>
    </div>
  );
}

/* =========================================================
 * Filter Button
 * ========================================================= */

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-xs font-medium transition ${
        active
          ? "bg-white text-black"
          : "text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-200"
      }`}
    >
      {children}
    </button>
  );
}

/* =========================================================
 * User Table Row
 * ========================================================= */

function UserTableRow({
  user,
  changingRoleId,
  deletingUserId,
  onRoleChange,
  onDelete,
  onChangePassword,
}: {
  user: AdminUser;
  changingRoleId: string | null;
  deletingUserId: string | null;
  onRoleChange: (
    user: AdminUser,
    role: UserRole,
  ) => void;
  onDelete: () => void;
  onChangePassword: (user: AdminUser) => void;
}) {
  const changing = changingRoleId === user.id;
  const deleting = deletingUserId === user.id;

  return (
    <tr className="border-b border-white/[0.06] last:border-0 transition hover:bg-white/[0.02]">
      {/* User */}

      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <UserAvatar user={user} />

          <div>
            <p className="font-medium text-white">
              {user.firstName} {user.lastName}
            </p>

            <p className="mt-0.5 max-w-[220px] truncate text-xs text-zinc-600">
              {user.id}
            </p>
          </div>
        </div>
      </td>

      {/* Contact */}

      <td className="px-5 py-4">
        <div className="space-y-1 text-sm">
          <p className="text-zinc-300">
            {toPersianDigits(user.phone)}
          </p>

          {user.email && (
            <p className="flex max-w-[220px] items-center gap-1 truncate text-xs text-zinc-500">
              <Mail className="h-3 w-3 shrink-0" />

              <span className="truncate">
                {user.email}
              </span>
            </p>
          )}
        </div>
      </td>

      {/* Role */}

      <td className="px-5 py-4">
        <RoleSelector
          user={user}
          disabled={changing || deleting}
          onChange={(role) =>
            onRoleChange(user, role)
          }
        />
      </td>

      {/* Orders */}

      <td className="px-5 py-4">
        <div className="inline-flex items-center gap-2 rounded-lg bg-white/[0.04] px-3 py-2 text-sm text-zinc-300">
          <ShoppingBag className="h-4 w-4 text-zinc-500" />

          {toPersianDigits(user.orderCount)}
        </div>
      </td>

      {/* Created */}

      <td className="px-5 py-4 text-sm text-zinc-500">
        {formatDate(user.createdAt)}
      </td>

      {/* Actions */}

      <td className="px-5 py-4">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => onChangePassword(user)}
            disabled={deleting || changing}
            title="تغییر رمز عبور"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-blue-500/10 bg-blue-500/[0.04] text-blue-400 transition hover:border-blue-500/20 hover:bg-blue-500/10 hover:text-blue-300 disabled:cursor-not-allowed disabled:opacity-30"
          >
            <KeyRound className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={onDelete}
            disabled={
              deleting ||
              changing ||
              user.role === "admin"
            }
            title={
              user.role === "admin"
                ? "حساب Admin قابل حذف نیست"
                : "حذف کاربر"
            }
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/10 bg-red-500/[0.04] text-red-400 transition hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-30"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </td>
    </tr>
  );
}

/* =========================================================
 * Mobile User Card
 * ========================================================= */

function UserMobileCard({
  user,
  changingRoleId,
  deletingUserId,
  onRoleChange,
  onDelete,
  onChangePassword,
}: {
  user: AdminUser;
  changingRoleId: string | null;
  deletingUserId: string | null;
  onRoleChange: (
    user: AdminUser,
    role: UserRole,
  ) => void;
  onDelete: () => void;
  onChangePassword: (user: AdminUser) => void;
}) {
  const changing = changingRoleId === user.id;
  const deleting = deletingUserId === user.id;

  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <UserAvatar user={user} />

          <div className="min-w-0">
            <p className="truncate font-medium text-white">
              {user.firstName} {user.lastName}
            </p>

            <p className="mt-1 truncate text-xs text-zinc-500">
              {toPersianDigits(user.phone)}
            </p>
          </div>
        </div>

        <RoleBadge role={user.role} />
      </div>

      {user.email && (
        <div className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
          <Mail className="h-3.5 w-3.5" />

          <span className="truncate">
            {user.email}
          </span>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
          <p className="text-[11px] text-zinc-600">
            سفارش‌ها
          </p>

          <p className="mt-1 font-semibold text-zinc-200">
            {toPersianDigits(user.orderCount)}
          </p>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
          <p className="text-[11px] text-zinc-600">
            عضویت
          </p>

          <p className="mt-1 text-xs font-medium text-zinc-300">
            {formatDate(user.createdAt)}
          </p>
        </div>
      </div>

      <div className="mt-4 flex gap-2">
        <div className="flex-1">
          <RoleSelector
            user={user}
            disabled={changing || deleting}
            onChange={(role) =>
              onRoleChange(user, role)
            }
          />
        </div>

        <button
          type="button"
          onClick={() => onChangePassword(user)}
          disabled={deleting || changing}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-500/10 bg-blue-500/[0.04] text-blue-400 transition hover:border-blue-500/20 hover:bg-blue-500/10 disabled:cursor-not-allowed disabled:opacity-30"
          title="تغییر رمز عبور"
        >
          <KeyRound className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={onDelete}
          disabled={
            deleting ||
            changing ||
            user.role === "admin"
          }
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-500/10 bg-red-500/[0.04] text-red-400 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-30"
          title={
            user.role === "admin"
              ? "حساب Admin قابل حذف نیست"
              : "حذف کاربر"
          }
        >
          {deleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}

/* =========================================================
 * User Avatar
 * ========================================================= */

function UserAvatar({
  user,
}: {
  user: AdminUser;
}) {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-white/10 to-white/[0.02] text-sm font-bold text-zinc-300">
      {getInitials(user)}
    </div>
  );
}

/* =========================================================
 * Role Badge
 * ========================================================= */

function RoleBadge({
  role,
}: {
  role: UserRole;
}) {
  if (role === "admin") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/15 bg-amber-400/[0.06] px-2.5 py-1.5 text-xs font-medium text-amber-300">
        <Crown className="h-3.5 w-3.5" />

        مدیر
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1.5 text-xs font-medium text-zinc-400">
      <User className="h-3.5 w-3.5" />

      کاربر
    </span>
  );
}

/* =========================================================
 * Role Selector
 * ========================================================= */

function RoleSelector({
  user,
  disabled,
  onChange,
}: {
  user: AdminUser;
  disabled: boolean;
  onChange: (role: UserRole) => void;
}) {
  return (
    <div className="relative">
      <UserCog className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />

      <select
        value={user.role}
        disabled={disabled}
        onChange={(event) =>
          onChange(
            event.target.value as UserRole,
          )
        }
        className="h-10 w-full min-w-[120px] appearance-none rounded-xl border border-white/10 bg-black/20 px-3 pr-9 text-xs font-medium text-zinc-300 outline-none transition focus:border-white/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option
          value="user"
          className="bg-[#111113]"
        >
          کاربر
        </option>

        <option
          value="admin"
          className="bg-[#111113]"
        >
          مدیر
        </option>
      </select>
    </div>
  );
}

/* =========================================================
 * Change Password Modal
 * ========================================================= */

function ChangePasswordModal({
  user,
  loading,
  onCancel,
  onConfirm,
}: {
  user: AdminUser;
  loading: boolean;
  onCancel: () => void;
  onConfirm: (password: string) => void;
}) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [validationError, setValidationError] =
    useState("");

  function handleSubmit() {
    setValidationError("");

    if (password.length < 8) {
      setValidationError(
        "رمز عبور باید حداقل ۸ کاراکتر باشد.",
      );
      return;
    }

    if (password !== confirmPassword) {
      setValidationError(
        "رمز عبور و تکرار آن یکسان نیستند.",
      );
      return;
    }

    onConfirm(password);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !loading
        ) {
          onCancel();
        }
      }}
    >
      <div
        dir="rtl"
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111113] p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-blue-400">
            <KeyRound className="h-5 w-5" />
          </div>

          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            title="بستن"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <h2 className="mt-5 text-lg font-bold text-white">
          تغییر رمز عبور
        </h2>

        <p className="mt-2 text-sm leading-6 text-zinc-500">
          تغییر رمز عبور کاربر{" "}
          <span className="font-semibold text-zinc-300">
            {user.firstName} {user.lastName}
          </span>
        </p>

        <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-xs leading-6 text-zinc-500">
          رمز عبور قبلی قابل مشاهده نیست و فقط رمز جدید
          برای این حساب ثبت خواهد شد.
        </div>

        {validationError && (
          <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs leading-6 text-red-300">
            {validationError}
          </div>
        )}

        <div className="mt-5 space-y-4">
          <PasswordField
            label="رمز عبور جدید"
            value={password}
            onChange={setPassword}
            visible={showPassword}
            onToggle={() =>
              setShowPassword((value) => !value)
            }
            disabled={loading}
          />

          <PasswordField
            label="تکرار رمز عبور"
            value={confirmPassword}
            onChange={setConfirmPassword}
            visible={showConfirmPassword}
            onToggle={() =>
              setShowConfirmPassword(
                (value) => !value,
              )
            }
            disabled={loading}
          />
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            انصراف
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              loading ||
              !password ||
              !confirmPassword
            }
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}

            {loading
              ? "در حال تغییر..."
              : "تغییر رمز"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
 * Password Field
 * ========================================================= */

function PasswordField({
  label,
  value,
  onChange,
  visible,
  onToggle,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
  disabled: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-medium text-zinc-400">
        {label}
      </label>

      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          disabled={disabled}
          autoComplete="new-password"
          className="h-11 w-full rounded-xl border border-white/10 bg-black/20 px-4 pl-11 text-sm text-white outline-none transition placeholder:text-zinc-700 focus:border-blue-500/40 disabled:opacity-50"
          placeholder="حداقل ۸ کاراکتر"
        />

        <button
          type="button"
          onClick={onToggle}
          disabled={disabled}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 transition hover:text-white disabled:opacity-50"
          title={
            visible
              ? "مخفی کردن رمز"
              : "نمایش رمز"
          }
        >
          {visible ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );
}

/* =========================================================
 * Loading
 * ========================================================= */

function LoadingState() {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />

      <p className="mt-4 text-sm text-zinc-500">
        در حال دریافت کاربران...
      </p>
    </div>
  );
}

/* =========================================================
 * Empty
 * ========================================================= */

function EmptyState({
  search,
  roleFilter,
  onClear,
}: {
  search: string;
  roleFilter: "all" | UserRole;
  onClear: () => void;
}) {
  const filtered =
    search.trim().length > 0 ||
    roleFilter !== "all";

  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center px-5 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
        <Users className="h-7 w-7 text-zinc-600" />
      </div>

      <h3 className="mt-5 text-base font-semibold text-zinc-200">
        {filtered
          ? "کاربری پیدا نشد"
          : "هنوز کاربری وجود ندارد"}
      </h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-zinc-500">
        {filtered
          ? "با عبارت جستجو یا فیلتر انتخاب‌شده کاربری پیدا نشد."
          : "در حال حاضر هیچ حساب کاربری در سیستم ثبت نشده است."}
      </p>

      {filtered && (
        <button
          type="button"
          onClick={onClear}
          className="mt-5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-zinc-300 transition hover:bg-white/[0.08] hover:text-white"
        >
          پاک کردن فیلترها
        </button>
      )}
    </div>
  );
}

/* =========================================================
 * Delete Modal
 * ========================================================= */

function DeleteModal({
  user,
  loading,
  onCancel,
  onConfirm,
}: {
  user: AdminUser;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (
          event.target === event.currentTarget &&
          !loading
        ) {
          onCancel();
        }
      }}
    >
      <div
        dir="rtl"
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#111113] p-6 shadow-2xl"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400">
          <Trash2 className="h-5 w-5" />
        </div>

        <h2 className="mt-5 text-lg font-bold text-white">
          حذف کاربر
        </h2>

        <p className="mt-3 text-sm leading-7 text-zinc-400">
          آیا مطمئن هستید که می‌خواهید حساب{" "}
          <span className="font-semibold text-zinc-200">
            {user.firstName} {user.lastName}
          </span>{" "}
          را حذف کنید؟
        </p>

        {user.orderCount > 0 && (
          <div className="mt-4 rounded-xl border border-amber-400/10 bg-amber-400/[0.05] p-3 text-xs leading-6 text-amber-300/80">
            این کاربر{" "}
            <span className="font-bold text-amber-300">
              {toPersianDigits(user.orderCount)}
            </span>{" "}
            سفارش دارد. سابقه سفارش‌ها حذف نمی‌شود و فقط اتصال
            آن‌ها به حساب کاربر برداشته خواهد شد.
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            انصراف
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}

            {loading
              ? "در حال حذف..."
              : "حذف کاربر"}
          </button>
        </div>
      </div>
    </div>
  );
}