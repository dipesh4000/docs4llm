import {
  SkeletonBlock,
  SkeletonHeader,
  SkeletonStatCards,
} from "@/components/ui/page-skeleton";

export default function DashboardUsageLoading() {
  return (
    <div className="space-y-6">
      <SkeletonHeader subtitle />
      <SkeletonStatCards count={3} />
      <SkeletonBlock className="h-60 rounded-2xl" />
    </div>
  );
}
