import { DocsMobileNav } from "@/components/docs/docs-mobile-nav";
import { getDocNavGroups } from "@/lib/docs/loader";

export async function DocsMobileNavLoader() {
  const groups = await getDocNavGroups();
  return <DocsMobileNav groups={groups} />;
}
