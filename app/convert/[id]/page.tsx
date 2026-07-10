import { Loader2 } from "lucide-react";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/app/(auth)/auth";
import { ConvertExperience } from "@/features/doc2mcp/convert-experience";
import { getPlatformProjectById } from "@/lib/db/queries";
import { redactSecrets } from "@/services/mcp/exports";

async function ConvertLoader({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id || session.user.type === "guest") {
    redirect(`/login?redirectUrl=${encodeURIComponent(`/convert/${id}`)}`);
  }

  const project = await getPlatformProjectById({
    id,
    userId: session.user.id,
  });

  if (!project) {
    notFound();
  }

  return <ConvertExperience initialProject={redactSecrets(project)} />;
}

function ConvertFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="size-5 animate-spin text-violet-400" />
        <p className="font-mono text-xs">loading conversion…</p>
      </div>
    </div>
  );
}

export default function ConvertPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<ConvertFallback />}>
      <ConvertLoader params={params} />
    </Suspense>
  );
}
