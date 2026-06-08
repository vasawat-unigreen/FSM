// Public customer portal — no authentication. Reached via a secret approval
// token link sent to the customer.
export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-2xl p-6">
      <div className="mb-6 text-center">
        <div className="text-xl font-semibold tracking-tight">FSM</div>
        <p className="text-sm text-foreground/60">ระบบจัดการงานบริการภาคสนาม</p>
      </div>
      {children}
    </div>
  );
}
