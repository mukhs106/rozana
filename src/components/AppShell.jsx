import { Link, useRouteContext, useRouterState } from "@tanstack/react-router";
import { Info, Search } from "lucide-react";
import { useState } from "react";
import Wordmark, { Monogram, RoughInk } from "@/components/Wordmark";
import SearchSheet from "@/components/SearchSheet";
import { TodayIcon, RecipesIcon, PlanIcon, ShoppingListIcon } from "@/components/icons/AppIcons";
import { useAppName } from "@/hooks/useAppName";
import { useApplyTheme } from "@/hooks/useApplyTheme";
import { useIsDemo } from "@/hooks/useDemo";
import { useReminders } from "@/hooks/useReminders";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/", label: "Today", Icon: TodayIcon },
  { to: "/recipes", label: "Recipes", Icon: RecipesIcon },
  { to: "/plan", label: "Plan", Icon: PlanIcon },
  { to: "/groceries", label: "Groceries", Icon: ShoppingListIcon },
];

function isActive(pathname, to) {
  return to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(`${to}/`);
}

const iconButton =
  "flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-sand active:bg-sand";

function BottomBar() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_16px_rgba(26,22,20,0.04)]"
    >
      <div className="mx-auto grid w-full max-w-[460px] grid-cols-4 px-2">
        {TABS.map(({ to, label, Icon }) => {
          const active = isActive(pathname, to);
          return (
            <Link
              key={to}
              to={to}
              aria-current={active ? "page" : undefined}
              className="flex min-h-[64px] flex-col items-center justify-center gap-1 pb-2 pt-2"
            >
              <span
                className={cn(
                  "flex h-8 w-14 items-center justify-center rounded-full transition-colors",
                  active ? "bg-sand text-primary" : "text-ink-mid",
                )}
              >
                <Icon className="h-6 w-6" />
              </span>
              <span className={cn("text-small", active ? "font-semibold text-primary" : "font-medium text-ink-mid")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function initialOf(user) {
  const source = user?.full_name || user?.email || "R";
  return source.trim().charAt(0).toUpperCase();
}

function TopBar() {
  const title = useAppName();
  const demo = useIsDemo();
  const user = useRouteContext({ strict: false, select: (context) => context?.user });
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="mx-auto flex h-[60px] w-full max-w-[460px] items-center gap-1 pl-4 pr-3">
        <Link to="/" aria-label={`${title} home`} className="flex h-11 items-center gap-1.5 pr-2">
          <Monogram className="h-8 w-8 text-[28px]" />
          <Wordmark text={title} className="text-[26px]" />
        </Link>
        {demo ? (
          <span className="ml-1 rounded-full bg-sand px-2.5 py-0.5 text-small font-medium text-ink-mid">Demo</span>
        ) : null}

        <div className="ml-auto flex items-center">
          <button type="button" aria-label="Search recipes" onClick={() => setSearchOpen(true)} className={iconButton}>
            <Search className="h-[22px] w-[22px]" strokeWidth={2} />
          </button>
          <Link to="/info/$topic" params={{ topic: "our-story" }} aria-label="Our story" className={iconButton}>
            <Info className="h-[22px] w-[22px]" strokeWidth={2} />
          </Link>
          <Link to="/profile" aria-label="Profile and settings" className="flex h-11 w-11 items-center justify-center">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-body font-semibold text-primary-foreground">
              {initialOf(user)}
            </span>
          </Link>
        </div>
      </div>
      <SearchSheet open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}

/**
 * The shared chrome: top bar (logo; search, our story, profile avatar) and the
 * four labelled tabs. `header` replaces the top bar for screens with their own.
 */
export default function AppShell({ children, nav = true, header, surface = "default" }) {
  useApplyTheme();
  useReminders();

  return (
    <div className={cn("min-h-screen text-ink", surface === "paper" ? "bg-paper" : "bg-background")}>
      <RoughInk />
      {header ? (
        <header className="sticky top-0 z-20 bg-background">
          <div className="mx-auto flex h-[60px] w-full max-w-[460px] items-center gap-3 px-5">{header}</div>
        </header>
      ) : (
        <TopBar />
      )}
      <main className={cn("mx-auto w-full max-w-[460px] px-5 pt-4", nav ? "pb-32" : "pb-16")}>{children}</main>
      {nav ? <BottomBar /> : null}
    </div>
  );
}
