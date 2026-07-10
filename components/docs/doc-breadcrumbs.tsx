import { ChevronRight } from "lucide-react";
import Link from "next/link";

export function DocBreadcrumbs({
  category,
  title,
}: {
  category: string;
  title: string;
}) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5 text-muted-foreground text-xs">
        <li>
          <Link className="hover:text-foreground" href="/docs">
            Docs
          </Link>
        </li>
        <li aria-hidden="true">
          <ChevronRight className="size-3" />
        </li>
        <li className="text-muted-foreground/80">{category}</li>
        <li aria-hidden="true">
          <ChevronRight className="size-3" />
        </li>
        <li className="font-medium text-foreground">{title}</li>
      </ol>
    </nav>
  );
}
