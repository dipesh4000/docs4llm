import { SkeletonHeader, SkeletonTable } from "@/components/ui/page-skeleton";

export default function AdminUsersLoading() {
  return (
    <div className="space-y-6">
      <SkeletonHeader subtitle />
      <SkeletonTable columns={6} rows={10} />
    </div>
  );
}
