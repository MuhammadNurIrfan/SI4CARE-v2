import { ReactNode } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";

export default function CartLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-muted/20">
      <Navbar />
      <main className="flex-grow pt-20 md:pt-24">{children}</main>
      <Footer />
    </div>
  );
}
