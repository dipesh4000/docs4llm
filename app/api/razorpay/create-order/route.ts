/**
 * Billing was removed from this fork. Keep the former endpoint explicit so
 * stale clients receive a stable response instead of breaking the build.
 */
export function POST() {
  return Response.json(
    { error: "Billing is not available in this deployment." },
    { status: 410 }
  );
}
