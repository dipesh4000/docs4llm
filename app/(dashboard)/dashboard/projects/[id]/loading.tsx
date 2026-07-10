import { SkeletonBlock, SkeletonHeader } from "@/components/ui/page-skeleton";

export default function DashboardProjectDetailLoading() {
  return (
    <div className="space-y-8">
      <SkeletonHeader subtitle />
      <div className="grid gap-4 lg:grid-cols-3">
        <SkeletonBlock className="h-36 rounded-2xl" />
        <SkeletonBlock className="h-36 rounded-2xl" />
        <SkeletonBlock className="h-36 rounded-2xl" />
      </div>
      <SkeletonBlock className="h-96 rounded-2xl" />
    </div>
  );
}
