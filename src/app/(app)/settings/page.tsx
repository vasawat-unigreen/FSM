import { requirePermission } from "@/server/lib/auth";
import { can } from "@/server/lib/rbac";
import { getTaxRate } from "@/server/lib/tenant";
import { listTeam } from "@/server/modules/settings/settings.service";
import {
  setRoleAction,
  setActiveAction,
} from "@/server/modules/settings/actions";
import { PageHeader, Card } from "@/components/ui/primitives";
import { t, roleTh } from "@/i18n";
import type { UserRole } from "@/generated/prisma/client";
import { TaxForm, AddMemberForm } from "./settings-forms";

const ROLES: UserRole[] = [
  "OWNER",
  "ADMIN",
  "DISPATCHER",
  "TECHNICIAN",
  "ACCOUNTANT",
  "READ_ONLY",
];

export default async function SettingsPage() {
  const ctx = await requirePermission("settings", "read");
  const [taxRate, team] = await Promise.all([getTaxRate(ctx), listTeam(ctx)]);
  const canEditSettings = can(ctx.role, "settings", "update");
  const canManageUsers = can(ctx.role, "user", "update");

  return (
    <div className="space-y-6">
      <PageHeader title={t.settings} subtitle={ctx.tenantName} />

      {canEditSettings && (
        <Card title={t.admin.businessSettings}>
          <TaxForm taxPercent={Math.round(taxRate * 10000) / 100} />
        </Card>
      )}

      <Card title={t.team}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-foreground/60">
              <tr>
                <th className="px-2 py-2 font-medium">{t.name}</th>
                <th className="px-2 py-2 font-medium">{t.email}</th>
                <th className="px-2 py-2 font-medium">{t.admin.changeRole}</th>
                <th className="px-2 py-2 font-medium">{t.status}</th>
              </tr>
            </thead>
            <tbody>
              {team.map((m) => {
                const isSelf = m.id === ctx.userId;
                return (
                  <tr key={m.id} className="border-t border-black/5 dark:border-white/5">
                    <td className="px-2 py-2">
                      {m.name}
                      {isSelf && (
                        <span className="ml-1 text-xs text-foreground/40">
                          {t.admin.you}
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-foreground/70">{m.email}</td>
                    <td className="px-2 py-2">
                      {canManageUsers && !isSelf ? (
                        <form action={setRoleAction} className="flex items-center gap-1">
                          <input type="hidden" name="userId" value={m.id} />
                          <select
                            name="role"
                            defaultValue={m.role}
                            className="rounded-md border border-black/15 bg-transparent px-2 py-1 text-sm dark:border-white/20"
                          >
                            {ROLES.map((r) => (
                              <option key={r} value={r}>
                                {roleTh[r]}
                              </option>
                            ))}
                          </select>
                          <button className="rounded-md border border-black/15 px-2 py-1 text-xs hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10">
                            OK
                          </button>
                        </form>
                      ) : (
                        roleTh[m.role]
                      )}
                    </td>
                    <td className="px-2 py-2">
                      {canManageUsers && !isSelf ? (
                        <form action={setActiveAction}>
                          <input type="hidden" name="userId" value={m.id} />
                          <input
                            type="hidden"
                            name="active"
                            value={(!m.active).toString()}
                          />
                          <button className="text-xs underline text-foreground/60 hover:text-foreground">
                            {m.active ? t.admin.deactivate : t.admin.activate}
                          </button>
                        </form>
                      ) : m.active ? (
                        t.active
                      ) : (
                        t.inactive
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {canManageUsers && (
          <div className="mt-4 border-t border-black/5 pt-4 dark:border-white/5">
            <AddMemberForm />
          </div>
        )}
      </Card>
    </div>
  );
}
