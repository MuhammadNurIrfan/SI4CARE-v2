"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Mail, Lock, Phone, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Navbar } from "@/components/layout/navbar";
import { authClient } from "@/lib/auth/client";

export default function RegisterPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error: signUpError } = await authClient.signUp.email({
      name: `${firstName} ${lastName}`.trim(),
      email,
      password,
      phone,
    });
    setLoading(false);
    if (signUpError) {
      setError(signUpError.message ?? "Pendaftaran gagal. Coba lagi.");
      return;
    }
    router.push("/account");
  }

  async function handleGoogle() {
    await authClient.signIn.social({ provider: "google", callbackURL: "/account" });
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted/20">
      <Navbar />
      <main className="flex-grow flex items-center justify-center p-4 pt-24 pb-12">
        <Card className="w-full max-w-lg shadow-lg border-primary/10">
          <CardHeader className="space-y-2 text-center pb-6">
            <CardTitle className="text-3xl font-bold tracking-tight">Daftar Akun</CardTitle>
            <CardDescription className="text-base">
              Bergabung dengan si4care untuk pengalaman belanja alkes terbaik.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button type="button" variant="outline" className="w-full h-12 gap-2 font-medium" onClick={handleGoogle}>
              <svg xmlns="http://www.w3.org/2000/svg" height="20" viewBox="0 0 24 24" width="20">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Daftar dengan Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  Atau daftar dengan email
                </span>
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nama Depan</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                    <Input id="firstName" placeholder="Budi" className="pl-10 h-10" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nama Belakang</Label>
                  <Input id="lastName" placeholder="Santoso" className="h-10" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Nomor Telepon (WhatsApp)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input id="phone" type="tel" placeholder="081234567890" className="pl-10 h-10" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="nama@email.com" className="pl-10 h-10" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                  <Input id="password" type="password" className="pl-10 h-10" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <p className="text-xs text-muted-foreground">Minimal 8 karakter dengan kombinasi huruf dan angka.</p>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full h-11 text-base mt-4" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses...
                  </>
                ) : (
                  "Buat Akun"
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col border-t p-6 gap-4">
            <p className="text-xs text-center text-muted-foreground">
              Dengan mendaftar, Anda menyetujui Syarat & Ketentuan serta Kebijakan Privasi kami.
            </p>
            <p className="text-sm text-center text-muted-foreground">
              Sudah punya akun?{" "}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Masuk di sini
              </Link>
            </p>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}
