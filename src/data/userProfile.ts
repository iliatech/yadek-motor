import {
  getAccount,
  saveAccount,
  type UserAccount,
} from "@/data/account";

export type UserProfile = UserAccount;

export function getUserProfile(): UserProfile | null {
  return getAccount();
}

export function saveUserProfile(
  profile: UserProfile,
): UserProfile {
  saveAccount(profile);
  return profile;
}