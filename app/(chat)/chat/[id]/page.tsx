import { ChatRouteGuard } from "@/components/chat/chat-route-guard";

export default async function ChatHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <ChatRouteGuard redirectUrl={`/chat/${id}`} />;
}
