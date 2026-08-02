import Link from "next/link";

export function Header({ cafeName }: { cafeName: string }) {
  return (
    <header data-surface="roast" className="sticky top-0 z-40 border-b border-roast-600 bg-roast-950">
      <div className="mx-auto flex max-w-[1200px] items-center gap-6 px-[clamp(16px,4vw,40px)] py-3.5 sm:gap-8">
        <Link href="#top" className="t-display-xs shrink-0">
          {cafeName}
        </Link>
        <nav className="ml-auto hidden items-center gap-6 sm:flex sm:gap-7">
          <a href="#menu" className="t-body-sm text-text-body no-underline hover:text-text">
            Menu
          </a>
          <a href="#ordering" className="t-body-sm text-text-body no-underline hover:text-text">
            Table ordering
          </a>
          <a href="#visit" className="t-body-sm text-text-body no-underline hover:text-text">
            Visit
          </a>
        </nav>
        <Link
          href="/scan"
          className="ml-auto flex h-11 shrink-0 items-center rounded-md bg-accent px-5 text-[15px] font-semibold text-on-primary no-underline sm:ml-0"
        >
          Scan &amp; order
        </Link>
      </div>
    </header>
  );
}
