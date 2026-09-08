export type UserAccount = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  createdAt: string;
};

const ACCOUNT_STORAGE_KEY = "yadak-motor-account";

function generateUserId() {
  const random = Math.random()
    .toString(36)
    .substring(2, 10)
    .toUpperCase();

  return `USER-${random}`;
}

export function getAccount(): UserAccount | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const saved = window.localStorage.getItem(
      ACCOUNT_STORAGE_KEY,
    );

    if (!saved) {
      return null;
    }

    const parsed = JSON.parse(saved);

    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof parsed.id !== "string" ||
      typeof parsed.firstName !== "string" ||
      typeof parsed.lastName !== "string" ||
      typeof parsed.phone !== "string"
    ) {
      return null;
    }

    return {
      id: parsed.id,
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      phone: parsed.phone,
      email: typeof parsed.email === "string" ? parsed.email : "",
      createdAt:
        typeof parsed.createdAt === "string"
          ? parsed.createdAt
          : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function saveAccount(account: UserAccount) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      ACCOUNT_STORAGE_KEY,
      JSON.stringify(account),
    );
  } catch {
    // ignore
  }
}

export function createAccount({
  firstName,
  lastName,
  phone,
  email = "",
}: {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
}): UserAccount {
  const account: UserAccount = {
    id: generateUserId(),
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    phone: phone.trim(),
    email: email.trim(),
    createdAt: new Date().toISOString(),
  };

  saveAccount(account);

  return account;
}

export function updateAccount(
  updates: Partial<
    Pick<UserAccount, "firstName" | "lastName" | "phone" | "email">
  >,
): UserAccount | null {
  const current = getAccount();

  if (!current) {
    return null;
  }

  const updated: UserAccount = {
    ...current,
    ...updates,
    firstName:
      updates.firstName !== undefined
        ? updates.firstName.trim()
        : current.firstName,
    lastName:
      updates.lastName !== undefined
        ? updates.lastName.trim()
        : current.lastName,
    phone:
      updates.phone !== undefined
        ? updates.phone.trim()
        : current.phone,
    email:
      updates.email !== undefined
        ? updates.email.trim()
        : current.email,
  };

  saveAccount(updated);

  return updated;
}

export function logoutAccount() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(ACCOUNT_STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function isLoggedIn() {
  return getAccount() !== null;
}