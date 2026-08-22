import { Download } from "lucide-react";

/** Mode A page header: tighter than the consumer PageHeader, with a CSV action. */
export function AdminHeader({
  title,
  description,
  csvHref,
  csvLabel = "Export CSV",
  children,
}: {
  title: string;
  description?: string;
  csvHref?: string;
  csvLabel?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-0.5 max-w-2xl text-[13px] text-foreground-muted">{description}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {children}
        {csvHref && (
          // A plain anchor, not fetch(): the browser handles the download and the
          // Content-Disposition header the API already sends.
          <a
            href={csvHref}
            className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-sm)] border border-border-strong bg-surface px-3 text-[13px] font-medium transition-colors hover:bg-surface-muted"
          >
            <Download className="size-3.5" />
            {csvLabel}
          </a>
        )}
      </div>
    </div>
  );
}
