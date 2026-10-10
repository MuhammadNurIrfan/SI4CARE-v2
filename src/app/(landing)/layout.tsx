import { ReactNode } from "react";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { FloatingContact } from "@/components/layout/floating-contact";
import { ContentProvider } from "@/context/ContentContext";
import { loadContent } from "@/lib/content-query";

// ISR: halaman publik di grup ini membaca DB (konten CMS, produk unggulan, artikel).
// Tanpa konfigurasi ini Next merender statis SAAT BUILD dan data "terbakar" sampai
// deploy berikutnya — edit admin tak pernah terlihat. Di development halaman selalu
// dirender ulang, jadi masalah ini hanya muncul di production. Aksi admin juga memanggil
// revalidatePath agar perubahan tampil seketika; angka ini hanya jaring pengaman.
export const revalidate = 60;

export default async function LandingLayout({ children }: { children: ReactNode }) {
  const content = await loadContent();

  return (
    <ContentProvider initialContent={content}>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
        <FloatingContact />
      </div>
    </ContentProvider>
  );
}
