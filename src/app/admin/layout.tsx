import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/admin/app-sidebar";
import { Bell, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { getInitials } from "@/lib/utils";

const ADMIN_ROLES = ["admin", "super_admin"];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) redirect("/login");
  if (!ADMIN_ROLES.includes(session.user.role ?? "customer")) redirect("/");

  const { user } = session;

  return (
    <SidebarProvider>
      <AppSidebar user={user} />
      <div className="flex-1 flex flex-col min-h-screen bg-muted/20 overflow-hidden w-full">
        {/* Admin Header */}
        <header className="h-14 lg:h-16 border-b bg-background/80 backdrop-blur flex items-center justify-between px-4 sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <SidebarTrigger />
            <div className="hidden sm:flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <h1 className="font-heading font-semibold">Back-Office</h1>
              <span className="text-xs text-muted-foreground">· si4care</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/reports">
              <Button variant="outline" size="sm" className="gap-2 hidden sm:flex h-8">
                <BarChart2 className="h-4 w-4" /> Laporan
              </Button>
            </Link>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifikasi">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full" />
            </Button>
            <div className="flex items-center gap-2 rounded-full border bg-card py-1 pl-1 pr-3">
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs text-primary">
                {getInitials(user.name)}
              </div>
              <span className="text-sm font-medium hidden sm:block">{user.name}</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
