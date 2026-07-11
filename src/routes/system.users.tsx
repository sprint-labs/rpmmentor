import { createFileRoute, Link } from "@tanstack/react-router";
import { useSyncExternalStore, useState } from "react";
import { ShieldCheck, ShieldOff, Users, RotateCcw, Search } from "lucide-react";
import { useAuth, ROLE_LABEL, type Role } from "@/lib/auth";
import { usersStore, type ManagedUser } from "@/lib/users-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/system/users")({ component: SystemUsersPage });

const ROLES: Role[] = ["super_admin", "admin", "mentor_manager", "mentor"];

const ROLE_TONE: Record<Role, string> = {
  super_admin: "bg-primary/15 text-primary border-primary/30",
  admin: "bg-accent text-accent-foreground border-border",
  mentor_manager: "bg-warning/15 text-warning border-warning/30",
  mentor: "bg-success/15 text-success border-success/30",
};

function SystemUsersPage() {
  const { user, can } = useAuth();
  const users = useSyncExternalStore(usersStore.subscribe, usersStore.list, usersStore.list);
  const [q, setQ] = useState("");

  if (!user || !can("system.manage")) {
    return (
      <div className="max-w-lg mx-auto mt-16 rounded-lg border border-border bg-card p-6 text-center">
        <ShieldOff className="size-8 mx-auto text-muted-foreground" />
        <h1 className="mt-3 text-lg font-semibold">Restricted</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Only Super Admins can manage users and roles.
        </p>
        <Link to="/" className="mt-4 inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const filtered = users.filter((u) =>
    !q.trim() ||
    u.name.toLowerCase().includes(q.toLowerCase()) ||
    u.email.toLowerCase().includes(q.toLowerCase()),
  );

  function changeRole(u: ManagedUser, role: Role) {
    if (role === u.role) return;
    usersStore.setRole(u.id, role);
    toast.success(`${u.name} → ${ROLE_LABEL[role]}`);
  }

  function toggleActive(u: ManagedUser) {
    usersStore.setActive(u.id, !u.active);
    toast(u.active ? `${u.name} deactivated` : `${u.name} reactivated`);
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" />
            <span className="text-[10px] uppercase tracking-wider font-medium text-primary">System · Super Admin</span>
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Users &amp; Roles</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Assign platform roles. Changes take effect on the user's next sign-in.
          </p>
        </div>
        <button
          onClick={() => { usersStore.reset(); toast("Reset to demo defaults"); }}
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-border text-xs font-medium hover:bg-accent"
        >
          <RotateCcw className="size-3.5" /> Reset to defaults
        </button>
      </div>

      <div className="relative max-w-sm">
        <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name or email…"
          className="w-full h-9 pl-9 pr-3 rounded-md bg-input/60 border border-border text-sm focus:outline-none focus:ring-2 focus:ring-ring/40"
        />
      </div>

      <div className="rounded-lg border border-border overflow-hidden bg-card">
        <div className="hidden md:grid grid-cols-[1fr_180px_180px_120px] gap-3 px-4 py-2.5 border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground font-medium bg-muted/30">
          <div>User</div>
          <div>Current role</div>
          <div>Assign role</div>
          <div className="text-right">Status</div>
        </div>
        <ul className="divide-y divide-border">
          {filtered.map((u) => {
            const isSelf = u.id === user.id;
            return (
              <li
                key={u.id}
                className={cn(
                  "grid md:grid-cols-[1fr_180px_180px_120px] gap-3 px-4 py-3 items-center",
                  !u.active && "opacity-60",
                )}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-8 rounded-full bg-accent grid place-items-center text-xs font-semibold shrink-0">
                    {u.initials}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate flex items-center gap-2">
                      {u.name}
                      {isSelf && <span className="text-[9px] uppercase tracking-wider text-muted-foreground">you</span>}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{u.email} · {u.title}</div>
                  </div>
                </div>
                <div>
                  <span className={cn("inline-flex h-6 px-2 items-center rounded border text-[10px] uppercase tracking-wider font-medium", ROLE_TONE[u.role])}>
                    {ROLE_LABEL[u.role]}
                  </span>
                </div>
                <div>
                  <select
                    value={u.role}
                    onChange={(e) => changeRole(u, e.target.value as Role)}
                    disabled={!u.active}
                    className="w-full h-9 px-2 rounded-md border border-border bg-input/60 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 disabled:opacity-50"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{ROLE_LABEL[r]}</option>
                    ))}
                  </select>
                </div>
                <div className="md:text-right">
                  <button
                    onClick={() => toggleActive(u)}
                    disabled={isSelf}
                    title={isSelf ? "You can't deactivate yourself" : undefined}
                    className={cn(
                      "inline-flex h-8 px-3 items-center rounded-md border text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed",
                      u.active
                        ? "border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/40"
                        : "border-success/40 bg-success/10 text-success",
                    )}
                  >
                    {u.active ? "Deactivate" : "Reactivate"}
                  </button>
                </div>
              </li>
            );
          })}
          {filtered.length === 0 && (
            <li className="px-4 py-10 text-center text-sm text-muted-foreground">
              <Users className="size-6 mx-auto mb-2 opacity-50" />
              No users match "{q}".
            </li>
          )}
        </ul>
      </div>

      <p className="text-xs text-muted-foreground">
        Prototype only — role changes are stored locally in this browser and are not synced to a backend.
      </p>
    </div>
  );
}
