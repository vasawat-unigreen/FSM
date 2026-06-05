import { requirePermission } from "@/server/lib/auth";
import { prisma } from "@/server/lib/db";
import { t, roleTh } from "@/i18n";

export default async function SettingsPage() {
  const user = await requirePermission("settings", "read");

  // Tenant-scoped: only this tenant's users are ever loaded.
  const team = await prisma.user.findMany({
    where: { tenantId: user.tenantId, deletedAt: null },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, role: true, active: true },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{t.settings}</h1>
        <p className="text-sm text-foreground/60">{user.tenantName}</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium uppercase tracking-wide text-foreground/50">
          {t.team}
        </h2>
        <div className="overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-black/[.03] text-left text-foreground/60 dark:bg-white/[.03]">
              <tr>
                <th className="px-4 py-2 font-medium">{t.name}</th>
                <th className="px-4 py-2 font-medium">{t.email}</th>
                <th className="px-4 py-2 font-medium">{t.role}</th>
                <th className="px-4 py-2 font-medium">{t.status}</th>
              </tr>
            </thead>
            <tbody>
              {team.map((m) => (
                <tr
                  key={m.id}
                  className="border-t border-black/5 dark:border-white/5"
                >
                  <td className="px-4 py-2">{m.name}</td>
                  <td className="px-4 py-2 text-foreground/70">{m.email}</td>
                  <td className="px-4 py-2">{roleTh[m.role]}</td>
                  <td className="px-4 py-2">
                    {m.active ? t.active : t.inactive}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
