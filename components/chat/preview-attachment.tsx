import { FileTextIcon } from "lucide-react";
import Image from "next/image";
import type { Attachment } from "@/lib/types";
import { Spinner } from "../ui/spinner";
import { CrossSmallIcon } from "./icons";

function basename(path: string | undefined | null): string {
  if (!path) {
    return "file";
  }
  const segments = path.split("/");
  return segments.at(-1) ?? path;
}

export const PreviewAttachment = ({
  attachment,
  isUploading = false,
  onRemove,
}: {
  attachment: Attachment;
  isUploading?: boolean;
  onRemove?: () => void;
}) => {
  const { name, url, contentType } = attachment;
  const isImage = contentType?.startsWith("image") ?? false;
  const isPdf = contentType === "application/pdf";
  const displayName = basename(name) || "file";

  return (
    <div
      className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-border/40 bg-muted"
      data-testid="input-attachment-preview"
      title={displayName}
    >
      {isImage && url ? (
        <Image
          alt={displayName}
          className="size-full object-cover"
          height={96}
          src={url}
          unoptimized={url.startsWith("http")}
          width={96}
        />
      ) : isPdf ? (
        <a
          aria-label={`Open ${displayName}`}
          className="flex size-full flex-col items-center justify-center gap-1 p-2 text-center text-muted-foreground text-xs hover:bg-muted/80"
          href={url || undefined}
          rel="noopener noreferrer"
          target="_blank"
        >
          <FileTextIcon className="size-6 text-rose-500" />
          <span className="font-mono text-[10px] text-foreground/80 uppercase tracking-wider">
            PDF
          </span>
          <span className="line-clamp-1 w-full font-mono text-[9px] text-muted-foreground">
            {displayName}
          </span>
        </a>
      ) : (
        <div className="flex size-full flex-col items-center justify-center gap-1 text-center text-muted-foreground text-xs">
          <FileTextIcon className="size-5" />
          <span>File</span>
        </div>
      )}

      {isUploading && (
        <div
          className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40 backdrop-blur-sm"
          data-testid="input-attachment-loader"
        >
          <Spinner className="size-5" />
        </div>
      )}

      {onRemove && !isUploading && (
        <button
          className="absolute top-1.5 right-1.5 flex size-5 items-center justify-center rounded-full bg-black/60 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/80 group-hover:opacity-100"
          onClick={onRemove}
          type="button"
        >
          <CrossSmallIcon size={10} />
        </button>
      )}
    </div>
  );
};
