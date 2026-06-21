"use client";

import {
  ShoppingCart, LayoutDashboard, Package, RefreshCcw, Store, Settings,
  LogOut, Bell, BarChart2, PackagePlus, Ticket, FileText, HelpCircle, ChevronRight,
  FolderOpen, ClipboardCheck, MessageSquare,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { getInitials } from "@/lib/utils";

type NavItem = { title: string; url: string; icon: typeof LayoutDashboard; badge?: number; tone?: "primary" | "alert" };

const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Operasional",
    items: [
      { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
      { title: "Kasir (POS)", url: "/admin/pos", icon: ShoppingCart },
      { title: "Pesanan Web", url: "/admin/orders", icon: RefreshCcw, badge: 3, tone: "primary" },
      { title: "Marketplace", url: "/admin/marketplace", icon: Store, badge: 4, tone: "alert" },
      { title: "Retur", url: "/admin/returns", icon: RefreshCcw },
      { title: "Pesan", url: "/admin/messages", icon: MessageSquare, badge: 2, tone: "primary" },
    ],
  },
  {
    label: "Inventaris",
    items: [
      { title: "Produk & Harga", url: "/admin/products", icon: Package },
      { title: "Kategori", url: "/admin/categories", icon: FolderOpen },
      { title: "Transaksi Masuk", url: "/admin/inbound", icon: PackagePlus },
      { title: "Stock Opname", url: "/admin/stock-opname", icon: ClipboardCheck },
    ],
  },
  {
    label: "Pemasaran & Konten",
    items: [
      { title: "Diskon & Voucher", url: "/admin/discounts", icon: Ticket },
      { title: "Konten & Artikel", url: "/admin/content", icon: FileText },
    ],
  },
  {
    label: "Analitik",
    items: [
      { title: "Laporan", url: "/admin/reports", icon: BarChart2 },
      { title: "Alarm", url: "/admin/alarms", icon: Bell, badge: 5, tone: "alert" },
    ],
  },
  {
    label: "Sistem",
    items: [{ title: "Pengaturan", url: "/admin/settings", icon: Settings }],
  },
];

const ACTIVE = "bg-gradient-to-r from-primary to-[oklch(0.55_0.12_176)] !text-white shadow-lg shadow-primary/30 hover:!text-white";
const IDLE = "text-sidebar-foreground/70 hover:bg-white/10 hover:text-white";

type AdminUser = { name: string; email: string };

export function AppSidebar({ user }: { user: AdminUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const { setOpenMobile } = useSidebar();

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/login");
  }

  return (
    <Sidebar className="border-r-0">
      {/* subtle top glow */}
      <SidebarHeader className="relative p-4">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-primary/15 to-transparent" />
        <Link href="/admin" className="relative flex items-center gap-3 px-1" onClick={() => setOpenMobile(false)}>
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary to-[oklch(0.55_0.12_176)] text-lg font-extrabold text-white shadow-lg shadow-primary/40">
            S
          </span>
          <span className="leading-tight">
            <span className="font-heading block text-xl font-extrabold tracking-tight text-white">
              si4care
            </span>
            <span className="text-[10px] uppercase tracking-[0.24em] text-sidebar-foreground/45">Back-Office</span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-1.5">
        {navGroups.map((group) => (
          <SidebarGroup key={group.label} className="py-1">
            <SidebarGroupLabel className="px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-sidebar-foreground/35">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {group.items.map((item) => {
                  const active = pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        isActive={active}
                        tooltip={item.title}
                        className={`group/nav h-10 gap-3 rounded-xl px-3 transition-all ${active ? ACTIVE : IDLE}`}
                        render={<Link href={item.url} onClick={() => setOpenMobile(false)} />}
                      >
                        <item.icon className="shrink-0" />
                        <span className={active ? "font-semibold" : "font-medium"}>{item.title}</span>
                        {item.badge ? (
                          <span
                            className={`ml-auto grid h-5 min-w-5 place-items-center rounded-full px-1 text-[11px] font-bold ${
                              active
                                ? "bg-white/25 text-white"
                                : item.tone === "alert"
                                ? "bg-destructive text-white"
                                : "bg-primary text-white"
                            }`}
                          >
                            {item.badge}
                          </span>
                        ) : (
                          <ChevronRight className={`ml-auto h-4 w-4 shrink-0 transition-opacity ${active ? "opacity-80" : "opacity-0 group-hover/nav:opacity-40"}`} />
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="gap-2 p-3">
        <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-2.5 ring-1 ring-white/10">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-[oklch(0.55_0.12_176)] text-sm font-bold text-white">
            {getInitials(user.name)}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-semibold text-white">{user.name}</p>
            <p className="truncate text-[11px] text-sidebar-foreground/50">{user.email}</p>
          </div>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Bantuan" className={`h-9 rounded-xl ${IDLE}`} render={<Link href="/faq" />}>
              <HelpCircle />
              <span>Bantuan</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton className="h-9 rounded-xl text-red-300 hover:bg-destructive/20 hover:text-red-200" onClick={handleSignOut}>
              <LogOut />
              <span>Keluar</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
