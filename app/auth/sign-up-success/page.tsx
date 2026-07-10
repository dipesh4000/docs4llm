import Link from "next/link";

export default function Page() {
  return (
    <div className="flex min-h-dvh w-screen items-center justify-center bg-background p-8">
      <div className="w-full max-w-md space-y-4 rounded-2xl border border-border/40 p-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Thank you for signing up!
        </h1>
        <p className="text-sm text-muted-foreground">
          Check your email to confirm your account before signing in.
        </p>
        <Link
          className="inline-flex text-sm text-foreground underline-offset-4 hover:underline"
          href="/login"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
