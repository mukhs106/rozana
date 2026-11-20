import { Lock, LogIn, Mail } from "lucide-react";
import { useState } from "react";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthError, AuthLink, GoogleButton, OrDivider, SubmitButton } from "@/components/auth/parts";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MfaFlow } from "@/components/auth/MfaFlow";
import { MfaScreen } from "@/components/auth/MfaParts";
import { loginWithMfa } from "@/lib/authMfa";
import { safeReturnTo } from "@/lib/authReturnTo";
import { enterDemo } from "@/lib/demo";
import { TESTING_MODE } from "@/lib/testing";

// The /login page. ?returnTo= (or the platform's ?from_url=) is where the visitor
// goes after signing in — the login gate and the MCP consent page send people here with it.
export function LoginPage() {
  const returnTo = safeReturnTo();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [mfaChallenge, setMfaChallenge] = useState(null);
  const [teamSignIn, setTeamSignIn] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const result = await loginWithMfa(email, password);
      if (result.mfa_required) {
        setMfaChallenge(result);
        return;
      }
      // A hard redirect: the app re-initializes with the new session.
      window.location.href = returnTo;
    } catch (err) {
      setError(err.message || "Invalid email or password");
      setBusy(false);
    }
  }

  // "Explore Rozana": sample data in this browser only, no account, no Base44 writes.
  function explore() {
    enterDemo();
    window.location.assign("/");
  }

  // The second sign-in step (authenticator app or text message) replaces the whole page.
  if (mfaChallenge) return <MfaScreen><MfaFlow challenge={mfaChallenge} returnTo={returnTo} /></MfaScreen>;

  const signInForm = (
    <>
      <GoogleButton returnTo={returnTo} onError={setError} />
      <OrDivider />
      <AuthError>{error}</AuthError>
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="login-email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="login-email" type="email" autoComplete="email" autoFocus placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 pl-10" required />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password">Password</Label>
            <AuthLink to="/forgot-password" returnTo={returnTo} className="text-small text-primary hover:underline">
              Forgot password?
            </AuthLink>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input id="login-password" type="password" autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 pl-10" required />
          </div>
        </div>
        <SubmitButton busy={busy} busyLabel="Logging in...">
          Log in
        </SubmitButton>
      </form>
    </>
  );

  const exploreButton = (
    <>
      <button
        type="button"
        onClick={explore}
        className="flex h-[52px] w-full items-center justify-center rounded-full bg-sand text-body font-semibold text-ink transition-colors hover:bg-sand/70"
      >
        Explore Rozana
      </button>
      <p className="mt-2 text-center text-small text-muted-foreground">
        Look around with a sample family of four. No details needed, nothing is saved to an account.
      </p>
    </>
  );

  // User testing: the demo comes first, sign-up is closed, and account sign-in
  // (for the team) sits behind a small link. See src/lib/testing.js.
  if (TESTING_MODE) {
    return (
      <AuthLayout icon={LogIn} title="Try Rozana" subtitle="Plan a week of meals for a sample family of four">
        {exploreButton}
        <div className="mt-8 text-center">
          {teamSignIn ? null : (
            <button type="button" onClick={() => setTeamSignIn(true)} className="text-small text-muted-foreground underline underline-offset-4">
              Team sign-in
            </button>
          )}
        </div>
        {teamSignIn ? <div className="mt-2">{signInForm}</div> : null}
      </AuthLayout>
    );
  }

  return (
    <AuthLayout icon={LogIn} title="Welcome back" subtitle="Log in to your account">
      {signInForm}
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don't have an account?{" "}
        <AuthLink to="/register" returnTo={returnTo}>
          Create one
        </AuthLink>
      </p>
      <div className="mt-6">
        <OrDivider />
      </div>
      {exploreButton}
    </AuthLayout>
  );
}
