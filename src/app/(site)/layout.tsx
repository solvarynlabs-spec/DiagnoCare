import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { getCurrentUser } from "@/lib/auth/session";
import { ROLE_META, type RoleKey } from "@/lib/rbac";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  return (
    <>
      <SiteHeader signedIn={!!user} home={user ? ROLE_META[user.roleKey as RoleKey]?.home ?? "/app" : "/login"} />
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}
