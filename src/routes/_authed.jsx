import { Outlet, createFileRoute } from "@tanstack/react-router";
import { AuthGateError, requireSignedIn } from "@/components/auth/AuthGate";
import { DEMO_USER, isDemo, refreshDemoIfStale } from "@/lib/demo";

export const Route = createFileRoute("/_authed")({
  ssr: false,
  // Demo visitors ("Explore Rozana") pass with a sample user; everyone else goes
  // through the unchanged login gate.
  beforeLoad: (args) => {
    if (!isDemo()) return requireSignedIn(args);
    refreshDemoIfStale();
    return { user: DEMO_USER };
  },
  errorComponent: AuthGateError,
  component: AuthedLayout,
});

function AuthedLayout() {
  return <Outlet />;
}