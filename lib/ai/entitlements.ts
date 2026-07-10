import type { UserType } from "@/app/(auth)/auth";

type Entitlements = {
  maxMessagesPerHour: number;
};

/** Guests can chat without an account, capped at this many messages. */
export const GUEST_MESSAGE_LIMIT = 5;

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  guest: {
    maxMessagesPerHour: GUEST_MESSAGE_LIMIT,
  },
  regular: {
    maxMessagesPerHour: Number.POSITIVE_INFINITY,
  },
};
