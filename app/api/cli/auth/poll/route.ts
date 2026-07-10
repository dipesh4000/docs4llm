import { z } from "zod";
import { hashSecret } from "@/lib/cli/tokens";
import {
  consumeCliAuthIssuedToken,
  expireStaleCliAuthRequests,
  getCliAuthRequestByDeviceCodeHash,
  getUserById,
} from "@/lib/db/queries";

const bodySchema = z.object({
  deviceCode: z.string().min(16),
});

export async function POST(request: Request) {
  await expireStaleCliAuthRequests();

  const { deviceCode } = bodySchema.parse(await request.json());
  const row = await getCliAuthRequestByDeviceCodeHash({
    deviceCodeHash: hashSecret(deviceCode),
  });

  if (!row) {
    return Response.json({ status: "expired" }, { status: 400 });
  }

  if (row.expiresAt.getTime() < Date.now()) {
    return Response.json({ status: "expired" });
  }

  if (row.status === "pending") {
    return Response.json({ status: "pending" });
  }

  if (row.status === "denied") {
    return Response.json({ status: "denied" });
  }

  if (row.status !== "approved" || !row.userId) {
    return Response.json({ status: "expired" });
  }

  const issuedToken = row.issuedTokenPlaintext;
  if (!issuedToken) {
    return Response.json(
      { status: "already_delivered", message: "Token already claimed." },
      { status: 409 }
    );
  }

  const appUser = await getUserById(row.userId);
  if (!appUser) {
    return Response.json({ status: "expired" });
  }

  await consumeCliAuthIssuedToken({ id: row.id });

  return Response.json({
    status: "approved",
    token: issuedToken,
    user: {
      id: appUser.id,
      email: appUser.email,
      name: appUser.name,
    },
  });
}
