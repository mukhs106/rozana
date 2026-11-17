import { Link, useRouterState } from "@tanstack/react-router";
import { Monogram, RoughInk } from "@/components/Wordmark";
import { TodayIcon, RecipesIcon, PlanIcon, ProfileIcon } from "@/components/icons/AppIcons";
import { TodayIconFilled, RecipesIconFilled, PlanIconFilled, ProfileIconFilled } from "@/components/icons/NavIcons";
import { useAppName } from "@/hooks/useAppName";
import { useApplyTheme } from "@/hooks/useApplyTheme";
import { useReminders } from "@/hooks/useReminders";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/", label: "Today", Icon: TodayIcon, ActiveIcon: TodayIconFilled },
  { to: "/recipes", label: "Recipes", Icon: RecipesIcon, ActiveIcon: RecipesIconFilled },
  { to: "/plan", label: "Plan", Icon: PlanIcon, ActiveIcon: PlanIconFilled },
  { to: "/profile", label: "Profile", Icon: ProfileIcon, ActiveIcon: ProfileIconFilled },
];

function isActive(pathname, to) {
  return to === "/" ? pathname === "/" : pathname === to || pathname.startsWith(`${to}/`);
}

function BottomBar() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-background pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto grid w-full max-w-[460px] grid-cols-4 px-3">
        {TABS.map(({ to, label, Icon, ActiveIcon }) => {
          const active = isActive(pathname, to);
          const Mark = active ? ActiveIcon : Icon;
          return (
            <Link
              key={to}
              to={to}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-1 pb-3 pt-3 transition-colors",
                active ? "text-oxblood" : "text-ink-mid hover:text-ink",
              )}
            >
              <Mark className="h-[23px] w-[23px]" />
              <span className={cn("text-[11.5px]", active ? "font-semibold" : "font-medium")}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * The shared chrome: the oxblood R monogram alone in the top left, on the same
 * 20px gutter as the content, and the four-tab bar. One action shortcut lives
 * in Plan, not in the header.
 */
export default function AppShell({ children, nav = true, header, surface = "default" }) {
  const title = useAppName();
  useApplyTheme();
  useReminders();

  return (
    <div className={cn("min-h-screen text-ink", surface === "paper" ? "bg-paper" : "bg-background")}>
      <RoughInk />
      <header className="sticky top-0 z-20 border-b border-border bg-background">
        <div className="mx-auto flex h-[60px] w-full max-w-[460px] items-center gap-3 px-5">
          {header ?? (
            <Link to="/" aria-label={`${title} home`} className="-ml-[2px] flex h-11 items-center">
              <Monogram className="h-[30px] w-[30px]" />
            </Link>
          )}
        </div>
      </header>
      <main className="mx-auto w-full max-w-[460px] px-5 pb-32 pt-4">{children}</main>
      {nav ? <BottomBar /> : null}
    </div>
  );
}