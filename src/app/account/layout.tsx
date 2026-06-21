"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { User, MapPin, Package, Undo2, LogOut, MessageSquare } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { authClient } from "@/lib/auth/client";
import { getInitials } from "@/lib/utils";

const navItems = [
  { href: "/account", icon: User, label: "Profil Saya" },
  { href: "/account/addresses", icon: MapPin, label: "Buku Alamat" },
  { href: "/account/orders", icon: Package, label: "Riwayat Pesanan" },
  { href: "/account/returns", icon: Undo2, label: "Pengajuan Retur" },
  { href: "/account/chat", icon: MessageSquare, label: "Chat Admin" },
];

export default function AccountLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = authClient.useSession();

  async function handleSignOut() {
    await authClient.signOut();
    router.push("/login");
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted/20">
      <Navbar />
      <main className="flex-grow pt-24 pb-12">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar */}
            <aside className="w-full md:w-64 shrink-0">
              <div className="bg-card border rounded-xl p-4 sticky top-28 shadow-sm">
                <div className="flex items-center gap-4 mb-6 p-2">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-xl">
                    {session ? getInitials(session.user.name) : "…"}
                  </div>
                  <div>
                    <p className="font-bold">{session?.user.name ?? "Memuat…"}</p>
                    <p className="text-xs text-muted-foreground">{session?.user.email ?? ""}</p>
                  </div>
                </div>
                
                <nav className="flex flex-col space-y-1">
                  {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium ${
                          isActive 
                            ? "bg-primary/10 text-primary" 
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    );
                  })}
                  
                  <div className="pt-4 mt-4 border-t">
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium text-destructive hover:bg-destructive/10"
                    >
                      <LogOut className="h-4 w-4" />
                      Keluar
                    </button>
                  </div>
                </nav>
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1">
              {children}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
