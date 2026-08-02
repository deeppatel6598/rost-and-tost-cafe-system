import { cn } from "@/lib/cn";

/**
 * Bundled SVG illustrations standing in for real food photography — one
 * artwork per dish archetype, so every screen looks finished before a real
 * shoot happens. Swapping in real photos later is just setting `photoUrl` on
 * the menu item; these are only drawn when no photo exists.
 *
 * Deliberately self-contained (no external image URLs) so nothing depends on
 * a CDN staying up.
 */
export type FoodArtKey =
  | "espresso"
  | "latte"
  | "icedcoffee"
  | "frappe"
  | "chai"
  | "icedtea"
  | "greentea"
  | "croissant"
  | "cinnamonroll"
  | "toast"
  | "avocadotoast"
  | "omelette"
  | "granola"
  | "pizza"
  | "toastie"
  | "bao"
  | "pasta"
  | "nachos"
  | "cheesecake"
  | "brownie"
  | "mousse";

const BY_ITEM: Record<string, FoodArtKey> = {
  cortado: "espresso",
  pourover: "latte",
  tonic: "icedcoffee",
  frappe: "frappe",
  "masala-chai": "chai",
  "peach-iced-tea": "icedtea",
  "green-tea": "greentea",
  croissant: "croissant",
  roll: "cinnamonroll",
  toast: "toast",
  "avocado-toast": "avocadotoast",
  omelette: "omelette",
  "granola-bowl": "granola",
  margherita: "pizza",
  "pesto-pizza": "pizza",
  "chicken-pizza": "pizza",
  toastie: "toastie",
  "chicken-toastie": "toastie",
  bao: "bao",
  pasta: "pasta",
  nachos: "nachos",
  basque: "cheesecake",
  brownie: "brownie",
  "gulab-mousse": "mousse",
};

const BY_CATEGORY: Record<string, FoodArtKey> = {
  coffee: "latte",
  tea: "chai",
  bakery: "croissant",
  breakfast: "omelette",
  pizza: "pizza",
  plates: "pasta",
  desserts: "cheesecake",
};

export function artKeyFor(itemId: string, categoryId: string): FoodArtKey {
  return BY_ITEM[itemId] ?? BY_CATEGORY[categoryId] ?? "latte";
}

const BG: Record<FoodArtKey, [string, string]> = {
  espresso: ["#3b2a21", "#1c1411"],
  latte: ["#4a3527", "#201712"],
  icedcoffee: ["#2f3b3a", "#141b1b"],
  frappe: ["#4a3a2e", "#1e1712"],
  chai: ["#4a3320", "#1f1610"],
  icedtea: ["#4d3a1c", "#1f1810"],
  greentea: ["#2d3d2c", "#141a13"],
  croissant: ["#4d3a20", "#211810"],
  cinnamonroll: ["#4a331f", "#1f150e"],
  toast: ["#463320", "#1f1810"],
  avocadotoast: ["#33421f", "#161c0e"],
  omelette: ["#4d401c", "#1f1a0d"],
  granola: ["#413320", "#1b1610"],
  pizza: ["#4a2b1e", "#1f120d"],
  toastie: ["#46331f", "#1f1810"],
  bao: ["#3d3a33", "#1a1917"],
  pasta: ["#334227", "#161c11"],
  nachos: ["#4a3a1c", "#1f1810"],
  cheesecake: ["#4a3722", "#1f1710"],
  brownie: ["#3a271c", "#18100b"],
  mousse: ["#43273a", "#1b1018"],
};

function Shape({ art }: { art: FoodArtKey }) {
  switch (art) {
    case "espresso":
      return (
        <>
          <ellipse cx="60" cy="76" rx="26" ry="4" fill="#000" opacity=".35" />
          <path d="M34 44h44v18a22 22 0 0 1-22 22h0a22 22 0 0 1-22-22V44Z" fill="#f3ece3" />
          <path d="M78 48h6a9 9 0 0 1 0 18h-6" fill="none" stroke="#f3ece3" strokeWidth="4" />
          <ellipse cx="56" cy="47" rx="20" ry="6" fill="#8b5a3c" />
          <ellipse cx="56" cy="46" rx="13" ry="3.6" fill="#c89a72" />
          <path d="M46 30c0 4-4 4-4 8M58 28c0 4-4 4-4 8" stroke="#d8cfc2" strokeWidth="2.5" strokeLinecap="round" opacity=".5" fill="none" />
        </>
      );
    case "latte":
      return (
        <>
          <ellipse cx="60" cy="80" rx="24" ry="4" fill="#000" opacity=".35" />
          <path d="M38 34h40l-5 42a10 10 0 0 1-10 9H53a10 10 0 0 1-10-9L38 34Z" fill="#f5efe6" />
          <ellipse cx="58" cy="36" rx="20" ry="6" fill="#c19a72" />
          <path d="M58 33c4 3 4 7 0 10s-4 7 0 10" stroke="#8b5a3c" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M48 22c0 3-3 3-3 6M62 20c0 3-3 3-3 6" stroke="#d8cfc2" strokeWidth="2.5" strokeLinecap="round" opacity=".45" fill="none" />
        </>
      );
    case "icedcoffee":
      return (
        <>
          <ellipse cx="60" cy="84" rx="22" ry="4" fill="#000" opacity=".35" />
          <path d="M42 26h36l-5 54a8 8 0 0 1-8 7H55a8 8 0 0 1-8-7L42 26Z" fill="#241a14" opacity=".8" />
          <path d="M44 40h32l-4 40a6 6 0 0 1-6 5H54a6 6 0 0 1-6-5l-4-40Z" fill="#6b4526" />
          <rect x="50" y="46" width="12" height="12" rx="2" fill="#cfe6ea" opacity=".7" transform="rotate(-12 56 52)" />
          <rect x="61" y="58" width="11" height="11" rx="2" fill="#cfe6ea" opacity=".55" transform="rotate(18 66 64)" />
          <rect x="68" y="16" width="4" height="30" rx="2" fill="#e6dfd8" transform="rotate(12 70 30)" />
        </>
      );
    case "frappe":
      return (
        <>
          <ellipse cx="60" cy="84" rx="22" ry="4" fill="#000" opacity=".35" />
          <path d="M43 34h34l-4 48a8 8 0 0 1-8 7H55a8 8 0 0 1-8-7l-4-48Z" fill="#8a6039" />
          <path d="M45 52h30l-3 30a6 6 0 0 1-6 5H54a6 6 0 0 1-6-5l-3-30Z" fill="#6b4326" />
          <path d="M40 34c4-10 36-10 40 0-6 5-34 5-40 0Z" fill="#f7f1e8" />
          <ellipse cx="60" cy="27" rx="13" ry="7" fill="#fbf7f0" />
          <ellipse cx="60" cy="21" rx="8" ry="5" fill="#fffdf8" />
          <circle cx="60" cy="16" r="3" fill="#8b3a2a" />
          <rect x="70" y="8" width="4" height="26" rx="2" fill="#cc785c" transform="rotate(14 72 20)" />
        </>
      );
    case "chai":
      return (
        <>
          <ellipse cx="60" cy="78" rx="26" ry="4" fill="#000" opacity=".35" />
          <path d="M32 46h44v14a20 20 0 0 1-20 20h-4a20 20 0 0 1-20-20V46Z" fill="#f0e8dc" />
          <path d="M76 50h6a8 8 0 0 1 0 16h-6" fill="none" stroke="#f0e8dc" strokeWidth="4" />
          <ellipse cx="54" cy="48" rx="20" ry="5.5" fill="#c08a52" />
          <ellipse cx="54" cy="47" rx="12" ry="3" fill="#dcae7c" />
          <path d="M44 30c0 4-4 4-4 8M56 28c0 4-4 4-4 8M66 32c0 3-3 3-3 6" stroke="#d8cfc2" strokeWidth="2.5" strokeLinecap="round" opacity=".45" fill="none" />
        </>
      );
    case "icedtea":
      return (
        <>
          <ellipse cx="60" cy="84" rx="21" ry="4" fill="#000" opacity=".35" />
          <path d="M43 28h34l-4 54a8 8 0 0 1-8 7H55a8 8 0 0 1-8-7l-4-54Z" fill="#c47a20" opacity=".5" />
          <path d="M45 44h30l-3 38a6 6 0 0 1-6 5H54a6 6 0 0 1-6-5l-3-38Z" fill="#d98f2c" opacity=".85" />
          <rect x="50" y="50" width="12" height="12" rx="2" fill="#fff3d9" opacity=".55" transform="rotate(-14 56 56)" />
          <rect x="61" y="63" width="10" height="10" rx="2" fill="#fff3d9" opacity=".45" transform="rotate(20 66 68)" />
          <path d="M78 30a12 12 0 0 0-12 10 12 12 0 0 0 12-10Z" fill="#7fae5a" />
        </>
      );
    case "greentea":
      return (
        <>
          <ellipse cx="60" cy="76" rx="24" ry="4" fill="#000" opacity=".35" />
          <path d="M36 44h48v12a22 22 0 0 1-22 22h-4a22 22 0 0 1-22-22V44Z" fill="#eef0e6" />
          <ellipse cx="60" cy="46" rx="22" ry="6" fill="#94ab5c" />
          <ellipse cx="60" cy="45" rx="14" ry="3.4" fill="#b6c983" />
          <path d="M84 28c-8 1-13 6-14 14 8-1 13-6 14-14Z" fill="#6f8f47" />
          <path d="M48 28c0 4-4 4-4 8M60 26c0 4-4 4-4 8" stroke="#d8cfc2" strokeWidth="2.5" strokeLinecap="round" opacity=".4" fill="none" />
        </>
      );
    case "croissant":
      return (
        <>
          <ellipse cx="60" cy="76" rx="32" ry="5" fill="#000" opacity=".35" />
          <path d="M24 62c2-18 16-30 36-30s34 12 36 30c-8 6-20 9-36 9s-28-3-36-9Z" fill="#d8a25c" />
          <path d="M40 58c1-11 7-18 14-21M60 55c0-12 3-19 8-22M78 58c-1-11-4-17-8-20" stroke="#b97f3d" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <circle cx="46" cy="47" r="1.8" fill="#f0d6a8" />
          <circle cx="66" cy="44" r="1.8" fill="#f0d6a8" />
          <circle cx="76" cy="52" r="1.6" fill="#f0d6a8" />
        </>
      );
    case "cinnamonroll":
      return (
        <>
          <ellipse cx="60" cy="80" rx="28" ry="5" fill="#000" opacity=".35" />
          <circle cx="60" cy="54" r="28" fill="#c98b4b" />
          <circle cx="60" cy="54" r="20" fill="none" stroke="#a8682f" strokeWidth="5" strokeDasharray="60 22" />
          <circle cx="60" cy="54" r="11" fill="#dfa863" />
          <circle cx="60" cy="54" r="4" fill="#a8682f" />
          <path d="M38 44c8-6 36-6 44 0-4 6-40 6-44 0Z" fill="#f6efe2" opacity=".9" />
        </>
      );
    case "toast":
      return (
        <>
          <ellipse cx="60" cy="80" rx="28" ry="5" fill="#000" opacity=".35" />
          <path d="M32 40c0-10 8-16 28-16s28 6 28 16v28a6 6 0 0 1-6 6H38a6 6 0 0 1-6-6V40Z" fill="#d9ab6a" />
          <path d="M38 44c0-7 6-11 22-11s22 4 22 11v22H38V44Z" fill="#e9c78e" />
          <rect x="50" y="42" width="20" height="14" rx="3" fill="#f5e2a8" transform="rotate(-8 60 49)" />
        </>
      );
    case "avocadotoast":
      return (
        <>
          <ellipse cx="60" cy="80" rx="28" ry="5" fill="#000" opacity=".35" />
          <path d="M32 42c0-10 8-16 28-16s28 6 28 16v26a6 6 0 0 1-6 6H38a6 6 0 0 1-6-6V42Z" fill="#d9ab6a" />
          <path d="M37 46c0-7 7-11 23-11s23 4 23 11v18H37V46Z" fill="#7ea653" />
          <circle cx="49" cy="52" r="5" fill="#94bd66" />
          <circle cx="63" cy="49" r="5.5" fill="#94bd66" />
          <circle cx="74" cy="55" r="4.5" fill="#94bd66" />
          <circle cx="56" cy="59" r="1.6" fill="#c94a32" />
          <circle cx="69" cy="60" r="1.6" fill="#c94a32" />
        </>
      );
    case "omelette":
      return (
        <>
          <ellipse cx="60" cy="78" rx="30" ry="5" fill="#000" opacity=".35" />
          <path d="M30 58c0-16 13-26 30-26s30 10 30 26c0 6-13 10-30 10s-30-4-30-10Z" fill="#e8c458" />
          <path d="M40 52c4-8 12-12 20-12" stroke="#f3dd93" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M52 62c6 2 14 2 20 0" stroke="#c69d31" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <path d="M74 44c3 2 5 5 6 8" stroke="#5f8f43" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </>
      );
    case "granola":
      return (
        <>
          <ellipse cx="60" cy="80" rx="28" ry="5" fill="#000" opacity=".35" />
          <path d="M30 46h60c0 18-13 30-30 30S30 64 30 46Z" fill="#f2ece0" />
          <path d="M34 47h52c-1 6-4 11-8 15H42c-4-4-7-9-8-15Z" fill="#c79a5e" />
          <circle cx="46" cy="52" r="3.4" fill="#a4763f" />
          <circle cx="57" cy="55" r="3" fill="#b98a4d" />
          <circle cx="68" cy="51" r="3.4" fill="#a4763f" />
          <circle cx="76" cy="55" r="2.6" fill="#b98a4d" />
          <circle cx="52" cy="49" r="3" fill="#c2455a" />
          <circle cx="72" cy="60" r="3" fill="#7b3f8f" />
        </>
      );
    case "pizza":
      return (
        <>
          <ellipse cx="60" cy="80" rx="32" ry="5" fill="#000" opacity=".35" />
          <circle cx="60" cy="52" r="32" fill="#dba75f" />
          <circle cx="60" cy="52" r="26" fill="#c4472f" />
          <circle cx="49" cy="45" r="6" fill="#f5efe0" />
          <circle cx="70" cy="47" r="5" fill="#f5efe0" />
          <circle cx="57" cy="63" r="5.5" fill="#f5efe0" />
          <circle cx="72" cy="62" r="4" fill="#f5efe0" />
          <path d="M45 57c2-3 5-4 7-2" stroke="#4f8b3d" strokeWidth="2.6" fill="none" strokeLinecap="round" />
          <path d="M64 40c2-3 5-3 7-1" stroke="#4f8b3d" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        </>
      );
    case "toastie":
      return (
        <>
          <ellipse cx="60" cy="80" rx="30" ry="5" fill="#000" opacity=".35" />
          <path d="M26 66 48 26h24l22 40-12 10H38l-12-10Z" fill="#d9a95f" />
          <path d="M38 62 52 34h16l14 28-8 6H46l-8-6Z" fill="#eccb90" />
          <path d="M44 56h32l-4 8H48l-4-8Z" fill="#e0a83a" />
          <circle cx="55" cy="47" r="3" fill="#8e5a37" />
          <circle cx="67" cy="50" r="3" fill="#8e5a37" />
        </>
      );
    case "bao":
      return (
        <>
          <ellipse cx="60" cy="80" rx="30" ry="5" fill="#000" opacity=".35" />
          <path d="M28 66c0-16 10-26 22-26s20 10 20 26c0 5-9 8-21 8s-21-3-21-8Z" fill="#f4f0e7" />
          <path d="M50 66c0-16 10-26 22-26s20 10 20 26c0 5-9 8-21 8s-21-3-21-8Z" fill="#efeade" />
          <path d="M34 62c6-3 26-3 32 0" stroke="#d5cec0" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <path d="M56 62c6-3 26-3 32 0" stroke="#d5cec0" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <path d="M38 54c4-6 16-6 20 0" stroke="#c9762f" strokeWidth="3.4" fill="none" strokeLinecap="round" />
          <path d="M60 54c4-6 16-6 20 0" stroke="#c9762f" strokeWidth="3.4" fill="none" strokeLinecap="round" />
        </>
      );
    case "pasta":
      return (
        <>
          <ellipse cx="60" cy="80" rx="32" ry="5" fill="#000" opacity=".35" />
          <path d="M28 56c0-14 14-24 32-24s32 10 32 24c0 8-14 14-32 14s-32-6-32-14Z" fill="#f2eee4" />
          <path d="M36 55c0-11 11-18 24-18s24 7 24 18c0 6-11 10-24 10s-24-4-24-10Z" fill="#8fae53" />
          <path d="M43 54c6-4 12-5 18-3M50 60c6-3 14-4 20-2M46 48c7-4 16-5 23-2" stroke="#c9d98f" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <circle cx="55" cy="50" r="3.4" fill="#c94a32" />
          <circle cx="70" cy="56" r="3" fill="#c94a32" />
        </>
      );
    case "nachos":
      return (
        <>
          <ellipse cx="60" cy="80" rx="30" ry="5" fill="#000" opacity=".35" />
          <path d="M30 60h60c-2 10-14 16-30 16S32 70 30 60Z" fill="#f0ece2" />
          <path d="M34 60 44 44l10 16H34Z" fill="#e6bc6a" />
          <path d="M42 58 52 32l14 24-24 2Z" fill="#e0b45e" />
          <path d="M58 58 72 36l12 22-26 0Z" fill="#d8a94f" />
          <circle cx="52" cy="52" r="3" fill="#4f8b3d" />
          <circle cx="70" cy="50" r="3" fill="#c94a32" />
          <circle cx="61" cy="57" r="3.4" fill="#f7f3e8" />
        </>
      );
    case "cheesecake":
      return (
        <>
          <ellipse cx="60" cy="80" rx="28" ry="5" fill="#000" opacity=".35" />
          <path d="M34 70V46c0-9 12-14 26-14s26 5 26 14v24c0 4-12 6-26 6s-26-2-26-6Z" fill="#f0d9a8" />
          <path d="M34 46c0-9 12-14 26-14s26 5 26 14c0 6-12 9-26 9s-26-3-26-9Z" fill="#7d4a26" />
          <path d="M40 44c6-4 34-4 40 0" stroke="#5d3319" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          <path d="M34 66c8 4 44 4 52 0" stroke="#dcc189" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </>
      );
    case "brownie":
      return (
        <>
          <ellipse cx="60" cy="80" rx="28" ry="5" fill="#000" opacity=".35" />
          <path d="M32 44h56v26a6 6 0 0 1-6 6H38a6 6 0 0 1-6-6V44Z" fill="#4a2a1a" />
          <path d="M32 44c0-6 12-10 28-10s28 4 28 10c0 5-12 8-28 8s-28-3-28-8Z" fill="#6b3d24" />
          <circle cx="47" cy="43" r="3" fill="#a8763f" />
          <circle cx="63" cy="41" r="3.4" fill="#a8763f" />
          <circle cx="76" cy="44" r="2.6" fill="#a8763f" />
          <path d="M38 58c8 3 36 3 44 0" stroke="#31190f" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </>
      );
    case "mousse":
    default:
      return (
        <>
          <ellipse cx="60" cy="82" rx="24" ry="4" fill="#000" opacity=".35" />
          <path d="M42 50h36l-4 24a7 7 0 0 1-7 6H53a7 7 0 0 1-7-6l-4-24Z" fill="#c17ba8" />
          <ellipse cx="60" cy="50" rx="18" ry="6" fill="#d99bc0" />
          <ellipse cx="60" cy="44" rx="11" ry="6" fill="#f2e2ea" />
          <circle cx="60" cy="38" r="4" fill="#a8456f" />
          <circle cx="52" cy="42" r="1.8" fill="#7fae5a" />
          <circle cx="68" cy="43" r="1.8" fill="#7fae5a" />
        </>
      );
  }
}

export function FoodArt({ art, className }: { art: FoodArtKey; className?: string }) {
  const [from, to] = BG[art];
  const gradId = `fa-${art}`;
  return (
    <svg
      viewBox="0 0 120 100"
      className={cn("h-full w-full", className)}
      preserveAspectRatio="xMidYMid slice"
      role="presentation"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      <rect width="120" height="100" fill={`url(#${gradId})`} />
      <Shape art={art} />
    </svg>
  );
}
