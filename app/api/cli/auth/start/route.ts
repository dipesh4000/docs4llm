import {
  CLI_AUTH_EXPIRY_MINUTES,
  CLI_AUTH_POLL_INTERVAL_SECONDS,
  createDeviceCode,
  createUserCode,
  hashSecret,
} from "@/lib/cli/tokens";
import {
  createCliAuthRequest,
  expireStaleCliAuthRequests,
} from "@/lib/db/queries";
import { getDoc2McpBaseUrl } from "@/lib/doc2mcp/app-url";

export async function POST() {
  await expireStaleCliAuthRequests();

  const deviceCode = createDeviceCode();
  const userCode = createUserCode();
  const expiresAt = new Date(Date.now() + CLI_AUTH_EXPIRY_MINUTES * 60 * 1000);

  await createCliAuthRequest({
    deviceCodeHash: hashSecret(deviceCode),
    userCode,
    expiresAt,
  });

  const baseUrl = getDoc2McpBaseUrl();
  const verifyUrl = `${baseUrl}/cli/authorize?code=${encodeURIComponent(userCode)}`;

  return Response.json({
    deviceCode,
    userCode,
    verifyUrl,
    expiresIn: CLI_AUTH_EXPIRY_MINUTES * 60,
    interval: CLI_AUTH_POLL_INTERVAL_SECONDS,
  });
}
