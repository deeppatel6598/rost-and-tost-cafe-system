import type { CafeSettings } from "@/lib/types";

export function Footer({ settings }: { settings: CafeSettings }) {
  return (
    <footer data-surface="roast" className="bg-roast-950 text-on-dark">
      <div className="mx-auto grid max-w-[1200px] grid-cols-[repeat(auto-fit,minmax(220px,1fr))] items-start gap-6 px-[clamp(16px,4vw,40px)] py-[clamp(36px,5vw,64px)]">
        <span className="t-display-sm">{settings.name}</span>
        <div className="grid gap-2 text-[15px] text-text-muted">
          <a href="#menu" className="no-underline">Menu</a>
          <a href="#ordering" className="no-underline">Table ordering</a>
          <a href="#visit" className="no-underline">Visit</a>
        </div>
        <div className="grid gap-2 text-[15px] text-text-muted">
          <span>{settings.hours}</span>
          <span>{settings.addressLine2}</span>
          <span>★ {settings.rating} · {settings.reviewCount.toLocaleString("en-IN")}+ reviews</span>
        </div>
      </div>
      <div className="border-t border-roast-600">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-2 px-[clamp(16px,4vw,40px)] py-[18px] text-[13px] text-on-dark-faint">
          <span>
            © {new Date().getFullYear()} {settings.name}. We take orders {settings.hours}.
          </span>
          <span>
            Created by <span className="font-medium text-text-body">@deeppatel</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
