import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "guest" | "admin" | "hero";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-accent-fill text-accent-on hover:bg-accent-active",
  secondary: "bg-transparent border border-border-strong text-text hover:bg-surface-raised",
  ghost: "bg-transparent text-text-muted hover:text-text hover:bg-surface-raised",
  danger: "bg-red-500 text-on-primary hover:brightness-95",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "h-9 px-4 text-sm rounded-md",
  guest: "h-11 px-6 text-[15px] rounded-md",
  admin: "h-14 px-6 text-base rounded-md",
  hero: "h-[60px] px-7 text-base rounded-md",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  size = "guest",
  fullWidth,
  className,
  disabled,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold no-underline transition-colors duration-base",
        "disabled:cursor-not-allowed disabled:bg-surface-raised disabled:text-text-muted",
        "disabled:border-transparent disabled:hover:bg-surface-raised",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth && "w-full",
        className,
      )}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
}
