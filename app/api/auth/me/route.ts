import { auth } from "@/app/(auth)/auth";

export async function GET() {
  const session = await auth();
  return Response.json({ user: session?.user ?? null });
}
