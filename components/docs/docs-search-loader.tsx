import { DocsSearch } from "@/components/docs/docs-search";
import { getDocNav } from "@/lib/docs/loader";

export async function DocsSearchLoader() {
  const nav = await getDocNav();
  return <DocsSearch items={nav} />;
}
