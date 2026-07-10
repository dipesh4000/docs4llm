import { CONTACT_EMAIL } from "@/lib/config/site";

function splitEmails(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function getAdminEmails(): string[] {
  const configured = [
    ...splitEmails(process.env.ADMIN_EMAILS),
    ...splitEmails(process.env.ADMIN_EMAIL),
    ...splitEmails(process.env.NEXT_PUBLIC_ADMIN_EMAIL),
  ];

  if (configured.length > 0) {
    return Array.from(new Set(configured));
  }

  return [CONTACT_EMAIL.toLowerCase()];
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) {
    return false;
  }

  return getAdminEmails().includes(email.toLowerCase());
}
