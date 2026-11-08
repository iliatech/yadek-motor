import { getAccount } from "@/data/account";

export type UserAddress = {
  id: string;
  title: string;
  firstName: string;
  lastName: string;
  phone: string;
  province: string;
  city: string;
  address: string;
  postalCode: string;
  isDefault: boolean;
};

const STORAGE_KEY = "yadak-motor-addresses";

type AddressStorage = Record<string, UserAddress[]>;

/*
 * --------------------------------------------------
 * ساخت شناسه آدرس
 * --------------------------------------------------
 */

function generateAddressId() {
  return `ADDR-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 7)
    .toUpperCase()}`;
}

/*
 * --------------------------------------------------
 * دریافت شناسه حساب فعلی
 * --------------------------------------------------
 */

function getCurrentAccountId(): string | null {
  const account = getAccount();

  return account?.id ?? null;
}

/*
 * --------------------------------------------------
 * خواندن اطلاعات آدرس‌ها
 * --------------------------------------------------
 *
 * ساختار جدید:
 *
 * {
 *   "USER-XXXX": [ ...addresses ],
 *   "USER-YYYY": [ ...addresses ]
 * }
 *
 * اگر اطلاعات قدیمی به صورت آرایه ساده باشند،
 * آنها دیگر به هیچ حسابی نسبت داده نمی‌شوند.
 * --------------------------------------------------
 */

function readStorage(): AddressStorage {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const saved =
      window.localStorage.getItem(
        STORAGE_KEY,
      );

    if (!saved) {
      return {};
    }

    const parsed = JSON.parse(saved);

    /*
     * داده قدیمی:
     *
     * [
     *   { ...address },
     *   { ...address }
     * ]
     *
     * این اطلاعات قابل نسبت دادن به یک
     * حساب مشخص نیستند؛ بنابراین نادیده
     * گرفته می‌شوند.
     */

    if (Array.isArray(parsed)) {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({}),
      );

      return {};
    }

    if (
      !parsed ||
      typeof parsed !== "object"
    ) {
      return {};
    }

    const result: AddressStorage = {};

    for (const [
      accountId,
      addresses,
    ] of Object.entries(parsed)) {
      if (Array.isArray(addresses)) {
        result[accountId] =
          addresses as UserAddress[];
      }
    }

    return result;
  } catch {
    return {};
  }
}

/*
 * --------------------------------------------------
 * ذخیره اطلاعات آدرس‌ها
 * --------------------------------------------------
 */

function writeStorage(
  storage: AddressStorage,
) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(storage),
    );
  } catch {
    // ignore
  }
}

/*
 * --------------------------------------------------
 * دریافت آدرس‌های حساب فعلی
 * --------------------------------------------------
 */

export function getAddresses(): UserAddress[] {
  if (typeof window === "undefined") {
    return [];
  }

  const accountId =
    getCurrentAccountId();

  /*
   * اگر کاربر وارد نشده باشد،
   * هیچ آدرسی نباید نمایش داده شود.
   */

  if (!accountId) {
    return [];
  }

  const storage =
    readStorage();

  /*
   * فقط آدرس‌های همین حساب
   * برگردانده می‌شوند.
   */

  return storage[accountId] ?? [];
}

/*
 * --------------------------------------------------
 * ذخیره آدرس‌های حساب فعلی
 * --------------------------------------------------
 */

export function saveAddresses(
  addresses: UserAddress[],
) {
  if (typeof window === "undefined") {
    return;
  }

  const accountId =
    getCurrentAccountId();

  /*
   * بدون حساب کاربری اجازه ذخیره نداریم.
   */

  if (!accountId) {
    return;
  }

  const storage =
    readStorage();

  /*
   * آدرس‌ها فقط داخل کلید مربوط
   * به حساب فعلی ذخیره می‌شوند.
   */

  storage[accountId] =
    addresses;

  writeStorage(storage);
}

/*
 * --------------------------------------------------
 * ساخت آدرس جدید
 * --------------------------------------------------
 */

export function createAddress(
  address: Omit<UserAddress, "id">,
): UserAddress {
  const accountId =
    getCurrentAccountId();

  if (!accountId) {
    throw new Error(
      "برای ذخیره آدرس ابتدا وارد حساب کاربری شوید.",
    );
  }

  const addresses =
    getAddresses();

  const newAddress: UserAddress = {
    ...address,
    id: generateAddressId(),
  };

  let updatedAddresses: UserAddress[];

  /*
   * اگر آدرس جدید Default باشد،
   * Default قبلی برداشته می‌شود.
   *
   * اگر اولین آدرس باشد نیز Default می‌شود.
   */

  if (
    newAddress.isDefault ||
    addresses.length === 0
  ) {
    updatedAddresses = [
      {
        ...newAddress,
        isDefault: true,
      },

      ...addresses.map(
        (item) => ({
          ...item,
          isDefault: false,
        }),
      ),
    ];
  } else {
    updatedAddresses = [
      newAddress,
      ...addresses,
    ];
  }

  saveAddresses(
    updatedAddresses,
  );

  return newAddress;
}

/*
 * --------------------------------------------------
 * ویرایش آدرس
 * --------------------------------------------------
 */

export function updateAddress(
  id: string,
  changes: Partial<
    Omit<UserAddress, "id">
  >,
) {
  const addresses =
    getAddresses();

  let updatedAddresses =
    addresses.map(
      (address) =>
        address.id === id
          ? {
              ...address,
              ...changes,
            }
          : address,
    );

  /*
   * اگر این آدرس Default شد،
   * تمام آدرس‌های دیگر غیر Default می‌شوند.
   */

  if (changes.isDefault === true) {
    updatedAddresses =
      updatedAddresses.map(
        (address) => ({
          ...address,
          isDefault:
            address.id === id,
        }),
      );
  }

  saveAddresses(
    updatedAddresses,
  );

  return updatedAddresses.find(
    (address) =>
      address.id === id,
  );
}

/*
 * --------------------------------------------------
 * حذف آدرس
 * --------------------------------------------------
 */

export function deleteAddress(
  id: string,
) {
  const addresses =
    getAddresses();

  const deletedAddress =
    addresses.find(
      (address) =>
        address.id === id,
    );

  let updatedAddresses =
    addresses.filter(
      (address) =>
        address.id !== id,
    );

  /*
   * اگر آدرس Default حذف شد،
   * اولین آدرس باقی‌مانده Default می‌شود.
   */

  if (
    deletedAddress?.isDefault &&
    updatedAddresses.length > 0
  ) {
    updatedAddresses =
      updatedAddresses.map(
        (address, index) => ({
          ...address,
          isDefault:
            index === 0,
        }),
      );
  }

  saveAddresses(
    updatedAddresses,
  );

  return updatedAddresses;
}

/*
 * --------------------------------------------------
 * انتخاب آدرس پیش‌فرض
 * --------------------------------------------------
 */

export function setDefaultAddress(
  id: string,
) {
  const addresses =
    getAddresses();

  const updatedAddresses =
    addresses.map(
      (address) => ({
        ...address,
        isDefault:
          address.id === id,
      }),
    );

  saveAddresses(
    updatedAddresses,
  );

  return updatedAddresses;
}

/*
 * --------------------------------------------------
 * دریافت آدرس پیش‌فرض
 * --------------------------------------------------
 */

export function getDefaultAddress():
  | UserAddress
  | undefined {
  return getAddresses().find(
    (address) =>
      address.isDefault,
  );
}

/*
 * --------------------------------------------------
 * پاک کردن آدرس‌های حساب فعلی
 * --------------------------------------------------
 *
 * فقط آدرس‌های حساب فعلی حذف می‌شوند.
 * آدرس حساب‌های دیگر دست‌نخورده باقی می‌مانند.
 * --------------------------------------------------
 */

export function clearAddresses() {
  if (typeof window === "undefined") {
    return;
  }

  const accountId =
    getCurrentAccountId();

  if (!accountId) {
    return;
  }

  const storage =
    readStorage();

  delete storage[accountId];

  writeStorage(storage);
}