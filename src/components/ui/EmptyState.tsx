import { cn } from "@/lib/cn";
import { Icon, type IconName } from "@/components/ui/Icon";

export function EmptyState({
  icon,
  title,
  body,
  action,
  className,
}: {
  icon: IconName;
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
      <span className="grid h-14 w-14 place-items-center rounded-full bg-surface-raised text-text-muted">
        <Icon name={icon} size={26} />
      </span>
      <span className="t-title-md">{title}</span>
      <span className="t-body-sm max-w-sm text-text-muted">{body}</span>
      {action}
    </div>
  );
}
