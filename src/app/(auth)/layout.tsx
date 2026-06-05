import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center p-6">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="text-2xl font-semibold tracking-tight">FSM</div>
          <p className="text-sm text-foreground/60">
            ระบบจัดการงานบริการภาคสนาม
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
