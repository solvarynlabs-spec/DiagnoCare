import { AppShell } from "@/components/shell/app-shell";
import { requireUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function Layout({ children }: { children: React.ReactNode }) {
  const user = await requireUser({ roles: ["PLATFORM_ADMIN"] });
  return <AppShell user={user}>{children}</AppShell>;
}
