import { redirect } from "next/navigation";

export default function DashboardPlaygroundRedirectPage() {
  redirect("/chat");
}
