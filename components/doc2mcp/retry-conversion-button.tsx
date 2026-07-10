"use client";

import { Loader2, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type RetryConversionButtonProps = {
  projectId: string;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "outline" | "secondary" | "ghost";
  label?: string;
  redirectToConvert?: boolean;
  onSuccess?: () => void | Promise<void>;
};

export function RetryConversionButton({
  projectId,
  className,
  size = "default",
  variant = "default",
  label = "Retry conversion",
  redirectToConvert = true,
  onSuccess,
}: RetryConversionButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleRetry = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/retry`, {
        method: "POST",
      });
      const body = (await res.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
      };

      if (!res.ok) {
        toast.error(body.message ?? "Could not restart the pipeline.");
        return;
      }

      toast.success(
        "Pipeline restarted — failed runs do not count toward your limit."
      );
      if (onSuccess) {
        await onSuccess();
      } else if (redirectToConvert) {
        router.push(`/convert/${projectId}`);
      } else {
        router.refresh();
      }
    } catch {
      toast.error("Could not restart the pipeline.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      className={cn(className)}
      disabled={loading}
      onClick={handleRetry}
      size={size}
      type="button"
      variant={variant}
    >
      {loading ? (
        <Loader2 className="mr-1.5 size-4 animate-spin" />
      ) : (
        <RotateCcw className="mr-1.5 size-4" />
      )}
      {label}
    </Button>
  );
}
