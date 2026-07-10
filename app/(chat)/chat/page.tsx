import { ChatRouteGuard } from "@/components/chat/chat-route-guard";

export default function Page() {
  return <ChatRouteGuard redirectUrl="/chat" />;
}
