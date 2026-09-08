export type UserProfile = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  province: string;
  city: string;
  address: string;
  postalCode: string;
  createdAt: string;
};

const USER_STORAGE_KEY = "yadak-motor-user";
const AUTH_STORAGE_KEY = "yadak-motor-auth";

function generateUserId() {
  const random = Math.random()
    .toString(36)
    .substring(2, 10)
    .toUpperCase();

  return `USER-${random}`;
}

function isBrowser() {
  return typeof window !== "undefined";
}

/**
 * دریافت اطلاعات کاربر فعلی
 */
export function getCurrentUser(): UserProfile | null {
  if (!isBrowser()) {
    return null;
  }

  try {
    const saved = localStorage.getItem(USER_STORAGE_KEY);

    if (!saved) {
      return null;
    }

    const parsed = JSON.parse(saved);

    if (!parsed || typeof parsed !== "object") {
      return null;
    }

    return parsed as UserProfile;
  } catch {
    return null;
  }
}

/**
 * بررسی وضعیت ورود
 */
export function isLoggedIn(): boolean {
  if (!isBrowser()) {
    return false;
  }

  return localStorage.getItem(AUTH_STORAGE_KEY) === "true";
}

/**
 * ذخیره اطلاعات کاربر
 */
export function saveUser(user: UserProfile) {
  if (!isBrowser()) {
    return;
  }

  try {
    localStorage.setItem(
      USER_STORAGE_KEY,
      JSON.stringify(user),
    );

    localStorage.setItem(AUTH_STORAGE_KEY, "true");
  } catch {
    // localStorage در بعضی شرایط ممکن است در دسترس نباشد
  }
}

/**
 * ورود / ایجاد حساب
 *
 * اگر کاربر قبلاً وجود داشته باشد،
 * اطلاعات قبلی حفظ می‌شود.
 */
export function loginUser({
  firstName,
  lastName,
  phone,
  email,
}: {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}): UserProfile {
  const existingUser = getCurrentUser();

  const user: UserProfile = {
    id: existingUser?.id ?? generateUserId(),
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    phone: phone.trim(),
    email: email.trim(),
    province: existingUser?.province ?? "",
    city: existingUser?.city ?? "",
    address: existingUser?.address ?? "",
    postalCode: existingUser?.postalCode ?? "",
    createdAt:
      existingUser?.createdAt ?? new Date().toISOString(),
  };

  saveUser(user);

  return user;
}

/**
 * به‌روزرسانی اطلاعات حساب
 */
export function updateUser(
  changes: Partial<Omit<UserProfile, "id" | "createdAt">>,
): UserProfile | null {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    return null;
  }

  const updatedUser: UserProfile = {
    ...currentUser,
    ...changes,
  };

  saveUser(updatedUser);

  return updatedUser;
}

/**
 * خروج از حساب
 */
export function logoutUser() {
  if (!isBrowser()) {
    return;
  }

  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/**
 * حذف کامل حساب محلی
 */
export function deleteLocalAccount() {
  if (!isBrowser()) {
    return;
  }

  try {
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    // ignore
  }
}