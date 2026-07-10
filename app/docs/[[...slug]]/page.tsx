import type { Metadata } from "next";
import { Suspense } from "react";
import { DocPageLoader } from "@/components/docs/doc-page-loader";
import { DocPageFallback } from "@/components/docs/docs-shell";

type PageProps = {
  params: Promise<{ slug?: string[] }>;
};

export const metadata: Metadata = {
  title: "Docs — doc2mcp",
  description: "doc2mcp product documentation",
};

export default function DocsPage({ params }: PageProps) {
  return (
    <Suspense fallback={<DocPageFallback />}>
      <DocPageLoader params={params} />
    </Suspense>
  );
}
