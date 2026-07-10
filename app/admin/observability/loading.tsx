import {
  SkeletonHeader,
  SkeletonStatCards,
  SkeletonTable,
} from "@/components/ui/page-skeleton";

export default function AdminObservabilityLoading() {
  return (
    <div className="space-y-6">
      <SkeletonHeader subtitle />
      <SkeletonStatCards />
      <SkeletonTable columns={5} rows={6} />
    </div>
  );
}
