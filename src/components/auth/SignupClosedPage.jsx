import { UserPlus } from "lucide-react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { enterDemo } from "@/lib/demo";

// Shown at /register while TESTING_MODE is on (src/lib/testing.js): no new accounts
// during user testing, so no personal or allergy details reach the backend.
export function SignupClosedPage() {
  function explore() {
    enterDemo();
    window.location.assign("/");
  }

  return (
    <AuthLayout icon={UserPlus} title="Sign-up is closed for now" subtitle="We're testing Rozana with sample data only">
      <p className="mb-6 text-center text-body text-foreground">
        You can try everything with a sample family of four. Nothing you do there leaves this browser.
      </p>
      <button
        type="button"
        onClick={explore}
        className="flex h-[52px] w-full items-center justify-center rounded-full bg-sand text-body font-semibold text-ink transition-colors hover:bg-sand/70"
      >
        Explore Rozana
      </button>
    </AuthLayout>
  );
}
