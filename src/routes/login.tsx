import { createFileRoute, useNavigate, useRouterState } from "@tanstack/react-router";
import { DEMO_USERS, ROLE_LABEL, useAuth, type Role } from "@/lib/auth";
import { useEffect, useState } from "react";
import { ShieldCheck, LogIn } from "lucide-react";
import { Avatar } from "@/components/primitives";

export const Route = createFileRoute("/login")({ component: LoginPage });

const ROLE_DESC: Record<Role, string> = {
  admin: "Full platform access, user & report management, executive views.",
  mentor: "Assigned goalkeepers, log interactions, submit reports, upload media.",
  scout: "Submit scouting reports, add goalkeeper records, upload clips.",
  director: "Dashboards, intelligence and recommendations — read-only oversight.",
};

function LoginPage() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const search = useRouterState({ select: (s) => s.location.search as { redirect?: string } });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (user) navigate({ to: (search.redirect as never) ?? ("/" as never), replace: true });
  }, [user, navigate, search.redirect]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const u = DEMO_USERS.find((x) => x.email.toLowerCase() === email.toLowerCase());
    if (!u) return setErr("No account found for that email.");
    if (password.length < 4) return setErr("Enter a password (any 4+ characters for demo).");
    signIn(u.id);
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr] bg-background">
      <div className="hidden lg:flex flex-col justify-between p-10 bg-sidebar border-r border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-md bg-primary text-primary-foreground grid place-items-center font-bold">R</div>
          <div className="leading-tight">
            <div className="font-semibold tracking-tight">RPM</div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Refuel Performance Management</div>
          </div>
        </div>
        <div className="space-y-4 max-w-md">
          <h1 className="text-3xl font-semibold tracking-tight leading-tight">Goalkeeper intelligence, mentor operations and scouting — in one workspace.</h1>
          <p className="text-sm text-muted-foreground">Internal staff platform for mentors, scouts, analysts and management. Sign in to continue.</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4 text-primary" />Role-based access · Session managed locally for demo</div>
        </div>
        <div className="text-[11px] text-muted-foreground">© RPM Football Operations</div>
      </div>

      <div className="flex items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-md space-y-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Sign in</h2>
            <p className="text-sm text-muted-foreground mt-1">Use one of the demo accounts below, or sign in manually.</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full h-10 px-3 rounded-md bg-input/60 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" placeholder="name@rpm.gk" />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full h-10 px-3 rounded-md bg-input/60 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring/40" placeholder="••••••••" />
            </div>
            {err && <div className="text-xs text-destructive">{err}</div>}
            <button type="submit" className="w-full h-10 rounded-md bg-primary text-primary-foreground font-medium text-sm inline-flex items-center justify-center gap-2"><LogIn className="size-4" />Sign in</button>
          </form>

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center"><span className="px-2 bg-background text-[10px] uppercase tracking-wider text-muted-foreground">One-click demo</span></div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {DEMO_USERS.map((u) => (
              <button key={u.id} onClick={() => signIn(u.id)} className="flex items-center gap-3 p-3 rounded-md border border-border bg-card hover:bg-accent/40 transition-colors text-left">
                <Avatar initials={u.initials} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2"><span className="text-sm font-medium truncate">{u.name}</span><span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/30 font-medium uppercase tracking-wider">{ROLE_LABEL[u.role]}</span></div>
                  <div className="text-[11px] text-muted-foreground truncate">{ROLE_DESC[u.role]}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
