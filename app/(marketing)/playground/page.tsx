import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { auth } from "@/app/(auth)/auth";

async function PlaygroundRedirectContent(): Promise<null> {
  await connection();
  const session = await auth();

  if (!session?.user?.id || session.user.type === "guest") {
    redirect("/login?redirectUrl=/chat");
  }

  redirect("/chat");
  return null;
}

export default function PlaygroundRedirectPage() {
  return (
    <Suspense fallback={null}>
      <PlaygroundRedirectContent />
    </Suspense>
  );
}
