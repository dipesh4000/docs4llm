import { SkeletonBlock, SkeletonHeader } from "@/components/ui/page-skeleton";

export default function DashboardSettingsLoading() {
  return (
    <div className="space-y-6">
      <SkeletonHeader subtitle />
      <SkeletonBlock className="h-44 rounded-2xl" />
      <SkeletonBlock className="h-44 rounded-2xl" />
    </div>
  );
}
