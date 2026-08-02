import { cn } from "@/lib/cn";

export function EmptyState({
  glyph,
  title,
  body,
  action,
  className,
}: {
  glyph: string;
  title: string;
  body: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid place-items-center gap-3 rounded-lg border border-dashed border-border-strong px-6 py-12 text-center",
        className,
      )}
    >
      <span aria-hidden="true" className="text-3xl text-text-faint">
        {glyph}
      </span>
      <span className="t-title-md">{title}</span>
      <span className="t-body-sm max-w-sm text-text-muted">{body}</span>
      {action}
    </div>
  );
}
