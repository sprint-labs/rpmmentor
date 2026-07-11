import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { useEffect, useState } from "react";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Lock, Mail } from "lucide-react";

export const Route = createFileRoute("/login")({ component: LoginPage });

type View = "signin" | "forgot" | "sent";

function LoginPage() {
  const { user, signInByEmail } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<View>("signin");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [resetEmail, setResetEmail] = useState("");
  const [sentTo, setSentTo] = useState("");

  useEffect(() => {
    if (user) navigate({ to: "/", replace: true });
  }, [user, navigate]);

  function handleSignIn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      return;
    }
    setSubmitting(true);
    // Mock auth: any password is accepted for a known @gkhq.app email.
    window.setTimeout(() => {
      const u = signInByEmail(email);
      if (!u) {
        setSubmitting(false);
        setError("No account found for that email address.");
        return;
      }
      // navigate happens via effect when user is set
    }, 250);
  }

  function handleForgotSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setSentTo(resetEmail.trim());
    setResetEmail("");
    setView("sent");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="flex items-center gap-2.5 mb-10">
          <div className="size-9 rounded-lg bg-primary text-primary-foreground grid place-items-center font-bold text-sm tracking-tight">
            GK
          </div>
          <div className="leading-tight">
            <div className="font-semibold tracking-tight text-lg">GKHQ</div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Goalkeeper Head Quarters</div>
          </div>
        </div>

        {view === "signin" && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-semibold tracking-tight leading-tight">Sign in</h1>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                Use your <span className="text-foreground font-medium">@gkhq.app</span> account to access the platform.
              </p>
            </div>

            <form onSubmit={handleSignIn} className="space-y-4" noValidate>
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-foreground mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="size-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    autoFocus
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(null); }}
                    placeholder="lcorrigan@gkhq.app"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-xs font-medium text-foreground">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setView("forgot")}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="size-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="password"
                    type={showPw ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(null); }}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-muted-foreground select-none cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="size-3.5 rounded border-border accent-primary"
                />
                Keep me signed in on this device
              </label>

              {error && (
                <div className="text-xs text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60"
              >
                {submitting ? "Signing in…" : "Sign in"}
              </button>
            </form>

            <p className="text-[11px] text-muted-foreground mt-8 leading-relaxed">
              Accounts are provisioned by your Super Admin. If you need access, contact{" "}
              <span className="text-foreground font-medium">lcorrigan@gkhq.app</span>.
            </p>
          </>
        )}

        {view === "forgot" && (
          <>
            <div className="mb-8">
              <h1 className="text-3xl font-semibold tracking-tight leading-tight">Reset your password</h1>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                Enter your <span className="text-foreground font-medium">@gkhq.app</span> address and we'll send you a link to reset your password.
              </p>
            </div>

            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div>
                <label htmlFor="reset-email" className="block text-xs font-medium text-foreground mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="size-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    id="reset-email"
                    type="email"
                    required
                    autoFocus
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="you@gkhq.app"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Send reset link
              </button>

              <button
                type="button"
                onClick={() => setView("signin")}
                className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="size-3.5" />
                Back to sign in
              </button>
            </form>
          </>
        )}

        {view === "sent" && (
          <>
            <div className="mb-8">
              <div className="size-12 rounded-xl bg-secondary grid place-items-center mb-5">
                <CheckCircle2 className="size-6 text-primary" />
              </div>
              <h1 className="text-3xl font-semibold tracking-tight leading-tight">Check your inbox</h1>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                If an account exists for <span className="text-foreground font-medium">{sentTo}</span>, you'll receive an email with instructions to reset your password shortly.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setView("signin")}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-border bg-card hover:bg-accent/30 text-sm font-medium transition-colors"
            >
              <ArrowLeft className="size-4" />
              Back to sign in
            </button>
          </>
        )}
      </div>
    </div>
  );
}
