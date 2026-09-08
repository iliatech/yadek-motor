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

function generateAddressId() {
  return `ADDR-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 7)
    .toUpperCase()}`;
}

export function getAddresses(): UserAddress[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch {
    return [];
  }
}

export function saveAddresses(addresses: UserAddress[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(addresses),
    );
  } catch {
    // ignore
  }
}

export function createAddress(
  address: Omit<UserAddress, "id">,
): UserAddress {
  const addresses = getAddresses();

  const newAddress: UserAddress = {
    ...address,
    id: generateAddressId(),
  };

  let updatedAddresses: UserAddress[];

  if (newAddress.isDefault || addresses.length === 0) {
    updatedAddresses = [
      newAddress,
      ...addresses.map((item) => ({
        ...item,
        isDefault: false,
      })),
    ];
  } else {
    updatedAddresses = [
      newAddress,
      ...addresses,
    ];
  }

  saveAddresses(updatedAddresses);

  return newAddress;
}

export function updateAddress(
  id: string,
  changes: Partial<Omit<UserAddress, "id">>,
) {
  const addresses = getAddresses();

  let updatedAddresses = addresses.map((address) =>
    address.id === id
      ? {
          ...address,
          ...changes,
        }
      : address,
  );

  if (changes.isDefault === true) {
    updatedAddresses = updatedAddresses.map((address) => ({
      ...address,
      isDefault: address.id === id,
    }));
  }

  saveAddresses(updatedAddresses);

  return updatedAddresses.find(
    (address) => address.id === id,
  );
}

export function deleteAddress(id: string) {
  const addresses = getAddresses();

  const deletedAddress = addresses.find(
    (address) => address.id === id,
  );

  let updatedAddresses = addresses.filter(
    (address) => address.id !== id,
  );

  if (
    deletedAddress?.isDefault &&
    updatedAddresses.length > 0
  ) {
    updatedAddresses = updatedAddresses.map(
      (address, index) => ({
        ...address,
        isDefault: index === 0,
      }),
    );
  }

  saveAddresses(updatedAddresses);

  return updatedAddresses;
}

export function setDefaultAddress(id: string) {
  const addresses = getAddresses();

  const updatedAddresses = addresses.map((address) => ({
    ...address,
    isDefault: address.id === id,
  }));

  saveAddresses(updatedAddresses);

  return updatedAddresses;
}

export function getDefaultAddress() {
  return getAddresses().find(
    (address) => address.isDefault,
  );
}

export function clearAddresses() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}