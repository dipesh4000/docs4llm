import { SkeletonBlock, SkeletonHeader } from "@/components/ui/page-skeleton";

export default function DashboardProfileLoading() {
  return (
    <div className="space-y-8">
      <SkeletonBlock className="h-44 w-full rounded-2xl" />
      <SkeletonHeader subtitle />
      <div className="grid gap-4 lg:grid-cols-3">
        <SkeletonBlock className="h-48 rounded-2xl" />
        <SkeletonBlock className="h-48 rounded-2xl" />
        <SkeletonBlock className="h-48 rounded-2xl" />
      </div>
    </div>
  );
}
