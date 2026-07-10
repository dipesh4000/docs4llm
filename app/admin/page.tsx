import { Suspense } from "react";
import { AdminOverview } from "@/components/admin/admin-overview";
import {
  SkeletonHeader,
  SkeletonStatCards,
  SkeletonTable,
} from "@/components/ui/page-skeleton";

function AdminOverviewFallback() {
  return (
    <div className="space-y-8">
      <SkeletonHeader subtitle />
      <SkeletonStatCards />
      <SkeletonTable columns={4} rows={6} />
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<AdminOverviewFallback />}>
      <AdminOverview />
    </Suspense>
  );
}
