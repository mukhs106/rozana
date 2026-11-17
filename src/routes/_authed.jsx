import { Outlet, createFileRoute } from "@tanstack/react-router";
import { AuthGateError, requireSignedIn } from "@/components/auth/AuthGate";
import { DEMO_USER, isDemo } from "@/lib/demo";

export const Route = createFileRoute("/_authed")({
  ssr: false,
  // Demo visitors ("Explore Rozana") pass with a sample user; everyone else goes
  // through the unchanged login gate.
  beforeLoad: (args) => (isDemo() ? { user: DEMO_USER } : requireSignedIn(args)),
  errorComponent: AuthGateError,
  component: AuthedLayout,
});

function AuthedLayout() {
  return <Outlet />;
}