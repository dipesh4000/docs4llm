import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { auth } from "@/app/(auth)/auth";
import { AdminShell } from "@/components/admin/admin-shell";
import { isAdminEmail } from "@/lib/admin/admin-access";

function AdminLayoutFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <p className="text-muted-foreground text-sm">Loading admin…</p>
    </div>
  );
}

async function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  await connection();
  const session = await auth();

  if (!isAdminEmail(session?.user?.email)) {
    redirect("/login?redirectUrl=/admin");
  }

  return (
    <AdminShell userEmail={session?.user?.email ?? ""}>{children}</AdminShell>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<AdminLayoutFallback />}>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </Suspense>
  );
}
