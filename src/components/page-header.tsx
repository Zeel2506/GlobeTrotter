import { cn } from "@/lib/cn";

export function PageHeader({
  title,
  description,
  action,
  eyebrow,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  eyebrow?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-end justify-between gap-4 pb-6", className)}>
      <div className="min-w-0">
        {eyebrow && <p className="overline mb-1.5 text-primary">{eyebrow}</p>}
        <h1 className="text-[2rem] font-bold leading-tight">{title}</h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-foreground-muted">{description}</p>
        )}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}
