import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { auth } from "@/app/(auth)/auth";
import { isAdminEmail } from "@/lib/admin/admin-access";

function PostLoginFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <p className="text-muted-foreground text-sm">Signing you in…</p>
    </div>
  );
}

/**
 * Server-side post-login router. The login / register forms send users here
 * after a successful Supabase sign-in. We decide the destination based on
 * verified server-side identity (not on a client-side guess), so admins
 * land on /admin and regular users on /chat immediately.
 */
async function PostLoginPageContent({
  searchParams,
}: {
  searchParams: Promise<{ redirectUrl?: string }>;
}) {
  await connection();
  const { redirectUrl } = await searchParams;

  if (redirectUrl?.startsWith("/") && !redirectUrl.startsWith("//")) {
    redirect(redirectUrl);
  }

  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  if (isAdminEmail(session.user.email)) {
    redirect("/admin");
  }

  redirect("/chat");
  return null;
}

export default function PostLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectUrl?: string }>;
}) {
  return (
    <Suspense fallback={<PostLoginFallback />}>
      <PostLoginPageContent searchParams={searchParams} />
    </Suspense>
  );
}
