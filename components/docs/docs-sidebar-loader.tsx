import { DocsSidebar } from "@/components/docs/docs-sidebar";
import { getDocNavGroups } from "@/lib/docs/loader";

export async function DocsSidebarLoader() {
  const groups = await getDocNavGroups();
  return <DocsSidebar groups={groups} />;
}
