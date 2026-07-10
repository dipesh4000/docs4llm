import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { auth } from "@/app/(auth)/auth";
import { CliAuthorizeShell } from "./cli-authorize-client";

async function CliAuthorizeContent({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  await connection();
  const { code } = await searchParams;
  const userCode = code?.trim().toUpperCase();

  if (!userCode) {
    redirect("/");
  }

  const session = await auth();
  if (!session?.user?.id || session.user.type === "guest") {
    redirect(
      `/login?redirectUrl=${encodeURIComponent(`/cli/authorize?code=${userCode}`)}`
    );
  }

  return <CliAuthorizeShell userCode={userCode} />;
}

export default function CliAuthorizePage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-md px-4 py-16 text-center text-muted-foreground text-sm">
          Loading authorization…
        </div>
      }
    >
      <CliAuthorizeContent searchParams={searchParams} />
    </Suspense>
  );
}
